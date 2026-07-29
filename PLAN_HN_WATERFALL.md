# Plan: Client-Side HN Waterfall + Server-Side SQLite Subtree Cache

## 1. Goals & Motivation

Replace the current setup (which uses two third-party HN API wrappers — the
official Firebase API and the HNPWA API — and pre-renders the entire nested
comment tree in a single server component call) with a thinner, cache-friendly
architecture:

- **Single upstream**: talk only to the official HN Firebase API
  (`https://hacker-news.firebaseio.com/v0`). Drop HNPWA entirely.
- **Depth-bounded client waterfall**: the server only returns a story plus its
  flat list of top-level comment IDs. The client walks the tree to depth 3 by
  firing one HN request per comment, with bounded concurrency.
- **"See more" expansion**: at depth 3, the "see more" affordance becomes an
  *in-place* action — clicking it triggers a fresh waterfall rooted at that
  comment, fetching the next 3 levels.
- **Page-by-page top-level rendering**: drop `@tanstack/react-virtual`
  (buggy scroll restoration). Render the first 100 top-level comments; a
  "Next page" button fetches the next 100.
- **Server-side SQLite cache for fresh posts only**: after the client finishes
  a waterfall, it POSTs the assembled subtree to the server, which persists it
  in SQLite. The server only caches data for posts created in the last 2
  months. Subsequent visitors (cache hits) skip the waterfall entirely.
- **Sequential, "falling" loading state**: each comment position renders a
  skeleton, then fades in (~200 ms) when its data arrives.

## 2. New Architecture (data flow)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                  BROWSER                               │
│                                                                        │
│  /post/[id]  (RSC shell, pre-renders header only)                      │
│      │                                                                 │
│      ▼                                                                 │
│  <Thread postId page=0 expanded=… />   "use client"                    │
│      │                                                                 │
│      ├── useQuery(["story", id, page]) ──────────► /api/story/[id]     │
│      │     returns: { post, topLevelIds[], initialSubtree[] }          │
│      │                                                                 │
│      ├── For each top-level comment:                                   │
│      │     useQuery(["comment", id]) ──────────► /api/comment/[id]    │
│      │     if level < 2: also fetch its kids                           │
│      │                                                                 │
│      ├── "Next page" button:                                           │
│      │     setPage(p+1), triggers new useQuery for page=p+1            │
│      │                                                                 │
│      ├── "See more" button (on depth-3 comment):                       │
│      │     expandSubtree(rootId) ──────► /api/subtree/[rootId]         │
│      │     if cache hit: subtree rendered immediately                  │
│      │     if cache miss: returns { root, kids[] }, client waterfalls   │
│      │                                                                 │
│      └── useEffect on assembled subtrees:                              │
│            POST /api/cache/subtree   { postId, comments: [...] }       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS (next.js route handlers)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS SERVER                            │
│                                                                        │
│  Route handlers (app/api/.../route.ts):                                │
│    GET  /api/story/[id]?page=N                                         │
│    GET  /api/comment/[id]                                              │
│    GET  /api/subtree/[rootId]                                          │
│    POST /api/cache/subtree                                             │
│                                                                        │
│       │                                                                │
│       ▼                                                                │
│  lib/server/hn.ts     (single HN client, official API only)            │
│  lib/server/cache.ts  (SQLite read/write helpers)                      │
│  lib/server/freshness.ts ("< 2 months old" predicate)                  │
│       │                                                                │
│       ▼                                                                │
│  /data/cache.db   (SQLite, mounted volume, see compose.yml)            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

The hnpwa.com dependency is removed. Every outbound HTTP request from the
server goes to `hacker-news.firebaseio.com/v0`.

## 3. SQLite Schema

Database file: `/data/cache.db` (configurable via `SLACKER_DB_PATH` env).
Library: `better-sqlite3` (synchronous, zero-config, no extra process).

```sql
-- 3a. One row per HN post. `kids` is the JSON-encoded top-level comment IDs
-- in HN's original order; we preserve order so the client can paginate.
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY,
  by          TEXT,
  time        INTEGER NOT NULL,        -- post creation time (Unix seconds)
  title       TEXT,
  url         TEXT,
  score       INTEGER,
  descendants INTEGER,                 -- total comment count
  kids_json   TEXT NOT NULL,           -- JSON array of top-level comment IDs
  cached_at   INTEGER NOT NULL         -- when this row was written
);

-- 3b. One row per cached comment. The tree is reconstructed via parent_id.
-- `kids_json` holds the children of THIS comment (so we can serve subtrees
-- without re-walking the post).
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY,
  post_id     INTEGER NOT NULL,        -- root post
  parent_id   INTEGER NOT NULL,        -- direct parent (post or comment)
  level       INTEGER NOT NULL,        -- depth from the root post (0-based)
  by          TEXT,
  time        INTEGER NOT NULL,
  text        TEXT,                    -- raw HTML, sanitized on render
  kids_json   TEXT NOT NULL,           -- JSON array of child comment IDs
  dead        INTEGER NOT NULL DEFAULT 0,
  deleted     INTEGER NOT NULL DEFAULT 0,
  cached_at   INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_level
  ON comments (post_id, level);

CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON comments (parent_id);
```

The freshness predicate (lib/server/freshness.ts) is:

```ts
export const TWO_MONTHS_SECONDS = 60 * 60 * 24 * 60; // 60 days

export function isFresh(postTime: number, now: number = Date.now() / 1000) {
  return now - postTime < TWO_MONTHS_SECONDS;
}
```

If `isFresh(post.time) === false`, the server **never** reads from or writes to
the cache for that post. The client must do the waterfall for every visit.

## 4. Server API Endpoints

All handlers live in `app/api/`. Each file is a `route.ts` with named exports
(GET / POST). Validation lives in the route file, business logic in
`lib/server/`.

### 4.1 `GET /api/story/[id]?page=N`

Returns the post plus the first 100 top-level comments (and their
subtrees, if cached). If a depth-3 subtree for a given top-level comment is
already in `comments`, the server returns it inline; otherwise it returns the
top-level ID without children so the client can waterfall.

```ts
// Response shape
type StoryResponse = {
  post: HNHit;                     // official API item shape (id, by, time, title, url, score, kids, descendants)
  topLevelIds: number[];           // full list, ordered (used for "next page" URLs)
  page: number;                    // echoed
  perPage: number;                 // 100
  // For each id in this page, either:
  initialSubtree: Array<
    | { id: number; cached: true; comment: CachedComment; children: SubtreeNode[] }
    | { id: number; cached: false } // client must fetch /api/comment/[id]
  >;
  cacheable: boolean;              // false if post > 2 months old
};
```

Algorithm:
1. `SELECT * FROM posts WHERE id = ?`
2. If miss → `hn.getItem(id)`, if `isFresh(post.time)` INSERT into `posts`
   (and set `cacheable: true`); else return `{ post, topLevelIds, initialSubtree: ids.map(cached:false), cacheable: false }`
3. If hit → return post; slice `kids_json` for the page; for each id in page,
   `SELECT * FROM comments WHERE post_id = ? AND id = ?`. If found and
   `level < 3`, also walk children recursively up to 3 levels using
   `kids_json`. Build `initialSubtree` accordingly.

### 4.2 `GET /api/comment/[id]`

Returns a single comment. Used by the client waterfall.

```ts
// Response
type CommentResponse =
  | { cached: true; comment: CachedComment }
  | { cached: false; comment: HNHit | null };  // null if deleted/missing
```

Algorithm:
1. `SELECT * FROM comments WHERE id = ?` → if hit, return.
2. Else `hn.getItem(id)`. If parent belongs to a post < 2 months old, INSERT
   into `comments` and return `{ cached: true, comment }`. Otherwise return
   `{ cached: false, comment }` (no write).

### 4.3 `GET /api/subtree/[rootId]`

Returns a depth-3 subtree rooted at `rootId`. Used by "see more".

```ts
type SubtreeResponse = {
  root: CachedComment | HNHit;
  // Levels 1, 2, 3 below root. Each entry is either cached (server has the
  // full comment) or just an ID (client must fetch /api/comment/[id]).
  levels: Array<Array<
    | { id: number; cached: true; comment: CachedComment; children: SubtreeNode[] }
    | { id: number; cached: false }
  >>;
  cacheable: boolean;
};
```

Algorithm:
1. Walk the `parent_id` chain in `comments` to find the root post id.
2. If `isFresh(post.time) === false`, return only the root's `kids[]` (no
   recursion) and `cacheable: false`.
3. Else: BFS the `comments` table for descendants of `rootId` up to level 3.
   Return whatever is in cache; for missing nodes, return `{ id, cached: false }`.

### 4.4 `POST /api/cache/subtree`

Client uploads a freshly assembled subtree. The server validates and writes
only if the post is fresh.

```ts
// Request
type CacheSubtreeRequest = {
  postId: number;
  postTime: number;     // so server can re-check freshness without a DB hit
  comments: CachedComment[];   // all comments the client fetched, in tree order
};

// Response
type CacheSubtreeResponse =
  | { accepted: true; inserted: number }
  | { accepted: false; reason: "post_too_old" | "validation_failed" };
```

Algorithm:
1. Validate body (zod or hand-rolled guard). Reject if `postId` missing or
   `comments` is not an array.
2. If `!isFresh(postTime)` → return `{ accepted: false, reason: "post_too_old" }`.
3. Open a transaction. For each comment: `INSERT … ON CONFLICT(id) DO UPDATE
   SET …` (UPSERT). For the post: same.
4. Return `{ accepted: true, inserted: N }`.

## 5. Shared types & HN client

### 5.1 `lib/server/hn.ts` (new)

Single wrapper around the official API. Replaces `app/hackernews-api/index.ts`
(kept as a thin re-export for back-compat) and fully replaces
`app/hackernews-api/hnpwa.ts` (deleted).

```ts
const HN_BASE = "https://hacker-news.firebaseio.com/v0";

export type HNHit =
  | HNStory | HNComment | HNAsk | HNJob | HNPoll | HNPollOpt | null;

export async function getItem(id: number | string, opts?: { signal?: AbortSignal }): Promise<HNHit> { ... }
export async function getTopIds(type: "top" | "new" | "best" | "ask" | "show" | "job"): Promise<number[]> { ... }
export async function getUser(id: string): Promise<HNUser | null> { ... }
```

All fetches use Next.js's `fetch()` with `next: { revalidate: 60 }` so we
don't hammer HN.

### 5.2 `lib/types.ts` (new, replaces `app/hackernews-api/types.d.ts`)

```ts
// Move global HN types out of the d.ts file and into a real .ts so they
// can be imported from both server and client.
export interface HNStory { id: number; by: string; time: number; title: string; url?: string; score: number; descendants: number; kids: number[]; type: "story"; }
export interface HNComment { id: number; by?: string; time: number; text?: string; parent: number; kids?: number[]; type: "comment"; dead?: boolean; deleted?: boolean; }
// ...etc

// CachedComment = the normalized shape we store / return from the cache.
// It strips HNPWA's pre-nested `comments` and `level` fields, replacing them
// with `parent_id` and `level` relative to the post.
export interface CachedComment {
  id: number;
  post_id: number;
  parent_id: number;
  level: number;        // 0 = top-level
  by: string | null;
  time: number;
  text: string | null;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}
```

### 5.3 `lib/server/cache.ts` (new)

Synchronous helpers wrapping `better-sqlite3`. Single shared connection.

```ts
import Database from "better-sqlite3";
let _db: Database.Database | null = null;
export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(process.env.SLACKER_DB_PATH ?? "/data/cache.db");
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA_SQL);
  return _db;
}

export function getPost(id: number) { ... }
export function getComment(id: number) { ... }
export function getSubtree(postId: number, rootId: number, maxLevel: number) { ... }
export function upsertPost(post: HNHit) { ... }
export function upsertComments(comments: CachedComment[]) { ... }
```

`better-sqlite3` is sync so we can call it directly inside route handlers
without `await`.

## 6. Client-Side State & Waterfall

### 6.1 React Query setup

`app/providers.tsx` already exists. Add `<QueryClientProvider>` with a client
that has `staleTime: 30_000`, `gcTime: 5 * 60_000`. Use
`@tanstack/react-query` (already a dependency, currently unused).

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});
export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

### 6.2 `lib/client/waterfall.ts` (new)

Implements the depth-3 fetch cascade. Uses `p-limit` (already a dependency).

```ts
import pLimit from "p-limit";

export async function fetchSubtreeToDepth(
  rootIds: number[],
  maxDepth: number,
  concurrency = 8,
  fetcher: (id: number) => Promise<CachedComment | null>,
  onProgress?: (comment: CachedComment, depth: number) => void,
): Promise<CachedComment[]> { ... }
```

Behavior:
- BFS queue of `(id, depth)` starting from `rootIds @ depth 0`.
- `p-limit(8)` over the fetch step. After each comment resolves, push its
  `kids` onto the queue at `depth + 1` if `depth + 1 < maxDepth`.
- Call `onProgress(comment, depth)` immediately so the UI can render the
  comment as it arrives (this is what produces the "falling down" effect).

### 6.3 `app/post/components/thread.tsx` (replaces `virtual-thread.tsx`)

The new client component. No virtualization. Render the first 100 top-level
comments on `page=0`, with a "Next page" button at the bottom.

```tsx
"use client";

export function Thread({ postId, initialPage = 0 }: { postId: string; initialPage?: number }) {
  const [page, setPage] = useState(initialPage);
  const { data: story, isLoading } = useQuery({
    queryKey: ["story", postId, page],
    queryFn: () => fetch(`/api/story/${postId}?page=${page}`).then(r => r.json()),
  });

  // For each top-level comment in this page:
  //   - If server already returned it cached, render it directly.
  //   - Otherwise, call useSubtree(initialId) which fires the waterfall
  //     and renders incrementally.
  return (
    <div>
      {story?.initialSubtree.map(node =>
        node.cached
          ? <Comment key={node.id} comment={node.comment} children={node.children} onExpand={...} />
          : <SubtreeFetcher key={node.id} rootId={node.id} maxDepth={3} />
      )}
      {story && page * 100 + 100 < story.topLevelIds.length && (
        <Button onClick={() => setPage(p => p + 1)}>Next page</Button>
      )}
    </div>
  );
}
```

`SubtreeFetcher` is the component that runs the waterfall and renders
comments as they arrive:

```tsx
function SubtreeFetcher({ rootId, maxDepth }: { rootId: number; maxDepth: number }) {
  const [nodes, setNodes] = useState<Record<number, CachedComment>>({});
  const [order, setOrder] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchSubtreeToDepth(
      [rootId],
      maxDepth,
      8,
      (id) => fetch(`/api/comment/${id}`).then(r => r.json()).then(d => d.comment ?? null),
      (comment, depth) => {
        if (cancelled) return;
        setNodes(prev => ({ ...prev, [comment.id]: comment }));
        setOrder(prev => prev.includes(comment.id) ? prev : [...prev, comment.id]);
      },
    );
    return () => { cancelled = true; };
  }, [rootId, maxDepth]);

  // Render in arrival order. Each <Comment> wraps a <FadeIn>.
  return <>{order.map(id => <FadeIn key={id}><Comment comment={nodes[id]} ... /></FadeIn>)}</>;
}
```

### 6.4 "See more" handler

When a depth-3 comment has `kids` not yet fetched, the comment renders a
"See N replies" button. On click:

```ts
async function expandSubtree(rootId: number) {
  const res = await fetch(`/api/subtree/${rootId}`).then(r => r.json());
  if (res.cacheable && res.levels.every(level => level.every(n => n.cached))) {
    // All hits — render immediately
    setExpanded(prev => ({ ...prev, [rootId]: res }));
  } else {
    // Some misses — start a fresh waterfall rooted at this comment's kids
    setExpanded(prev => ({ ...prev, [rootId]: { loading: true } }));
    await fetchSubtreeToDepth([rootId], 3, 8, ...);
    // Then POST to /api/cache/subtree to share with the next visitor
  }
}
```

### 6.5 Auto-POST after waterfall

`SubtreeFetcher` runs once. After the waterfall resolves, fire a single
`POST /api/cache/subtree` with the assembled comments:

```ts
useEffect(() => {
  if (!done) return;
  fetch("/api/cache/subtree", {
    method: "POST",
    body: JSON.stringify({ postId, postTime, comments: Object.values(nodes) }),
  });
}, [done]);
```

This is best-effort. Failures are silently dropped (Sentry captures them).

## 7. UI: Loading State & Animations

### 7.1 Placeholder

Reuse the existing `Skeleton` component from `components/ui/skeleton.tsx`.
Render a `LoadingComment` for each top-level position in the current page
before data arrives. The current `app/post/[id]/loading.tsx` already does
this; we keep its visual style.

### 7.2 Fade-in

New `components/ui/fade-in.tsx`:

```tsx
"use client";
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
```

Add to `tailwind.config.ts`:

```ts
keyframes: {
  "fade-in": {
    "0%":   { opacity: "0", transform: "translateY(4px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
},
animation: { "fade-in": "fade-in 200ms ease-out forwards" },
```

Each comment that arrives via the waterfall is wrapped in `<FadeIn>`. The
"falling down" feel is automatic: as new comments are appended to the
React tree, the browser reflows existing content downward, and the new
node animates in.

### 7.3 Stagger

Optionally stagger by depth: top-level comments use 0 ms delay, their
children 30 ms, grandchildren 60 ms. This produces a cascade within the
cascade. Add a `--depth` CSS variable on the wrapper so the Tailwind
plugin can read it; or compute `delay = depth * 30` inline. Use inline
to keep config simple.

## 8. Files

### 8.1 New

| Path | Purpose |
|---|---|
| `lib/server/hn.ts` | Single official HN client |
| `lib/server/cache.ts` | better-sqlite3 connection + queries |
| `lib/server/freshness.ts` | `isFresh()` predicate |
| `lib/types.ts` | Moved types from `app/hackernews-api/types.d.ts` |
| `lib/client/waterfall.ts` | BFS-to-depth-N fetcher |
| `app/api/story/[id]/route.ts` | GET story + initial subtree |
| `app/api/comment/[id]/route.ts` | GET single comment |
| `app/api/subtree/[rootId]/route.ts` | GET depth-3 subtree |
| `app/api/cache/subtree/route.ts` | POST upload |
| `app/post/components/thread.tsx` | New client component (replaces `virtual-thread.tsx`) |
| `app/post/components/subtree-fetcher.tsx` | Waterfall renderer |
| `components/ui/fade-in.tsx` | Animation wrapper |
| `data/` | Mounted volume for `cache.db` |

### 8.2 Modified

| Path | Change |
|---|---|
| `app/providers.tsx` | Wrap in `<QueryClientProvider>` |
| `app/layout.tsx` | Use `<Providers>` (already does) |
| `app/post/[id]/page.tsx` | Pre-render only the post header; render `<Thread postId={id} />` |
| `app/components/comment-page.tsx` | Replace `getItem` + `getItemById` with `Thread` data source |
| `app/post/[id]/layout.tsx` | No change (still sets metadata) |
| `app/comment/[id]/page.tsx` | Replace `getCommentPost` walk with one `getItem` (need parent_id → root) |
| `app/user/[id]/page.tsx` | Switch from HNPWA to official API for user.submitted |
| `tailwind.config.ts` | Add `fade-in` keyframes + animation |
| `compose.yml` | Add `data` volume mount to the `app` service |
| `Dockerfile` | No change (better-sqlite3 builds at install time) |
| `package.json` | Add `better-sqlite3`, `zod` (for route validation). Remove `react-tooltip@latest` broken link. |

### 8.3 Deleted

| Path | Why |
|---|---|
| `app/hackernews-api/hnpwa.ts` | Replaced by official API only |
| `app/hackernews-api/utils.ts` | `convertPostToPWA` no longer needed |
| `app/hackernews-api/retry.ts` | Dead code, unused |
| `app/hackernews-api/constants.ts` | Reduce to just `POSTS_PER_PAGE_LIMIT` if still needed; otherwise drop |
| `app/hackernews-api/index.ts` | Becomes a thin re-export of `lib/server/hn.ts` for back-compat, then deleted |
| `app/hackernews-api/types.d.ts` | Replaced by `lib/types.ts` |
| `app/post/components/virtual-thread.tsx` | Replaced by `thread.tsx` |
| `app/post/components/static-thread.tsx` | Already unused |
| `app/post/components/static-collapsible.tsx` | Already unused |
| `app/post/components/useCollapse.ts` | Already unused |
| `app/post/components/collapsible.tsx` | Replaced by simple expand/collapse state in `thread.tsx` (or kept if user still wants sessionStorage persistence) |
| `types/hn-wrapper.d.ts` | Already unused |

## 9. Step-by-step implementation order

Each step is independently shippable. After every step, the app still
builds and runs.

1. **Install deps** — `pnpm add better-sqlite3 zod && pnpm remove @tanstack/react-virtual react-tooltip@latest`. Update `package.json`. (Delete the broken `react-tooltip@latest` link alias.)
2. **Schema + cache layer** — write `lib/server/cache.ts`, `lib/server/freshness.ts`. Add `data/` dir and a `.gitkeep`. No behavior change yet.
3. **Single HN client** — write `lib/server/hn.ts`. Keep `app/hackernews-api/index.ts` as a re-export. Add a unit test that round-trips a known story id.
4. **Type consolidation** — move types to `lib/types.ts`. Update imports across the codebase. Drop `app/hackernews-api/types.d.ts`.
5. **Remove HNPWA** — delete `app/hackernews-api/hnpwa.ts` and `utils.ts`. Update every call site to use `lib/server/hn.ts`. (User pages still need submitted IDs, which the official API returns on `getUser`.) Verify the build.
6. **First API endpoint** — implement `GET /api/comment/[id]`. Wire it up in a test page or curl. Verify it reads + writes the cache.
7. **Story endpoint** — implement `GET /api/story/[id]?page=N`. Verify the DB round-trips.
8. **Subtree endpoint** — implement `GET /api/subtree/[rootId]`.
9. **Cache write endpoint** — implement `POST /api/cache/subtree`.
10. **Client waterfall helper** — write `lib/client/waterfall.ts` with a unit test (using a fake `fetcher`).
11. **React Query providers** — wire `<QueryClientProvider>` in `app/providers.tsx`.
12. **New `Thread` component** — write `app/post/components/thread.tsx` and `subtree-fetcher.tsx`. Replace the import in `app/post/[id]/page.tsx`.
13. **Fade-in animation** — add `components/ui/fade-in.tsx` and Tailwind keyframes.
14. **"See more" button** — wire it to `expandSubtree()`. Persist expanded IDs in component state (URL state is a nice-to-have, not required for v1).
15. **Pagination** — add page state + "Next page" button.
16. **Auto-cache POST** — fire the POST after each waterfall resolves.
17. **Delete dead files** — remove `virtual-thread.tsx`, `static-thread.tsx`, `static-collapsible.tsx`, `useCollapse.ts`. Decide on `collapsible.tsx` (collapse-to-placeholder is still useful; keep it).
18. **Volume mount** — add `data` volume to `compose.yml`.
19. **Final pass** — remove unused exports, fix lint, run `pnpm build`, smoke test `/post/1`, `/post/8863` (the Ask HN: worst thing you've seen code do thread, very large), `/user/pg`.

## 10. Open questions / revisit later

- **Pagination state**: URL-driven (`?page=2`) vs session-only. URL is better for shareability. Decide during step 15.
- **Expansion state**: same question for `?expanded=1,2,3`. Start session-only, add URL later if requested.
- **Single-flight on the server**: if 50 visitors hit a fresh post simultaneously, they all waterfall. Add a `Map<postId, Promise>` deduplicator in `lib/server/hn.ts` once the basic flow works. Not required for v1.
- **Background revalidation**: today, stale cache rows are only refreshed when something forces a fetch. Add a periodic task (`setInterval` in `instrumentation.ts`) that re-fetches posts whose `cached_at` is older than the post's age tolerance. Defer to v2.
- **Single-user rate limiting**: HN asks for ≤1 req/sec per user. The client uses `p-limit(8)` for the waterfall, which is the per-tab limit. Add a global cap (e.g. `p-limit(20)` across all in-flight queries) if we see abuse.
- **Concurrency on the client**: 8 is a guess. Profile with real threads before tuning.
- **Stagger timing**: 30 ms × depth is a guess. Tune in browser.
- **The `collapsible.tsx` collapse-to-placeholder behavior**: keep as-is, or drop now that "see more" replaces the role of collapsing? Recommendation: keep it, the user already uses it for "hide this huge subthread I don't care about".
- **Worker thread for SQLite**: not needed for the expected write rate (~tens of inserts per minute worst case), but if we ever cache stories server-side from a background job, move to a worker.

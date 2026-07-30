# Plan / Architecture: Server-Side HN Subtree Cache + Client Cascade

> This document describes the **as-built** architecture. It was originally a
> design plan; the section below reflects what is actually implemented.

## 1. Goals & Motivation

Replace the old setup (two third-party HN API wrappers — the official Firebase
API and the HNPWA API — with a single pre-rendered server component call) with a
cache-friendly architecture:

- **Single upstream**: talk only to the official HN Firebase API
  (`https://hacker-news.firebaseio.com/v0`). Drop HNPWA entirely.
- **Server-side ingestion**: a long-running ingest service continuously pulls
  fresh posts (and their comment trees) into a local SQLite cache. Visitors to a
  fresh post never hit the HN API for the subtree — it is served from SQLite.
- **Two client rendering paths**, chosen per-post by the server:
  - **Fresh post (≤ 30 days)** → the server returns a cached subtree (built from
    SQLite) and the client renders it recursively up to `MAX_INLINE_DEPTH = 4`.
    Any top-level chain not yet in cache is batch-fetched on demand.
  - **Stale post (> 30 days)** → **client-side only**. The server reads/writes
    nothing for it; the client fetches each comment directly from HN via a
    lazy-loading cascade (IntersectionObserver + bounded concurrency).
- **Depth-bounded inline rendering**: comments render inline to depth 4. At
  depth 4, any comment that still has children shows a "See N replies →" link to
  the context page (`/post/:id/comment/:cid`), which loads the full subthread.
- **Bounded concurrency & lazy loading** for the stale/client-side path so large
  threads do not fire hundreds of simultaneous requests or jank the main thread.

## 2. Architecture (data flow)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              INGEST SERVICE                            │
│  scripts/ingest.ts  (bundled → scripts/ingest-bundle.js, run by Docker)│
│                                                                        │
│   loops forever: backfill + feeds + updates, then evictStale()         │
│       │                                                                │
│       ▼  fetchItemRaw(id) per item, walkCommentTree()                  │
│   lib/server/cache.ts  upsertPost / upsertComments  (SQLite)           │
│       │                                                                │
│       ▼                                                                │
│   /data/cache.db   (SQLite, mounted volume, see compose.yml)           │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ reads/writes only when isFresh(postTime)
┌──────────────────────────────────┴─────────────────────────────────────┐
│                              NEXT.JS SERVER                            │
│                                                                        │
│  app/post/[id]/page.tsx  (RSC shell)                                   │
│      └─ getStoryPage({ postId, page })                                 │
│            • if cached + isFresh → returns cached subtree (depth 4)     │
│            • if fresh but not cached → upsertPost + prefetchSubtree     │
│            • if stale  → returns post + topLevelIds only, stale:true    │
│                                                                        │
│  app/components/comment-page.tsx  (/post/:id/comment/:cid context)     │
│      └─ getCachedSubtree(rootId, 100) for initial render               │
│                                                                        │
│  Route handlers (app/api/.../route.ts):                                │
│    GET  /api/story/[id]?page=N        (server-side, also used directly)│
│    GET  /api/comment/[id]             (cached-or-raw; write-through)   │
│    GET  /api/subtree/[rootId]         (full cached subtree)            │
│    POST /api/subtree/batch            (batch fetch+cache for client)   │
│    POST /api/cache/subtree            (client write-back, legacy)      │
│                                                                        │
│  lib/server/hn.ts        single HN client (rate-limited, revalidate 60)│
│  lib/server/cache.ts     better-sqlite3 read/write + prefetch          │
│  lib/server/freshness.ts isFresh() — "< 30 days old" predicate         │
│  lib/server/ingest.ts    ingest service logic (also invoked by bundle) │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ RSC props / fetch
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                  BROWSER                               │
│                                                                        │
│  /post/[id]  ── RSC ──► <Thread data={storyResponse} />                │
│                                                                        │
│   if data.stale (post > 30 days):                                      │
│     <CommentCascade>  "use client"                                     │
│        • each top-level renders a <CommentChain>                        │
│        • CommentChain: IntersectionObserver (rootMargin 50px) triggers  │
│          fetch; fetches via fetchHnComment() → HN directly              │
│        • bounded by a module queue MAX_CONCURRENT = 4, 8s timeout      │
│        • at depth 4 w/ kids → "See N replies →" link                    │
│                                                                        │
│   else (fresh):                                                        │
│     <CachedCommentsList>  "use client"                                 │
│        • renders cached tree to depth 4 (seeded from RSC props)        │
│        • top-level chains not in cache → POST /api/subtree/batch        │
│          (fetchSubtreeBatched, chunked) to fill the rest               │
│        • at depth 4 w/ kids → "See N replies →" link                    │
│                                                                        │
│  /post/[id]/comment/[cid]  ── RSC ──► <CommentPage>                    │
│     • Post + target comment + <CommentSubtree>                         │
│     • CommentSubtree seeds from getCachedSubtree, then batch-fetches   │
│       the remaining replies via /api/subtree/batch (maxDepth 100)       │
│                                                                        │
│  /comment/[cid]  ── fallback when a comment has no known post          │
│     • resolves parent post, then renders same CommentPage flow          │
└────────────────────────────────────────────────────────────────────────┘
```

All outbound server HTTP goes to `hacker-news.firebaseio.com/v0`.

## 3. SQLite Schema

Database file: `/data/cache.db` (configurable via `SLACKER_DB_PATH` env).
Library: `better-sqlite3` (synchronous, zero-config, no extra process).
Connection: `db()` in `lib/server/cache.ts`, WAL mode, `synchronous = NORMAL`,
`busy_timeout = 5000`.

```sql
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY,
  by          TEXT NOT NULL,
  time        INTEGER NOT NULL,        -- post creation time (Unix seconds)
  title       TEXT NOT NULL,
  url         TEXT,
  score       INTEGER NOT NULL DEFAULT 0,
  descendants INTEGER NOT NULL DEFAULT 0,
  kids_json   TEXT NOT NULL DEFAULT '[]',  -- JSON array of top-level comment IDs
  cached_at   INTEGER NOT NULL         -- when this row was written
);

CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY,
  post_id     INTEGER NOT NULL,        -- root post
  parent_id   INTEGER NOT NULL,        -- direct parent (post or comment)
  level       INTEGER NOT NULL,        -- depth from the root post (1-based)
  by          TEXT,                    -- nullable for deleted/unknown
  time        INTEGER NOT NULL,
  content     TEXT,                    -- raw HTML, sanitized on render
  kids_json   TEXT NOT NULL DEFAULT '[]',
  dead        INTEGER NOT NULL DEFAULT 0,
  deleted     INTEGER NOT NULL DEFAULT 0,
  cached_at   INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_level ON comments (post_id, level);
```

### Freshness predicate — `lib/server/freshness.ts`

```ts
export const MAX_CACHE_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const FRESH_MS = MAX_CACHE_AGE_SECONDS * 1000;

export function isFresh(postTime: number, now: number = Date.now() / 1000): boolean {
  return now - postTime < MAX_CACHE_AGE_SECONDS;
}
```

If `isFresh(post.time) === false`, the server **never** reads from or writes to
the cache for that post — every read goes straight to HN and the client renders
via the cascade. The ingest service additionally purges any row whose `time` is
older than the cutoff (`evictStale` in `ingest.ts`, run each wave).

## 4. Server API Endpoints

All handlers live in `app/api/`. Validation lives in the route file; business
logic in `lib/server/`.

### 4.1 `GET /api/story/[id]?page=N`

Returns the post plus the page of top-level comment IDs and, for fresh posts,
the cached subtree built from SQLite. Dispatches to `getStoryPage`.

```ts
type StoryResponse = {
  post: HNPost;
  topLevelIds: number[];          // full list, ordered (used for "next page")
  page: number;
  perPage: number;                // 20 (PER_PAGE)
  initialSubtree: Array<
    | { id: number; cached: true; comment: CachedComment; children: SubtreeNode[] }
    | { id: number; cached: false }   // client must fetch
  >;
  cacheable: boolean;              // false if post > 30 days old
  stale: boolean;                  // true → client renders the cascade
};
```

`getStoryPage` logic:
1. `getCachedPost(id)` — returns the post only if present **and** `isFresh`.
   - If hit: slice `kids_json` for the page, build the cached tree to
     `MAX_INITIAL_DEPTH` (4) via `buildInitialSubtree`, `stale: false`.
2. If miss: `getItem(id)`. If it is a story:
   - `cacheable = isFresh(postTime)`. If cacheable, `upsertPost` + `prefetchSubtree`
     (background server-side walk of the tree into SQLite) and return the cached
     subtree for page 0.
   - If not cacheable (`stale`): return `{ post, topLevelIds, initialSubtree: [],
     cacheable: false, stale: true }` — the client fetches everything from HN.

### 4.2 `GET /api/comment/[id]`

Used by the stale/post cascade (`fetchServerComment`). Returns a single comment:
cached hit, or raw HN item. On a cache miss, if the comment's parent is already
cached (and belongs to a fresh post), it is written through via `upsertComments`.

```ts
type CommentResponse =
  | { cached: true; comment: CachedComment }
  | { cached: false; comment: RawComment | null };
```

### 4.3 `GET /api/subtree/[rootId]`

Returns the full cached subtree rooted at `rootId` (depth 100). Returns
`cacheable: false` + 404 if the root is not cached. (Not currently used by the
client — the context page reads the cache server-side — but kept as an API.)

### 4.4 `POST /api/subtree/batch`

The workhorse for the **fresh path** and the **context page**. The client posts a
list of IDs and the server returns whatever is cached, **fetching + caching the
missing ones** from HN in one shot (`fetchAndCacheComments`), then returns the
next cursor for the remaining IDs. The client loops with `fetchSubtreeBatched`
(`lib/client/waterfall.ts`), chunked (`chunkSize: 20`, `MAX_LIMIT: 100`).

```ts
type SubtreeBatchRequest = {
  ids: number[]; cursor: number; limit: number;
  postId: number; baseLevel: number; postTime?: number;
};
type SubtreeBatchResponse = {
  comments: CachedComment[]; missing: number[];
  nextCursor: number; hasMore: boolean; total: number;
};
```

### 4.5 `POST /api/cache/subtree`

Legacy client write-back (`CacheSubtreeRequest` → `upsertComments`). Retained for
back-compat; the active write path is the server-side ingest service, not client
uploads.

## 5. Server ingestion service — `scripts/ingest.ts`

A standalone Node process (bundled with esbuild → `scripts/ingest-bundle.js`,
run by the `ingestor` Docker service). It keeps SQLite populated with fresh-post
subtrees so the read path rarely hits HN.

- `ingestPost(id)` — fetch the story; if `!isFresh` skip. Otherwise `upsertPost`
  and `walkCommentTree` (BFS with `p-limit(16)`), writing every comment via
  `upsertComments`.
- `backfill({ concurrency, budget, signal })` — walk recent item IDs downward
  from `maxitem` until a long `staleStreak` of old items is hit.
- `ingestUpdates(ids)` / `ingestFeeds(types)` — consume the HN `/updates.json`
  and feed endpoints; each only writes `isFresh` items.
- `evictStale(nowSec)` — `DELETE FROM posts/comments WHERE time < now - 30 days`.
  Called on boot and at the end of every loop iteration, so anything older than
  the freshness window is purged from the cache.

Running it:

```bash
pnpm build:ingest        # esbuild → scripts/ingest-bundle.js
pnpm ingest              # build + node --env-file=.env scripts/ingest-bundle.js
```

> Note: because the running service uses the **bundled** file, the bundle must be
> rebuilt after any change to `lib/server/*` (e.g. a freshness-window change).

## 6. Shared types & HN client

- `lib/types.ts` — `HNPost` / `HNComment` / `CachedComment` / `SubtreeNode` /
  `StoryResponse` / `CommentResponse` / `CacheSubtreeRequest`. Constants:
  `PER_PAGE = 20`, `MAX_INITIAL_DEPTH = 4`, and re-exported
  `MAX_CACHE_AGE_SECONDS`, `isFresh`.
- `lib/server/hn.ts` — single wrapper around the official API (`getItem`,
  `getTopIds`, `getUser`, `getParentPost`, …). All fetches go through
  `withHnRateLimit` (`lib/server/rate-limit.ts`) and use
  `next: { revalidate: 60 }`.
- `lib/server/cache.ts` — synchronous `better-sqlite3` helpers: `getCachedPost`,
  `getCachedComment`, `getCachedSubtree`, `getCachedComments`, `upsertPost`,
  `upsertComments`, `fetchAndCacheComments` (batch fetch-or-cache),
  `prefetchSubtree` (server-side tree walk), `evictStaleCache`. Every write is
  gated by `isFresh(postTime)`.

## 7. Client-side rendering

### 7.1 React Query

`app/providers.tsx` wraps the app in `<QueryClientProvider>` with
`staleTime: 30_000`, `gcTime: 24h`, `refetchOnWindowFocus: false`, `retry: 1`.
Comment queries use the key `["comment", id]` with `staleTime: Infinity`.

### 7.2 Fresh path — `CachedCommentsList` (`app/post/components/cached-comments.tsx`)

- Seeds from the RSC-provided `initialSubtree` (cached nodes render immediately).
- For each top-level ID not in cache, calls `fetchSubtreeBatched` →
  `POST /api/subtree/batch`, rendering a sticky progress bar while loading.
- Renders recursively (`CommentNode`) to `MAX_INLINE_DEPTH = 4`.
- At depth 4 with kids → `SeeMore` link to `/post/:id/comment/:cid`.

### 7.3 Stale path — `CommentCascade` + `CommentChain`

(`app/post/components/comment-cascade.tsx`, `comment-chain.tsx`)

- The first top-level chain is `eager` (renders immediately); the rest are lazy.
- Each `CommentChain` uses `useNearViewport` (IntersectionObserver,
  `rootMargin: 50px`) to trigger its fetch only when near the viewport.
- Fetches go through `fetchHnComment` → `fetchHnItem` (direct HN fetch,
  `lib/client/hn-direct.ts`).
- A module-level sequential queue in `lib/client/comment-source.ts` bounds
  in-flight requests to `MAX_CONCURRENT = 4`, with an 8s per-fetch timeout
  (`Promise.race`). Both `fetchServerComment` and `fetchHnComment` share it.
- Recurses inline to `MAX_INLINE_DEPTH = 4`; at depth 4 with kids →
  `SeeInContext` link to the context page.
- Sanitization: `HNComment` lazy-imports `sanitize-html` client-side
  (`lib/client/sanitize-comment.ts`) because HN `content` is raw HTML.

### 7.4 Context page — `CommentSubtree` (`app/components/comment-subtree.tsx`)

Used by `/post/:id/comment/:cid` (and `/comment/:cid` after resolving the post).
Seeded server-side from `getCachedSubtree(rootId, 100)`; remaining replies are
batch-fetched via `/api/subtree/batch` (`maxDepth: 100`). Renders each reply
with a `Collapsible` and a depth-colored left border.

### 7.5 Collapsible

`app/post/components/collapsible.tsx` — expand/collapse a comment's subtree,
persisted in `sessionStorage` per `persistId` (`collapse:<id>`).

## 8. UI: loading state & animations

### 8.1 Placeholder

Reuse the existing `Skeleton` (`components/ui/skeleton.tsx`) for per-comment
loading positions (both paths) and a sticky progress bar while a batch fetch is
in flight.

### 8.2 Fade-in — `components/ui/fade-in.tsx`

```tsx
"use client";
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}
```

`tailwind.config.ts`:

```ts
keyframes: {
  "fade-in": {
    "0%":   { opacity: "0", transform: "translateY(4px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
},
animation: { "fade-in": "fade-in 200ms ease-out both" },
```

> The fill mode is **`both`** (not `forwards`): during the `animationDelay`, the
> element is held at the 0% keyframe (opacity 0) so it fades in smoothly instead
> of flashing visible→invisible→visible. Each comment is staggered by depth
> (`delay = min((depth - 1) * 30, 200)` ms).

## 9. Files

### 9.1 Server / lib

| Path | Purpose |
|---|---|
| `lib/server/hn.ts` | Single official HN client (rate-limited, revalidate 60) |
| `lib/server/cache.ts` | better-sqlite3 connection + read/write/prefetch/evict |
| `lib/server/freshness.ts` | `MAX_CACHE_AGE_SECONDS` + `isFresh()` predicate |
| `lib/server/rate-limit.ts` | HN request rate limiter |
| `lib/server/story.ts` | `getStoryPage` — fresh/stale decision + subtree build |
| `lib/server/ingest.ts` | Ingest service logic (backfill/feeds/updates/evict) |
| `lib/types.ts` | Shared HN + cache types and constants |
| `lib/client/waterfall.ts` | `fetchSubtreeBatched` (chunked batch fetch) |
| `lib/client/comment-source.ts` | Client fetch queue (MAX_CONCURRENT=4) + `fetchServerComment`/`fetchHnComment` |
| `lib/client/hn-direct.ts` | Direct client-side HN item fetch (stale path) |
| `lib/client/sanitize-comment.ts` | Lazy `sanitize-html` for raw HN HTML |

### 9.2 API routes

| Path | Method | Purpose |
|---|---|---|
| `app/api/story/[id]/route.ts` | GET | story + initial subtree (`getStoryPage`) |
| `app/api/comment/[id]/route.ts` | GET | single comment (cached-or-raw, write-through) |
| `app/api/subtree/[rootId]/route.ts` | GET | full cached subtree |
| `app/api/subtree/batch/route.ts` | POST | batch fetch-or-cache (client-driven) |
| `app/api/cache/subtree/route.ts` | POST | legacy client write-back |

### 9.3 Client components

| Path | Role |
|---|---|
| `app/post/[id]/page.tsx` | RSC shell → `Thread` |
| `app/post/components/thread.tsx` | branches on `data.stale` (cascade vs cached list) |
| `app/post/components/comment-cascade.tsx` | stale path: top-level orchestrator (eager + lazy) |
| `app/post/components/comment-chain.tsx` | stale path: single chain (IO, queue, depth cutoff) |
| `app/post/components/cached-comments.tsx` | fresh path: recursive cached list + batch fill |
| `app/post/components/collapsible.tsx` | collapse/expand a subtree |
| `app/components/comment-page.tsx` | context page (`/post/:id/comment/:cid`, `/comment/:cid`) |
| `app/components/comment-subtree.tsx` | context page subthread renderer |
| `components/comment-body.tsx` | presentational comment card |
| `components/ui/fade-in.tsx` | fade-in wrapper |
| `components/ui/skeleton.tsx` | loading placeholder |

### 9.4 Infra

| Path | Purpose |
|---|---|
| `compose.yml` | `ingestor` + `app` services share `cache-data` volume; fronted by `anubis` + `nginx` |
| `Dockerfile` | builds `next` standalone **and** runs `pnpm build:ingest` so the bundle ships in the image |
| `scripts/ingest.ts` | ingest service source |
| `scripts/ingest-bundle.js` | esbuild output (runs in the `ingestor` container) |

## 10. Open questions / revisit later

- **Eviction granularity**: `evictStale` deletes by item `time`, not `cached_at`.
  A fresh post viewed yesterday keeps its rows until the post itself ages past 30
  days; `evictStaleCache()` (cached_at-based, currently unused) is an alternative
  if we want TTL-style expiry independent of post age.
- **Single-flight on the server**: many simultaneous visitors to a fresh post
  each trigger `fetchSubtreeBatched` / `prefetchSubtree`. A `Map<postId, Promise>`
  deduplicator in `lib/server/hn.ts` or `cache.ts` would collapse these.
- **Background revalidation**: stale cache rows are only refreshed when
  something forces a fetch. A periodic task could re-fetch fresh posts whose
  `cached_at` is old.
- **Stagger timing**: 30 ms × depth is a guess; tune in-browser.
- **Context-page validation**: a comment ID supplied on `/post` is not yet
  validated to belong to that post (see README TODO).

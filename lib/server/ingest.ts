import pLimit from "p-limit";
import { db, upsertPost, upsertComments } from "./cache";
import { isFresh, MAX_CACHE_AGE_SECONDS } from "./freshness";
import type { HNPost, HNStory, HNAsk, HNComment, HNAnyItem } from "../types";

type HasKids = { kids?: number[] };

const HN_BASE = "https://hacker-news.firebaseio.com/v0";
const FETCH_TIMEOUT_MS = 10_000;

export type FeedType = "top" | "best" | "new" | "ask" | "show" | "job";

export const FEED_PATHS: Record<FeedType, string> = {
  top: "/topstories.json",
  best: "/beststories.json",
  new: "/newstories.json",
  ask: "/askstories.json",
  show: "/showstories.json",
  job: "/jobstories.json",
};

async function hnFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${HN_BASE}${path}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchItemRaw(id: number): Promise<HNAnyItem | null> {
  return hnFetch<HNAnyItem>(`/item/${id}.json`);
}

export async function fetchMaxItemId(): Promise<number | null> {
  return hnFetch<number>("/maxitem.json");
}

export async function fetchUpdates(): Promise<{
  items: number[];
  profiles: string[];
}> {
  return (await hnFetch<{ items: number[]; profiles: string[] }>("/updates.json")) ?? { items: [], profiles: [] };
}

export async function fetchFeedIds(type: FeedType): Promise<number[]> {
  return (await hnFetch<number[]>(FEED_PATHS[type])) ?? [];
}

export async function ingestPost(
  postId: number,
): Promise<{ post: boolean; comments: number; skipped?: boolean }> {
  const item = await fetchItemRaw(postId);
  if (!item) return { post: false, comments: 0, skipped: true };

  const story = item as HNPost;
  if (story.type !== "story" && story.type !== "job")
    return { post: false, comments: 0, skipped: true };

  if (!isFresh(story.time))
    return { post: false, comments: 0, skipped: true };

  const kids = (story as HasKids).kids ?? [];
  upsertPost(story, kids);

  let commentCount = 0;
  if (kids.length > 0) {
    commentCount = await walkCommentTree(kids, postId, story.time);
  }

  return { post: true, comments: commentCount };
}

async function walkCommentTree(
  rootIds: number[],
  postId: number,
  postTime: number,
): Promise<number> {
  const visited = new Set<number>();
  const queue: Array<{ id: number; parentId: number; level: number }> =
    rootIds.map((id) => ({ id, parentId: postId, level: 1 }));

  const limit = pLimit(16);
  let totalComments = 0;

  const seenOnLevel = new Map<number, Set<number>>();

  while (queue.length > 0) {
    const batch = queue.splice(0, queue.length);
    const results = await Promise.all(
      batch.map((b) =>
        limit(async () => {
          if (visited.has(b.id)) return null;
          visited.add(b.id);
          const item = await fetchItemRaw(b.id);
          if (!item) return null;
          const comment = item as HNComment;
          if (comment.type !== "comment") return null;
          return {
            id: comment.id,
            post_id: postId,
            parent_id: comment.parent,
            level: b.level,
            by: comment.by ?? null,
            time: comment.time,
            content: comment.text ?? null,
            kids: comment.kids ?? [],
            dead: comment.dead ?? false,
            deleted: comment.deleted ?? false,
          } as import("../types").CachedComment;
        }),
      ),
    );

    const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
    if (valid.length > 0) {
      totalComments += valid.length;
      try {
        upsertComments(valid, postTime);
      } catch {
        // ignore individual batch failures
      }
    }

    const allIds = valid.map((c) => c.id);
    if (allIds.length > 0) {
      const currentBatchIds = [...allIds];
      const children: Array<{ id: number; parentId: number; level: number }> = [];
      for (const c of valid) {
        for (const kidId of c.kids) {
          if (!visited.has(kidId)) {
            children.push({ id: kidId, parentId: c.id, level: c.level + 1 });
          }
        }
      }
      queue.push(...children);
    }
  }

  return totalComments;
}

export async function backfill(opts: {
  concurrency: number;
  budget: number;
  signal: AbortSignal;
}): Promise<{ posts: number; comments: number }> {
  const maxId = await fetchMaxItemId();
  if (!maxId) return { posts: 0, comments: 0 };

  const limit = pLimit(opts.concurrency);
  const startId = Math.max(1, maxId - opts.budget);
  const ids: number[] = [];
  for (let i = maxId; i >= startId; i--) ids.push(i);

  let posts = 0;
  let comments = 0;
  let staleStreak = 0;

  const tasks = ids.map((id) =>
    limit(async () => {
      if (opts.signal.aborted || staleStreak > 50) return;
      const item = await fetchItemRaw(id);
      if (!item) return;
      if (item.type === "story" || item.type === "job") {
        if (!isFresh(item.time)) {
          staleStreak++;
          return;
        }
        staleStreak = 0;
        const result = await ingestPost(id);
        posts += result.post ? 1 : 0;
        comments += result.comments;
      } else if (item.type === "comment" && item.time) {
        if (!isFresh(item.time)) {
          staleStreak++;
          return;
        }
        staleStreak = 0;
        try {
          upsertComments(
            [
              {
                id: item.id,
                post_id: item.parent ?? 0,
                parent_id: item.parent ?? 0,
                level: 0,
                by: item.by ?? null,
                time: item.time,
                content: (item as HNComment).text ?? null,
                kids: (item as HNComment).kids ?? [],
                dead: item.dead ?? false,
                deleted: item.deleted ?? false,
              },
            ],
            item.time,
          );
          comments++;
        } catch {
          // ignore
        }
      }
    }),
  );

  await Promise.all(tasks);
  return { posts, comments };
}

export async function ingestUpdates(
  ids: number[],
  opts: {
    concurrency: number;
    seen: Set<number>;
    signal: AbortSignal;
  },
): Promise<{ posts: number; comments: number; skipped: number }> {
  const limit = pLimit(opts.concurrency);
  let posts = 0;
  let comments = 0;
  let skipped = 0;

  await Promise.all(
    ids.map((id) =>
      limit(async () => {
        if (opts.signal.aborted) return;
        if (opts.seen.has(id)) {
          skipped++;
          return;
        }
        opts.seen.add(id);

        const item = await fetchItemRaw(id);
        if (!item) {
          skipped++;
          return;
        }

        if (item.type === "story" || item.type === "job") {
          if (!isFresh(item.time)) {
            skipped++;
            return;
          }
          const r = await ingestPost(id);
          if (r.post) posts++;
          comments += r.comments;
        } else if (item.type === "comment") {
          if (!isFresh(item.time)) {
            skipped++;
            return;
          }
          try {
            upsertComments(
              [
                {
                  id: item.id,
                  post_id: item.parent ?? 0,
                  parent_id: item.parent ?? 0,
                  level: 0,
                  by: item.by ?? null,
                  time: item.time,
                  content: (item as HNComment).text ?? null,
                  kids: (item as HNComment).kids ?? [],
                  dead: item.dead ?? false,
                  deleted: item.deleted ?? false,
                },
              ],
              item.time,
            );
            comments++;
          } catch {
            // ignore
          }
        } else {
          skipped++;
        }
      }),
    ),
  );

  return { posts, comments, skipped };
}

export async function ingestFeeds(
  types: FeedType[],
  opts: {
    concurrency: number;
    seen: Set<number>;
    signal: AbortSignal;
  },
): Promise<{ posts: number; skipped: number }> {
  const limit = pLimit(opts.concurrency);
  let posts = 0;
  let skipped = 0;

  const allIds = new Set<number>();
  for (const type of types) {
    if (opts.signal.aborted) break;
    const ids = await fetchFeedIds(type);
    for (const id of ids) allIds.add(id);
  }

  await Promise.all(
    Array.from(allIds).map((id) =>
      limit(async () => {
        if (opts.signal.aborted) return;
        if (opts.seen.has(id)) {
          skipped++;
          return;
        }
        opts.seen.add(id);

        const item = await fetchItemRaw(id);
        if (!item) {
          skipped++;
          return;
        }
        if (item.type !== "story" && item.type !== "job") {
          skipped++;
          return;
        }
        if (!isFresh(item.time)) {
          skipped++;
          return;
        }
        upsertPost(item as HNPost, (item as HasKids).kids ?? []);
        posts++;
      }),
    ),
  );

  return { posts, skipped };
}

export function evictStale(nowSec: number = Math.floor(Date.now() / 1000)): {
  posts: number;
  comments: number;
} {
  const cutoff = nowSec - MAX_CACHE_AGE_SECONDS;
  const d = db();
  const result = d.transaction(() => {
    const comments = d
      .prepare("DELETE FROM comments WHERE time < ?")
      .run(cutoff).changes;
    const posts = d
      .prepare("DELETE FROM posts WHERE time < ?")
      .run(cutoff).changes;
    return { posts, comments };
  })();
  return result;
}

import Database from "better-sqlite3";
import type { CachedComment, HNPost, HNComment } from "../types";
import { isFresh, TWO_MONTHS_SECONDS } from "../types";
import { getItem } from "./hn";

let _db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY,
  by          TEXT NOT NULL,
  time        INTEGER NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT,
  score       INTEGER NOT NULL DEFAULT 0,
  descendants INTEGER NOT NULL DEFAULT 0,
  kids_json   TEXT NOT NULL DEFAULT '[]',
  cached_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY,
  post_id     INTEGER NOT NULL,
  parent_id   INTEGER NOT NULL,
  level       INTEGER NOT NULL,
  by          TEXT,
  time        INTEGER NOT NULL,
  content     TEXT,
  kids_json   TEXT NOT NULL DEFAULT '[]',
  dead        INTEGER NOT NULL DEFAULT 0,
  deleted     INTEGER NOT NULL DEFAULT 0,
  cached_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_level ON comments (post_id, level);
`;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(process.env.SLACKER_DB_PATH ?? "/data/cache.db");
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");
  _db.exec(SCHEMA);
  return _db;
}

export function getCachedPost(postId: number): {
  post: HNPost & { kids_json: string; cached_at: number };
} | null {
  const row = db()
    .prepare("SELECT * FROM posts WHERE id = ?")
    .get(postId) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (!isFresh(row.time as number)) return null;
  return {
    post: row as unknown as HNPost & { kids_json: string; cached_at: number },
  };
}

export function getCachedComments(
  postId: number,
): CachedComment[] {
  const rows = db()
    .prepare(
      "SELECT id, post_id, parent_id, level, by, time, content, kids_json, dead, deleted FROM comments WHERE post_id = ?",
    )
    .all(postId) as Record<string, unknown>[];
  return rows.map(normalizeCommentRow);
}

export function getCachedComment(
  id: number,
): CachedComment | null {
  const row = db()
    .prepare(
      "SELECT id, post_id, parent_id, level, by, time, content, kids_json, dead, deleted FROM comments WHERE id = ?",
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return normalizeCommentRow(row);
}

export function getCachedSubtree(
  rootId: number,
  maxLevel: number,
): CachedComment[] | null {
  const root = getCachedComment(rootId);
  if (!root) return null;

  const rows = db()
    .prepare(
      `SELECT id, post_id, parent_id, level, by, time, content, kids_json, dead, deleted
       FROM comments
       WHERE post_id = ?
         AND level > ?
         AND level <= ?
       ORDER BY level ASC, id ASC`,
    )
    .all(root.post_id, root.level, root.level + maxLevel) as Record<
    string,
    unknown
  >[];
  const results = [root, ...rows.map(normalizeCommentRow)];

  const post = getCachedPost(root.post_id);
  if (!post) return null;

  return results;
}

export function upsertPost(post: HNPost, kids: number[]) {
  const p = post as unknown as Record<string, unknown>;
  db()
    .prepare(
      `INSERT INTO posts (id, by, time, title, url, score, descendants, kids_json, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         by = excluded.by,
         time = excluded.time,
         title = excluded.title,
         url = excluded.url,
         score = excluded.score,
         descendants = excluded.descendants,
         kids_json = excluded.kids_json,
         cached_at = excluded.cached_at`,
    )
    .run(
      p.id,
      (p.by as string) ?? "",
      p.time as number,
      (p.title as string) ?? "",
      (p.url as string | null) ?? null,
      (p.score as number) ?? 0,
      (p.descendants as number) ?? 0,
      JSON.stringify(kids),
      Math.floor(Date.now() / 1000),
    );
}

export function upsertComments(
  comments: CachedComment[],
  postTime: number,
): number {
  if (postTime > 0 && !isFresh(postTime)) return 0;

  const stmt = db().prepare(
    `INSERT INTO comments (id, post_id, parent_id, level, by, time, content, kids_json, dead, deleted, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       post_id = excluded.post_id,
       parent_id = excluded.parent_id,
       level = excluded.level,
       by = excluded.by,
       time = excluded.time,
       content = excluded.content,
       kids_json = excluded.kids_json,
       dead = excluded.dead,
       deleted = excluded.deleted,
       cached_at = excluded.cached_at`,
  );

  const insertMany = db().transaction(
    (comments: CachedComment[]) => {
      let count = 0;
      for (const c of comments) {
        stmt.run(
          c.id,
          c.post_id,
          c.parent_id,
          c.level,
          c.by,
          c.time,
          c.content,
          JSON.stringify(c.kids),
          c.dead ? 1 : 0,
          c.deleted ? 1 : 0,
          Math.floor(Date.now() / 1000),
        );
        count++;
      }
      return count;
    },
  );

  return insertMany(comments);
}

function normalizeCommentRow(row: Record<string, unknown>): CachedComment {
  return {
    id: row.id as number,
    post_id: row.post_id as number,
    parent_id: row.parent_id as number,
    level: row.level as number,
    by: (row.by as string) ?? null,
    time: row.time as number,
    content: (row.content as string) ?? null,
    kids: JSON.parse(row.kids_json as string) as number[],
    dead: (row.dead as number) === 1,
    deleted: (row.deleted as number) === 1,
  };
}

const HN_FETCH_CONCURRENCY = 32;

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export interface FetchAndCacheOptions {
  ids: number[];
  postId: number;
  baseLevel: number;
  postTime?: number;
}

export interface FetchAndCacheResult {
  comments: CachedComment[];
  missing: number[];
}

export async function fetchAndCacheComments({
  ids,
  postId,
  baseLevel,
  postTime = 0,
}: FetchAndCacheOptions): Promise<FetchAndCacheResult> {
  if (ids.length === 0) return { comments: [], missing: [] };

  const dbInstance = db();
  const existing = new Map<number, CachedComment>();
  const placeholders = ids.map(() => "?").join(",");
  const rows = dbInstance
    .prepare(
      `SELECT id, post_id, parent_id, level, by, time, content, kids_json, dead, deleted
       FROM comments WHERE id IN (${placeholders})`,
    )
    .all(...ids) as Record<string, unknown>[];
  for (const row of rows) {
    existing.set(row.id as number, normalizeCommentRow(row));
  }

  const missingIds = ids.filter((id) => !existing.has(id));
  const freshComments: CachedComment[] = [...existing.values()];

  if (missingIds.length > 0) {
    const fetched = await mapWithLimit(
      missingIds,
      HN_FETCH_CONCURRENCY,
      async (id): Promise<CachedComment | null> => {
        const item = await getItem(id);
        if (!item || (item as { type?: string }).type !== "comment") return null;
        const c = item as HNComment;
        return {
          id: c.id,
          post_id: postId,
          parent_id: c.parent,
          level: baseLevel,
          by: c.by ?? null,
          time: c.time,
          content: c.text ?? null,
          kids: c.kids ?? [],
          dead: c.dead ?? false,
          deleted: c.deleted ?? false,
        };
      },
    );

    const valid = fetched.filter((c): c is CachedComment => c !== null);
    freshComments.push(...valid);

    if (valid.length > 0) {
      const writeable = postTime > 0 ? isFresh(postTime) : true;
      if (writeable) {
        upsertComments(valid, postTime || Math.max(...valid.map((c) => c.time)));
      }
    }
  }

  const foundIds = new Set(freshComments.map((c) => c.id));
  const missing = ids.filter((id) => !foundIds.has(id));

  return { comments: freshComments, missing };
}

export async function prefetchSubtree(
  rootIds: number[],
  postId: number,
  postTime: number,
  maxDepth: number,
): Promise<void> {
  if (!isFresh(postTime) || rootIds.length === 0) return;

  const visited = new Set<number>();
  let currentLevel: Array<{ id: number; parentId: number; depth: number }> =
    rootIds.map((id) => ({ id, parentId: postId, depth: 1 }));
  const levelMap = new Map<number, number>();
  for (const id of rootIds) levelMap.set(id, 1);

  while (currentLevel.length > 0) {
    const { comments, missing } = await fetchAndCacheComments({
      ids: currentLevel.map((t) => t.id),
      postId,
      baseLevel: currentLevel[0].depth,
      postTime,
    });

    for (const c of comments) {
      levelMap.set(c.id, c.level);
    }

    const nextLevel: Array<{ id: number; parentId: number; depth: number }> = [];
    for (const c of comments) {
      if (visited.has(c.id)) continue;
      visited.add(c.id);
      if (c.level < maxDepth) {
        for (const kidId of c.kids) {
          if (!visited.has(kidId)) {
            nextLevel.push({ id: kidId, parentId: c.id, depth: c.level + 1 });
          }
        }
      }
    }

    for (const id of missing) {
      visited.add(id);
    }

    currentLevel = nextLevel;
  }
}

const FOUR_MONTHS_SECONDS = TWO_MONTHS_SECONDS * 2;

export function evictStaleCache(): { posts: number; comments: number } {
  const cutoff = Math.floor(Date.now() / 1000) - FOUR_MONTHS_SECONDS;
  const posts = db().prepare("DELETE FROM posts WHERE cached_at < ?").run(cutoff).changes;
  const comments = db().prepare("DELETE FROM comments WHERE cached_at < ?").run(cutoff).changes;
  return { posts, comments };
}

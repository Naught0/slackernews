export interface RawComment {
  id: number;
  by: string | null;
  time: number;
  text: string | null;
  parent: number;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}

export interface HydratedComment {
  id: number;
  post_id: number;
  parent_id: number;
  level: number;
  by: string | null;
  time: number;
  content: string | null;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}

export interface BatchFetchRequest {
  ids: number[];
  cursor: number;
  limit: number;
  postId: number;
  baseLevel: number;
  postTime?: number;
}

export interface BatchFetchResponse {
  comments: HydratedComment[];
  missing: number[];
  nextCursor: number;
  hasMore: boolean;
  total: number;
}

export type BatchFetchFn = (req: BatchFetchRequest) => Promise<BatchFetchResponse>;

export type ProgressFn = (loaded: number, total: number) => void;
export type CommentFn = (comment: HydratedComment) => void;

export interface FetchSubtreeOptions {
  postId: number;
  postTime?: number;
  maxDepth: number;
  baseLevel: number;
  fetcher: BatchFetchFn;
  onComment?: CommentFn;
  onProgress?: ProgressFn;
  chunkSize?: number;
}

export async function fetchSubtreeBatched(
  rootIds: number[],
  opts: FetchSubtreeOptions,
): Promise<HydratedComment[]> {
  const {
    postId,
    postTime,
    maxDepth,
    baseLevel,
    fetcher,
    onComment,
    onProgress,
    chunkSize = 20,
  } = opts;

  const fetched = new Map<number, HydratedComment>();
  const allExpected = new Set<number>(rootIds);
  const totalExpected = rootIds.length;
  onProgress?.(0, totalExpected);

  let currentWave: Array<{ id: number; depth: number }> = rootIds.map((id) => ({
    id,
    depth: baseLevel,
  }));

  while (currentWave.length > 0) {
    const waveLevel = currentWave[0].depth;
    const sameLevel = currentWave.filter((t) => t.depth === waveLevel);
    currentWave = currentWave.filter((t) => t.depth !== waveLevel);

    const idsToFetch = sameLevel
      .map((t) => t.id)
      .filter((id) => !fetched.has(id));

    if (idsToFetch.length === 0) continue;

    let cursor = 0;
    while (cursor < idsToFetch.length) {
      const chunk = idsToFetch.slice(cursor, cursor + chunkSize);
      const res = await fetcher({
        ids: idsToFetch,
        cursor,
        limit: chunk.length,
        postId,
        baseLevel: waveLevel,
        postTime,
      });

      for (const c of res.comments) {
        if (!fetched.has(c.id)) {
          fetched.set(c.id, c);
          onComment?.(c);
        }
      }

      cursor = res.nextCursor;
      onProgress?.(fetched.size, totalExpected);
    }

    const next: Array<{ id: number; depth: number }> = [];
    for (const t of sameLevel) {
      const c = fetched.get(t.id);
      if (!c) continue;
      if (c.level + 1 > maxDepth) continue;
      if (c.kids.length === 0) continue;
      for (const kidId of c.kids) {
        if (!fetched.has(kidId) && !allExpected.has(kidId)) {
          allExpected.add(kidId);
          next.push({ id: kidId, depth: c.level + 1 });
        }
      }
    }
    currentWave.push(...next);
  }

  onProgress?.(fetched.size, totalExpected);
  return Array.from(fetched.values());
}

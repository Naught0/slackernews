import {
  getCachedComment,
  getCachedPost,
  prefetchSubtree,
  upsertPost,
} from "./cache";
import { getItem } from "./hn";
import {
  PER_PAGE,
  MAX_INITIAL_DEPTH,
  isFresh,
} from "../types";
import type {
  CachedComment,
  HNPost,
  SubtreeNode,
  StoryResponse,
} from "../types";

function buildCachedTree(
  id: number,
  maxLevel: number,
): { comment: CachedComment; children: SubtreeNode[] } | null {
  const comment = getCachedComment(id);
  if (!comment) return null;

  if (comment.level >= maxLevel || comment.kids.length === 0) {
    return { comment, children: [] };
  }

  const children: SubtreeNode[] = [];
  for (const kidId of comment.kids) {
    const child = buildCachedTree(kidId, maxLevel);
    if (child) children.push(child);
  }

  return { comment, children };
}

function buildInitialSubtree(
  ids: number[],
  maxLevel: number,
): StoryResponse["initialSubtree"] {
  return ids.map((id) => {
    const tree = buildCachedTree(id, maxLevel);
    if (!tree) return { id, cached: false as const };
    return {
      id,
      cached: true as const,
      comment: tree.comment,
      children: tree.children,
    };
  });
}

export interface GetStoryPageOptions {
  postId: number;
  page: number;
  backgroundPrefetch?: boolean;
}

export async function getStoryPage({
  postId,
  page,
  backgroundPrefetch = true,
}: GetStoryPageOptions): Promise<StoryResponse | null> {
  const cached = getCachedPost(postId);

  if (cached) {
    const topLevelIds = JSON.parse(cached.post.kids_json) as number[];
    const pageIds = topLevelIds.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    if (backgroundPrefetch && page === 0) {
      const nextPageIds = topLevelIds.slice(
        PER_PAGE,
        Math.min(topLevelIds.length, 2 * PER_PAGE),
      );
      if (nextPageIds.length > 0 && isFresh(cached.post.time)) {
        prefetchSubtree(
          nextPageIds,
          postId,
          cached.post.time,
          MAX_INITIAL_DEPTH,
        ).catch((err) => {
          console.error("[story] next-page prefetch failed", { postId, err });
        });
      }
    }

    return {
      post: cached.post,
      topLevelIds,
      page,
      perPage: PER_PAGE,
      initialSubtree: buildInitialSubtree(pageIds, MAX_INITIAL_DEPTH),
      cacheable: true,
    };
  }

  const item = await getItem(postId);
  if (!item || (item as HNPost).type !== "story") return null;

  const story = item as unknown as Record<string, unknown>;
  const kids = (story.kids as number[]) ?? [];
  const postTime = story.time as number;
  const cacheable = isFresh(postTime);

  if (cacheable) {
    upsertPost(item as HNPost, kids);
  }

  if (cacheable && page === 0 && kids.length > 0) {
    const topPage = kids.slice(0, PER_PAGE);
    const nextPage = kids.slice(
      PER_PAGE,
      Math.min(kids.length, 2 * PER_PAGE),
    );

    prefetchSubtree(topPage, postId, postTime, MAX_INITIAL_DEPTH).catch(
      (err) => {
        console.error("[story] inline prefetch failed", { postId, err });
      },
    );

    if (nextPage.length > 0) {
      prefetchSubtree(nextPage, postId, postTime, MAX_INITIAL_DEPTH).catch(
        (err) => {
          console.error("[story] next-page prefetch failed", { postId, err });
        },
      );
    }

    return {
      post: item as unknown as HNPost,
      topLevelIds: kids,
      page,
      perPage: PER_PAGE,
      initialSubtree: buildInitialSubtree(topPage, MAX_INITIAL_DEPTH),
      cacheable: true,
    };
  }

  const pageIds = kids.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  return {
    post: item as unknown as HNPost,
    topLevelIds: kids,
    page,
    perPage: PER_PAGE,
    initialSubtree: pageIds.map((id) => ({ id, cached: false as const })),
    cacheable,
  };
}

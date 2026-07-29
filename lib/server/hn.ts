import type { HNHit, HNUser, HNHomepageType, HNStory, HNComment, HNPost } from "../types";
import { withHnRateLimit } from "./rate-limit";

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

async function request<T>(url: string, config?: RequestInit): Promise<T> {
  return withHnRateLimit(async () => {
    const resp = await fetch(`${HN_BASE}${url}`, {
      ...config,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 },
    });
    if (!resp.ok) {
      throw new Error(`HN API ${resp.status}: ${resp.statusText}`);
    }
    return (await resp.json()) as T;
  });
}

export async function getItem(id: number | string): Promise<HNHit> {
  return request<HNHit>(`/item/${id}.json`);
}

export async function getTopIds(
  type: HNHomepageType,
): Promise<number[]> {
  return request<number[]>(`/${type}stories.json`);
}

export async function getUser(id: string): Promise<HNUser | null> {
  return request<HNUser | null>(`/user/${id}.json`);
}

export async function getStoryTree(id: number | string) {
  const item = await getItem(id);
  if (!item || (item as HNStory).type !== "story") return null;
  return item as HNStory;
}

export async function getComment(id: number | string) {
  const item = await getItem(id);
  if (!item || (item as HNComment).type !== "comment") return null;
  return item as HNComment;
}

export async function getParentPost(commentId: number | string): Promise<HNPost | null> {
  let itemId = commentId;
  for (let i = 0; i < 50; i++) {
    const item = await getItem(itemId);
    if (!item) return null;
    if ((item as HNComment).type === "comment") {
      itemId = (item as HNComment).parent;
      continue;
    }
    return item as HNPost;
  }
  return null;
}

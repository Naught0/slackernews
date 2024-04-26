import { getItemById } from ".";

const DEFAULT_CACHE_SECONDS = 180;

async function request<T extends unknown>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const resp = await fetch(`https://api.hnpwa.com/v0${url}.json`, { next: { revalidate: DEFAULT_CACHE_SECONDS }, ...config });
  return (await resp.json()) as T;
}

export async function getCommentPost(
  commentId: number | string,
): Promise<HNPost> {
  let itemId = commentId;
  while (true) {
    const item = await getItemById<HNComment | HNPost>(itemId);

    if (item.type === "comment") {
      itemId = item.parent;
      continue;
    }
    break;
  }
  return await getItemById<HNPost>(itemId);
}

export const getItem = async (postId: string | number) => {
  return await request<HNPWAItem>(`/item/${postId}`);
};

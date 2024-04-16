import chunk from "lodash.chunk";
import { retryPromise } from "./retry";

async function request<T extends unknown>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const resp = await fetch(
    `https://hacker-news.firebaseio.com/v0${url}`,
    config,
  );
  return (await resp.json()) as T;
}
export async function getHomepage(props?: {
  count?: number;
  pageIndex?: number;
}): Promise<{ items: HNStory[] }> {
  const count = props?.count ?? 25;
  const pageIndex = props?.pageIndex ?? 0;
  const postIds = await request<number[]>("/topstories.json");
  const postData = await Promise.all(
    postIds
      .slice(pageIndex * count, pageIndex * count + count)
      .map((id) => request<HNStory>(`/item/${id}.json`)),
  );

  return { items: postData };
}

export async function getItemById<T>(id: number | string) {
  return await request<T>(`/item/${id}.json`);
}

// Function to gather comments in a thread
export async function gatherComments(
  commentId: string | number,
  depth: number = 5,
): Promise<HNComment> {
  try {
    const item = await getItemById<HNComment>(commentId);
    const comments: HNComment = { ...item };

    if (depth > 0 && item.kids) {
      const kidsCommentsPromises = item.kids.map((kidId) =>
        gatherComments(kidId, depth - 1),
      );
      const chunks = chunk(
        kidsCommentsPromises.map((promise) => retryPromise(promise)),
        10,
      );

      comments.comments = [];
      for (const commentChunk of chunks) {
        comments.comments.push(...(await Promise.all(commentChunk)));
      }
      comments.comments = await Promise.all(kidsCommentsPromises);
    }

    return comments;
  } catch (error) {
    console.error("Error gathering comments:", error);
    throw error;
  }
}

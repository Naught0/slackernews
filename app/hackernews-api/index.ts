import { retryPromise } from "./retry";

const POSTS_PER_PAGE_LIMIT = 50;
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
  homepageType?: HNHomepageType;
}): Promise<{ items: HNStory[] }> {
  let count = props?.count ?? 15;
  if (count > POSTS_PER_PAGE_LIMIT) {
    count = POSTS_PER_PAGE_LIMIT;
  }
  const homepageType = props?.homepageType ?? "top";
  const pageIndex = props?.pageIndex ?? 0;
  const postIds = await request<number[]>(`/${homepageType}stories.json`, {
    // Cache for 5 minutes
    next: { revalidate: 300 },
  });
  const postData = await Promise.all(
    postIds
      .slice(pageIndex * count, pageIndex * count + count)
      .map((id) => request<HNStory>(`/item/${id}.json`)),
  );

  return { items: postData };
}

export async function getItemById<T>(id: number | string) {
  return await request<T>(`/item/${id}.json`, { next: { revalidate: 3600 } });
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
        retryPromise(gatherComments(kidId, depth - 1)),
      );
      comments.comments = await Promise.all(kidsCommentsPromises);
    }

    return comments;
  } catch (error) {
    console.error("Error gathering comments:", error);
    throw error;
  }
}

export async function timedComments(
  commentId: string | number,
  depth: number = 5,
) {
  const start = +new Date();
  const comments = await gatherComments(commentId, depth);
  const end = +new Date();
  console.log("Got comments for", commentId, "in", (end - start) / 1000, "s");

  return comments;
}

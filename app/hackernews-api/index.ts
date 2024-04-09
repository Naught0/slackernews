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

// Recursively gather comments in a thread
export async function gatherComments(
  id: number,
  depth: number,
): Promise<HNComment> {
  if (depth <= 0) {
    return await getItemById(id);
  }

  try {
    const comment = await getItemById<HNComment>(id);
    const comments = { ...comment };

    if (comment.kids && Array.isArray(comment.kids)) {
      const kidsCommentsPromises = comment.kids.map((kidId) =>
        gatherComments(kidId, depth - 1),
      );
      comments.comments = await Promise.all(kidsCommentsPromises);
    }

    return comments;
  } catch (error) {
    console.error("Error gathering comments:", error);
    throw error;
  }
}

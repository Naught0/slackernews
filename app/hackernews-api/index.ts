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
}): Promise<{ items: (HNStory | HNAsk | HNJob)[] }> {
  const postIds = await request<number[]>("/topstories.json");
  const postData = await Promise.all(
    postIds
      .slice(0, props?.count ?? 3)
      .map((id) => request<HNStory | HNAsk | HNJob>(`/item/${id}.json`)),
  );

  return { items: postData };
}

export async function getItemById<T>(id: number | string) {
  return await request<T>(`/item/${id}.json`);
}

export async function getThreadComments(id: number | string) {
  const resp = await fetch(`http://hn.algolia.com/api/v1/items/${id}`);
  const data = await resp.json();

  return data as TThread;
}

export async function getItemsById<T extends HNAnyItem>(
  ids: string[] | number[],
): Promise<{ items: T[] }> {
  if (!ids) return { items: [] };

  const items = await Promise.all(
    ids.map((id) => request<T>(`/item/${id}.json`)),
  );
  return {
    items,
  };
}

export async function getCommentsByPostId({
  id,
  count,
  sortBy,
  sortDir,
}: {
  id: string | number;
  count?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<{ items: HNComment[] }> {
  const post = await request<HNStory>(`/item/${id}.json`);
  if (!post) return { items: [] };

  const resp = await Promise.all(
    post.kids?.map((id) => request<HNComment>(`/item/${id}.json`)),
  );
  return { items: resp };
}

export async function getComments({
  maxDepth = 3,
  depth = 0,
  id,
  story,
  comments,
}: {
  id: string | number;
  depth: number;
  story: HNStory;
  comments?: HNComment;
  maxDepth?: number;
}): Promise<HNComment> {
  const resp = await getCommentsByPostId({ id });
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

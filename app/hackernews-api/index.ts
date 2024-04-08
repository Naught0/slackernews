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
  const resp = await fetch(`https://api.hackerwebapp.com/item/${id}`);
  return (await resp.json()) as TThread;
}

export async function getThreadComments(id: number | string) {
  const resp = await fetch(`https://api.hackerwebapp.com/item/${id}`);
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
  id: string;
  count?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}): Promise<{ items: HNComment[] }> {
  const post = await request<HNStory>(`/item/${id}.json`);
  const resp = await Promise.all(
    post.kids.map((id) => request<HNComment>(`/item/${id}.json`)),
  );
  return { items: resp.filter((c) => c.text && !c.deleted) };
}

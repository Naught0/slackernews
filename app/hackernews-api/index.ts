export const revalidate = 30;
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
  const postIds = await request<number[]>(`/${homepageType}stories.json`);
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

export async function getUserById(id: number | string) {
  return await request<HNUser>(`/user/${id}.json`);
}

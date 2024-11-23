import { getItemById, getHomepage as getOfficialHompage } from ".";
import { DEFAULT_CACHE_TTL_SECONDS } from "./constants";
import { convertPostToPWA } from "./utils";

const POSTS_PER_PAGE_LIMIT = 50;

async function request<T extends unknown>(
  url: string,
  config?: RequestInit,
): Promise<T> {
  const resp = await fetch(`https://api.hnpwa.com/v0${url}.json`, {
    next: { revalidate: DEFAULT_CACHE_TTL_SECONDS },
    ...config,
  });
  return (await resp.json()) as T;
}

export async function getHomepage(props: {
  count?: number;
  pageIndex?: number;
  homepageType?: HNPWAFeedType | "best";
}) {
  let count = props?.count ?? 15;
  if (count > POSTS_PER_PAGE_LIMIT) {
    count = POSTS_PER_PAGE_LIMIT;
  }
  const homepageType = props?.homepageType ?? "top";
  const pageIndex = props?.pageIndex ?? 0;
  if (homepageType === "best") {
    return {
      items: (
        await getOfficialHompage({ ...props, homepageType: "best" })
      ).items.map((item) => convertPostToPWA(item)),
    };
  }

  return {
    items: await request<HNPWAFeedItem[]>(`/${homepageType}/${pageIndex + 1}`),
  };
}
export async function getCommentPost(
  commentId: number | string,
): Promise<HNPost | null> {
  let itemId = commentId;
  while (true) {
    const item = await getItemById<HNComment | HNPost>(itemId);

    if (item?.type === "comment") {
      itemId = item.parent;
      continue;
    }
    break;
  }
  return await getItemById<HNPost>(itemId);
}

export const getItem = async (postId: string | number) => {
  return await request<HNPWAItem | null>(`/item/${postId}`);
};

export async function getPaginatedItems({
  items,
  pageIndex,
  perPage = 15,
}: {
  items: Array<string | number>;
  pageIndex: number;
  perPage?: number;
}): Promise<{ items: HNPWAItem[] }> {
  const page = items.slice(pageIndex * perPage, pageIndex * perPage + perPage);
  const promises = page.map((id) => getItem(id));
  return { items: (await Promise.all(promises)) as HNPWAItem[] };
}

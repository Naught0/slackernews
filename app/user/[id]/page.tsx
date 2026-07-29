import { getUser, getItem } from "~/lib/server/hn";
import Items from "~/app/components/items";
import User from "./components/user";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { notFound } from "next/navigation";
import type { HNAnyItem, HNPWAItem } from "~/lib/types";

function toHNPWAItem(item: HNAnyItem): HNPWAItem {
  const t = item as unknown as Record<string, unknown>;
  return {
    id: t.id as number,
    title: (t.title as string) ?? "",
    points: (t.score as number) ?? null,
    user: (t.by as string) ?? null,
    time: t.time as number,
    time_ago: "",
    content: (t.text as string) ?? "",
    deleted: (t.deleted as boolean) ?? false,
    dead: (t.dead as boolean) ?? false,
    type: (t.type === "story" ? "link" : t.type) as HNPWAItem["type"],
    comments: [],
    level: 0,
    comments_count: (t.descendants as number) ?? 0,
    url: t.url as string | undefined,
    domain: t.url ? new URL(t.url as string).hostname : undefined,
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  const { id } = await params;
  const { page, perPage } = await searchParams;
  const user = await getUser(id);
  if (!user) notFound();

  const perPageNum = parseInt(perPage ?? "15");
  const pageIndex = Math.max(0, parseInt(page ?? "1") - 1);

  const pageIds = user.submitted.slice(
    pageIndex * perPageNum,
    pageIndex * perPageNum + perPageNum,
  );

  const rawItems = (await Promise.all(
    pageIds.map((itemId) => getItem(itemId)),
  )).filter((item): item is HNAnyItem => item != null);

  const items = rawItems.map(toHNPWAItem);

  return (
    <div className="flex w-full flex-col gap-3 md:max-w-screen-md lg:gap-6">
      <div className="border-color flex flex-row items-start gap-3 border-b pb-3">
        <User user={user} className="flex-1" />
      </div>
      <h1 className="px-3 text-lg lg:text-2xl">Recent activity</h1>
      <Items items={items} />
      <HomepagePagination searchParams={{ page, perPage }} />
    </div>
  );
}

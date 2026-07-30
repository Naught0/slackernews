"use client";
import { useQuery, useQueries } from "@tanstack/react-query";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { Post } from "~/app/components/post";
import { HomepageSelector } from "./homepage-selector";
import { fetchHnFeedIds, fetchHnItem } from "~/lib/hn";
import type { HnRawItem } from "~/lib/hn";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

const FEED_MAP: Record<string, string> = {
  news: "top",
  newest: "new",
  best: "best",
  ask: "ask",
  show: "show",
  jobs: "job",
};

export default function Homepage({
  searchParams,
  type = "news",
}: {
  searchParams?: Record<string, string | undefined>;
  type: string;
}) {
  const perPage = parseInt(searchParams?.["perPage"] ?? "30");
  const pageIndex = Math.max(0, parseInt(searchParams?.["page"] ?? "1") - 1);
  const feedKey = FEED_MAP[type] ?? "top";

  const { data: ids } = useQuery({
    queryKey: ["feedIds", feedKey],
    queryFn: () => fetchHnFeedIds(feedKey),
  });

  const pageIds = (ids ?? []).slice(
    pageIndex * perPage,
    pageIndex * perPage + perPage,
  );

  const items =
    useQueries({
      queries: pageIds.map((id) => ({
        queryKey: ["item", id],
        queryFn: () => fetchHnItem(id),
      })),
    })
      .map((r) => r.data ?? null)
      .filter(Boolean) as HnRawItem[];

  return (
    <div className="flex w-full max-w-screen-lg flex-col">
      <div className="self-end">
        <HomepageSelector />
      </div>
      <div className="flex flex-col gap-3">
        <div className="border-color divide-y">
          {items.map((item) => (
            <div key={item.id} className="py-3">
              <Post story={item as any} />
            </div>
          ))}
        </div>
        <HomepagePagination searchParams={searchParams} />
      </div>
    </div>
  );
}

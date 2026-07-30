"use client";
import { use } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import Items from "~/app/components/items";
import User from "./components/user";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { fetchHnUser, fetchHnItem } from "~/lib/hn";
import type { HnRawItem } from "~/lib/hn";

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  const { id } = use(params);
  const { page: pageParam, perPage: perPageParam } = use(searchParams);
  const perPageNum = parseInt(perPageParam ?? "15");
  const pageIndex = Math.max(0, parseInt(pageParam ?? "1") - 1);

  const { data: user } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchHnUser(id),
  });

  if (user === null) notFound();

  const pageIds = (user?.submitted ?? []).slice(
    pageIndex * perPageNum,
    pageIndex * perPageNum + perPageNum,
  );

  const items =
    useQueries({
      queries: pageIds.map((itemId) => ({
        queryKey: ["item", itemId],
        queryFn: () => fetchHnItem(itemId),
      })),
    })
      .map((r) => r.data ?? null)
      .filter(Boolean) as HnRawItem[];

  return (
    <div className="flex w-full flex-col gap-3 md:max-w-screen-lg lg:gap-6">
      {user && (
        <>
          <div className="border-color flex flex-row items-start gap-3 border-b pb-3">
            <User user={user} className="flex-1" />
          </div>
          <h1 className="px-3 text-lg lg:text-2xl">Recent activity</h1>
          <Items items={items} />
          <HomepagePagination searchParams={{ page: pageParam, perPage: perPageParam }} />
        </>
      )}
    </div>
  );
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import { Post } from "~/app/components/post";
import { Thread } from "../components/thread";
import { fetchHnItem } from "~/lib/hn";
import { Skeleton } from "~/components/ui/skeleton";

const PER_PAGE = 20;

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = use(params);
  const { page: pageParam } = use(searchParams);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", postId],
    queryFn: () => fetchHnItem(postId),
  });

  if (!isLoading && item?.type === "comment") {
    notFound();
  }

  const topLevelIds = item?.kids ?? [];
  const totalPages = Math.max(1, Math.ceil(topLevelIds.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageIds = topLevelIds.slice(start, start + PER_PAGE);

  return (
    <div className="flex flex-col flex-wrap gap-3">
      <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
        {item ? (
          <Post story={item as any} className="flex-grow" showHnLink showText />
        ) : (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-6 w-96 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {pageIds.length > 0 ? (
          <Thread
            postId={id}
            currentPage={page}
            totalPages={totalPages}
            topLevelIds={pageIds}
            op={item?.by ?? ""}
          />
        ) : !isLoading ? (
          <div className="text-muted-foreground p-4 text-sm italic">
            No comments yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

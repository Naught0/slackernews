"use client";
import { useEffect } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

export function HomepagePagination({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const page = parseInt(searchParams?.["page"] ?? "1");
  useEffect(
    function removePageParam() {
      if (page === 1) {
        history.replaceState({}, "", window.location.pathname);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );
  return (
    <div className="border-color flex flex-col items-center gap-1 border-t py-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={`?page=${page - 1 > 0 ? page - 1 : 1}`} />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href={`?page=${page + 1}`} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <span className="text-sm">page {page}</span>
    </div>
  );
}

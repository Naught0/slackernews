"use client";
import Link from "next/link";
import { CommentCascade } from "./comment-cascade";

export function Thread({
  postId,
  currentPage,
  totalPages,
  topLevelIds,
  op,
}: {
  postId: string;
  currentPage: number;
  totalPages: number;
  topLevelIds: number[];
  op: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CommentCascade
        topLevelIds={topLevelIds}
        op={op}
        postId={postId}
      />
      {totalPages > 1 && (
        <Pagination
          postId={postId}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}

function Pagination({
  postId,
  currentPage,
  totalPages,
}: {
  postId: string;
  currentPage: number;
  totalPages: number;
}) {
  const prevHref = currentPage > 1 ? `/post/${postId}?page=${currentPage - 1}` : null;
  const nextHref = currentPage < totalPages ? `/post/${postId}?page=${currentPage + 1}` : null;

  return (
    <div className="flex justify-center gap-4 py-6 text-sm lg:text-base">
      {prevHref ? (
        <Link
          href={prevHref}
          className="hover:bg-muted rounded-md border border-slate-200 px-4 py-2"
          prefetch={false}
        >
          ← Previous page
        </Link>
      ) : (
        <span className="rounded-md border border-slate-100 px-4 py-2 text-muted-foreground opacity-50">
          ← Previous page
        </span>
      )}
      <span className="text-muted-foreground flex items-center">
        Page {currentPage} of {totalPages}
      </span>
      {nextHref ? (
        <Link
          href={nextHref}
          className="hover:bg-muted rounded-md border border-slate-200 px-4 py-2"
          prefetch={false}
        >
          Next page →
        </Link>
      ) : (
        <span className="rounded-md border border-slate-100 px-4 py-2 text-muted-foreground opacity-50">
          Next page →
        </span>
      )}
    </div>
  );
}

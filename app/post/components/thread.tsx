"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CommentCascade } from "./comment-cascade";
import { CachedCommentsList } from "./cached-comments";
import { toCommentView } from "~/lib/client/comment-source";
import type { StoryResponse, SubtreeNode } from "~/lib/types";

function seedSubtree(
  qc: ReturnType<typeof useQueryClient>,
  node: SubtreeNode,
) {
  qc.setQueryData(["comment", node.comment.id], toCommentView(node.comment));
  for (const child of node.children) {
    seedSubtree(qc, child);
  }
}

export function Thread({
  postId,
  currentPage,
  totalPages,
  data,
}: {
  postId: string;
  currentPage: number;
  totalPages: number;
  data: StoryResponse;
}) {
  const qc = useQueryClient();

  useEffect(() => {
    if (data.stale) return;
    for (const item of data.initialSubtree) {
      if (item.cached) {
        qc.setQueryData(["comment", item.id], toCommentView(item.comment));
        for (const child of item.children) {
          seedSubtree(qc, child);
        }
      }
    }
  }, [data, qc]);

  return (
    <div className="flex flex-col gap-4">
      {data.stale ? (
        <CommentCascade
          topLevelIds={data.topLevelIds}
          source="hn"
          op={data.post.by}
          postId={postId}
        />
      ) : (
        <CachedCommentsList
          initialSubtree={data.initialSubtree}
          postId={postId}
          postTime={data.post.time}
          op={data.post.by}
        />
      )}
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
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const prevHref = prevPage > 0 ? `/post/${postId}?page=${prevPage}` : null;
  const nextHref = nextPage < totalPages ? `/post/${postId}?page=${nextPage}` : null;

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
        Page {currentPage + 1} of {totalPages}
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

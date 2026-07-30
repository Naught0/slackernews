"use client";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { GoArrowLeft, GoArrowUp } from "react-icons/go";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { HNComment } from "../post/components/comment";
import { Separator } from "~/components/ui/separator";
import { Post } from "./post";
import { CommentSubtree } from "./comment-subtree";
import { fetchHnItem } from "~/lib/hn";
import type { HnRawItem } from "~/lib/hn";

export const BackToPost = ({
  postId,
  className,
}: {
  postId: string;
  className?: string;
}) => {
  return (
    <Link href={`/post/${postId}`} className={cn(className)}>
      <GoArrowLeft className="mr-1 inline" />
      <span className="underline">Back to post</span>
    </Link>
  );
};

export function CommentPage({
  commentId,
  postId,
}: {
  commentId: string;
  postId?: string;
}) {
  const commentIdNum = parseInt(commentId, 10);

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", commentIdNum],
    queryFn: () => fetchHnItem(commentIdNum),
  });

  if (!isLoading && item && item.type !== "comment") {
    notFound();
  }

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-sm">Loading comment...</div>;
  }

  if (!item) {
    return <div className="text-muted-foreground p-4 text-sm">Comment not found.</div>;
  }

  return <CommentContent comment={item as HnRawItem} commentId={commentId} postId={postId} />;
}

function CommentContent({
  comment,
  commentId,
  postId,
}: {
  comment: HnRawItem;
  commentId: string;
  postId?: string;
}) {
  const parentId = comment.parent;
  const commentIdNum = parseInt(commentId, 10);

  const { data: postItem } = useQuery({
    queryKey: ["item", postId ? parseInt(postId, 10) : parentId],
    queryFn: () => fetchHnItem(postId ? parseInt(postId, 10) : parentId),
    enabled: Boolean(postId || parentId),
  });

  const resolvedPostId = postId ?? (postItem?.type !== "comment" ? String(postItem?.id) : undefined);
  const resolvedPost = postItem && postItem.type !== "comment" ? postItem : null;

  const contextLink = () => {
    if (!parentId) return null;

    const parentIdStr = parentId.toString();
    if (parentIdStr === postId) {
      return <BackToPost postId={postId!} />;
    }
    if (postId && parentId) {
      return (
        <div className="border-color flex flex-row divide-x">
          <BackToPost postId={postId} className="pr-3" />
          <Link
            href={`/post/${postId}/comment/${parentId}`}
            className="px-2"
            prefetch={false}
          >
            <GoArrowUp className="mr-1 inline" />
            <span className="underline">See more context</span>
          </Link>
        </div>
      );
    }

    return (
      <Link
        href={`/comment/${parentId}`}
        className="underline"
        prefetch={false}
      >
        <GoArrowUp className="mr-1 inline" /> See parent comment
      </Link>
    );
  };

  const op = resolvedPost?.by ?? null;

  return (
    <>
      {resolvedPost && (
        <>
          <Post story={resolvedPost as any} showHnLink showText />
          <Separator />
        </>
      )}
      <div className="mb-3 text-sm md:text-base">
        {parentId && contextLink()}
      </div>
      {comment.type === "comment" && (
        <HNComment
          id={comment.id}
          user={comment.by ?? null}
          time={comment.time}
          content={comment.text ?? null}
          deleted={comment.deleted}
          dead={comment.dead}
          postId={postId ?? (resolvedPostId ? resolvedPostId : undefined)}
          anchor
        />
      )}
      <Separator />
      {resolvedPostId ? (
        <CommentSubtree
          rootId={commentIdNum}
          postId={parseInt(resolvedPostId, 10) || commentIdNum}
          op={op}
        />
      ) : (
        <div className="text-muted-foreground p-4 text-sm">
          Unable to load replies.
        </div>
      )}
    </>
  );
}

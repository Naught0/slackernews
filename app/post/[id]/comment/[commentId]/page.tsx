"use client";
import { use } from "react";
import { CommentPage } from "~/app/components/comment-page";

export default function Page({
  params,
}: {
  params: Promise<{ id: string; commentId: string }>;
}) {
  const { commentId, id } = use(params);
  return <CommentPage postId={id} commentId={commentId} />;
}

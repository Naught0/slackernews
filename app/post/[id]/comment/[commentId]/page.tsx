import { CommentPage } from "~/app/components/comment-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; commentId: string }>;
}) {
  const { commentId, id } = await params;
  return <CommentPage postId={id} commentId={commentId} />;
}

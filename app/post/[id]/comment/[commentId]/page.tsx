import { CommentPage } from "~/app/components/comment-page";

export default async function Page({
  params: { commentId, id },
}: {
  params: { id: string; commentId: string };
}) {
  return <CommentPage postId={id} commentId={commentId} />;
}

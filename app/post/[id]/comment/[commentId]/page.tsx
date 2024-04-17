import { gatherComments } from "~/app/hackernews-api";
import { HNThreadComponent } from "~/app/post/components/thread";

export default async function Page({
  params: { commentId, id },
}: {
  params: { id: string; commentId: string };
}) {
  const comment = await gatherComments(commentId);

  return comment?.comments?.map((comment) => (
    <HNThreadComponent key={comment.id} postId={id} {...comment} />
  ));
}

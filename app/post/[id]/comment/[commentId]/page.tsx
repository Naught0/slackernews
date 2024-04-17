import { gatherComments } from "~/app/hackernews-api";
import { HNComment } from "~/app/post/components/comment";
import { HNThreadComponent } from "~/app/post/components/thread";

export default async function Page({
  params: { commentId, id },
}: {
  params: { id: string; commentId: string };
}) {
  const comment = await gatherComments(commentId);

  return (
    <>
      <HNComment op={comment.by} {...comment} />
      {comment?.comments?.map((c) => (
        <HNThreadComponent key={c.id} op={comment.by} postId={id} {...c} />
      ))}
    </>
  );
}

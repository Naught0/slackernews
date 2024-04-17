import Link from "next/link";
import { GoArrowLeft, GoArrowUp } from "react-icons/go";
import { gatherComments } from "~/app/hackernews-api";
import { HNComment } from "~/app/post/components/comment";
import { HNThreadComponent } from "~/app/post/components/thread";

export default async function Page({
  params: { commentId, id },
}: {
  params: { id: string; commentId: string };
}) {
  const comment = await gatherComments(commentId);
  const contextLink = () => {
    if (!comment.parent) return null;

    if (comment.parent.toString() === id) {
      return (
        <Link href={`/post/${id}`} className="gap-1">
          <GoArrowLeft className="mr-1 inline" />
          <span className="underline">Back to post</span>
        </Link>
      );
    } else {
      return (
        <Link href={`/post/${id}/comment/${comment.parent}`}>
          <GoArrowUp className="mr-1 inline" />
          <span className="underline">See more context</span>
        </Link>
      );
    }
  };
  return (
    <>
      {comment.parent && contextLink()}
      {comment.type === "comment" && (
        <HNComment postId={id} op={comment.by} {...comment} />
      )}
      {comment?.comments?.map((c) => (
        <HNThreadComponent key={c.id} op={comment.by} postId={id} {...c} />
      ))}
    </>
  );
}

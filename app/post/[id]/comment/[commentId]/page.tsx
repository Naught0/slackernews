import Link from "next/link";
import { GoArrowLeft, GoArrowUp } from "react-icons/go";
import { getItemById } from "~/app/hackernews-api";
import { getItem } from "~/app/hackernews-api/hnpwa";
import { HNComment } from "~/app/post/components/comment";
import { HNThreadComponent } from "~/app/post/components/thread";

export default async function Page({
  params: { commentId, id },
}: {
  params: { id: string; commentId: string };
}) {
  const comment = await getItem(commentId);
  const rawComment = await getItemById<HNComment>(commentId);
  const contextLink = () => {
    if (!rawComment.parent) return null;

    if (rawComment.parent.toString() === id) {
      return (
        <Link href={`/post/${id}`} className="gap-1">
          <GoArrowLeft className="mr-1 inline" />
          <span className="underline">Back to post</span>
        </Link>
      );
    } else {
      return (
        <Link href={`/post/${id}/comment/${rawComment.parent}`}>
          <GoArrowUp className="mr-1 inline" />
          <span className="underline">See more context</span>
        </Link>
      );
    }
  };
  return (
    <>
      {rawComment.parent && contextLink()}
      {comment.type === "comment" && (
        <HNComment postId={id} op={comment.user} {...comment} />
      )}
      {comment?.comments?.map((c) => (
        <HNThreadComponent key={c.id} op={comment.user} {...c} postId={id} />
      ))}
    </>
  );
}

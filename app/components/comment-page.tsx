import { GoArrowLeft, GoArrowUp } from "react-icons/go";
import { getItemById } from "../hackernews-api";
import { getItem } from "../hackernews-api/hnpwa";
import { HNComment } from "../post/components/comment";
import { HNThreadComponent } from "../post/components/thread";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "~/lib/utils";

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

export async function CommentPage({
  commentId,
  postId,
}: {
  commentId: string;
  postId?: string;
}) {
  const comment = await getItem(commentId);
  if (!comment) notFound();

  const rawComment = await getItemById<HNComment>(commentId);
  const contextLink = () => {
    if (!rawComment.parent) return null;

    if (rawComment.parent.toString() === postId) {
      return <BackToPost postId={postId} />;
    }
    if (postId && rawComment.parent) {
      return (
        <div className="border-color flex flex-row divide-x">
          <BackToPost postId={postId} className="pr-3" />
          <Link
            href={`/post/${postId}/comment/${rawComment.parent}`}
            className="px-2"
          >
            <GoArrowUp className="mr-1 inline" />
            <span className="underline">See more context</span>
          </Link>
        </div>
      );
    }

    return (
      <Link href={`/comment/${rawComment.parent}`} className="underline">
        <GoArrowUp className="mr-1 inline" /> See parent comment
      </Link>
    );
  };
  return (
    <>
      <div className="contents text-sm md:text-base">
        {rawComment.parent && contextLink()}
      </div>
      {comment.type === "comment" && (
        <HNComment postId={postId} op={comment.user} {...comment} />
      )}
      {comment?.comments?.map((c) => (
        <HNThreadComponent
          key={c.id}
          op={comment.user}
          {...c}
          postId={postId}
        />
      ))}
    </>
  );
}

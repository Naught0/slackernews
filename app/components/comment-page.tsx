import { notFound } from "next/navigation";
import { GoArrowLeft, GoArrowUp } from "react-icons/go";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { getItem, getParentPost } from "~/lib/server/hn";
import { getCachedSubtree, getCachedPost } from "~/lib/server/cache";
import { HNComment } from "../post/components/comment";
import { Separator } from "~/components/ui/separator";
import { Post } from "./post";
import { CommentSubtree } from "./comment-subtree";
import type {
  HNComment as HNCommentType,
  HNPost,
  CachedComment,
} from "~/lib/types";

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

function toHydrated(
  cached: CachedComment[],
  postId: number,
): import("~/lib/client/waterfall").HydratedComment[] {
  return cached.map((c) => ({
    id: c.id,
    post_id: postId,
    parent_id: c.parent_id,
    level: c.level,
    by: c.by,
    time: c.time,
    content: c.content,
    kids: c.kids,
    dead: c.dead,
    deleted: c.deleted,
  }));
}

export async function CommentPage({
  commentId,
  postId,
}: {
  commentId: string;
  postId?: string;
}) {
  const item = await getItem(commentId);
  if (!item || (item as HNCommentType).type !== "comment") return notFound();

  const comment = item as HNCommentType;

  const contextLink = () => {
    if (!comment.parent) return null;

    const parentId = comment.parent.toString();
    if (parentId === postId) {
      return <BackToPost postId={postId!} />;
    }
    if (postId && comment.parent) {
      return (
        <div className="border-color flex flex-row divide-x">
          <BackToPost postId={postId} className="pr-3" />
          <Link
            href={`/post/${postId}/comment/${comment.parent}`}
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
        href={`/comment/${comment.parent}`}
        className="underline"
        prefetch={false}
      >
        <GoArrowUp className="mr-1 inline" /> See parent comment
      </Link>
    );
  };

  const commentIdNum = parseInt(commentId, 10);
  const resolvedPostId = postId
    ? parseInt(postId, 10)
    : await (async () => {
        const parent = await getParentPost(commentIdNum);
        return parent?.id ?? null;
      })();

  const cachedSubtree = !isNaN(commentIdNum)
    ? getCachedSubtree(commentIdNum, 100)
    : null;

  const cachedPost = resolvedPostId
    ? getCachedPost(resolvedPostId)
    : null;

  let post: HNPost | null = cachedPost?.post ?? null;
  if (!post && resolvedPostId) {
    const item = await getItem(resolvedPostId);
    if (item) {
      const t = (item as { type?: string }).type;
      if (t && t !== "comment") {
        post = item as HNPost;
      }
    }
  }

  const postTime = post?.time ?? comment.time;
  const op = post?.by ?? null;

  return (
    <>
      {post && (
        <>
          <Post story={post} showHnLink />
          <Separator />
        </>
      )}
      <div className="mb-3 text-sm md:text-base">
        {comment.parent && contextLink()}
      </div>
      {comment.type === "comment" && (
        <HNComment
          id={comment.id}
          user={comment.by}
          time={comment.time}
          content={comment.text ?? null}
          deleted={comment.deleted}
          dead={comment.dead}
          postId={postId}
          anchor
        />
      )}
      <Separator />
      {resolvedPostId !== null && !isNaN(commentIdNum) ? (
        <CommentSubtree
          rootId={commentIdNum}
          postId={resolvedPostId}
          postTime={postTime}
          op={op}
          initialComments={cachedSubtree ? toHydrated(cachedSubtree, resolvedPostId) : undefined}
        />
      ) : (
        <div className="text-muted-foreground p-4 text-sm">
          Unable to load replies.
        </div>
      )}
    </>
  );
}

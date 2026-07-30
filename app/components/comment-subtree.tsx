"use client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FadeIn } from "~/components/ui/fade-in";
import { Skeleton } from "~/components/ui/skeleton";
import { HNComment } from "~/app/post/components/comment";
import { Collapsible } from "~/app/post/components/collapsible";
import { fetchHnItem } from "~/lib/hn";

function ReplySkeleton() {
  return (
    <div className="mb-1">
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>
    </div>
  );
}

export function CommentSubtree({
  rootId,
  postId,
  op,
}: {
  rootId: number;
  postId: number;
  op?: string | null;
}) {
  return <SubtreeNode commentId={rootId} postId={postId} op={op} depth={1} />;
}

function SubtreeNode({
  commentId,
  postId,
  op,
  depth,
}: {
  commentId: number;
  postId: number;
  op?: string | null;
  depth: number;
}) {
  const { data: item, isLoading } = useQuery({
    queryKey: ["item", commentId],
    queryFn: () => fetchHnItem(commentId),
  });

  if (isLoading) return <ReplySkeleton />;
  if (!item || item.deleted || item.dead) return null;

  const collapsedIndicator = (
    <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
      <span className="font-bold not-italic text-muted-foreground">
        {item.by ?? "[deleted]"}
      </span>
      <span>{formatDistanceToNow(item.time * 1000, { addSuffix: true })}</span>
    </span>
  );

  return (
    <FadeIn delay={Math.min((depth - 1) * 30, 200)}>
      <div className="mb-1">
        <Collapsible
          persistId={`collapse:${item.id}`}
          className="flex"
          collapsedElement={collapsedIndicator}
          indentLevel={depth}
        >
          <HNComment
            id={item.id}
            user={item.by ?? null}
            time={item.time}
            content={item.text ?? null}
            deleted={item.deleted}
            dead={item.dead}
            op={op}
            postId={String(postId)}
          />
          {item.kids && item.kids.length > 0 && (
            <div className="flex flex-col">
              {item.kids.map((kidId) => (
                <SubtreeNode
                  key={kidId}
                  commentId={kidId}
                  postId={postId}
                  op={op}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </Collapsible>
      </div>
    </FadeIn>
  );
}

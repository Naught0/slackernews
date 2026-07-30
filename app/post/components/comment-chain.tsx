"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "~/components/ui/fade-in";
import { Collapsible } from "./collapsible";
import { CommentBody } from "~/components/comment-body";
import { Skeleton } from "~/components/ui/skeleton";
import { sanitizeComment } from "~/lib/client/sanitize-comment";
import { fetchHnComment } from "~/lib/hn";

const MAX_INLINE_DEPTH = 4;
const VIEWPORT_MARGIN = 200;

function useNearViewport() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNear(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: `${VIEWPORT_MARGIN}px` },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [near]);
  return { ref, near };
}

function ChainSkeleton() {
  return (
    <div className="flex">
      <div className="w-8 shrink-0" />
      <div className="min-w-0 flex-1 border-l-2 border-solid border-slate-200 py-2 pl-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}

function FailedPlaceholder({ id }: { id: number }) {
  return (
    <div className="flex">
      <div className="w-8 shrink-0" />
      <div className="min-w-0 flex-1 border-l-2 border-solid border-slate-100 py-1 pl-2 text-xs italic text-muted-foreground">
        [comment {id} unavailable]
      </div>
    </div>
  );
}

function SeeInContext({
  commentId,
  postId,
  replyCount,
}: {
  commentId: number;
  postId?: string;
  replyCount: number;
}) {
  if (!postId) return null;
  return (
    <Link
      href={`/post/${postId}/comment/${commentId}`}
      prefetch={false}
      className="text-foreground hover:opacity-80 mt-2 inline-block text-sm font-semibold underline"
    >
      See {replyCount} {replyCount === 1 ? "reply" : "replies"} →
    </Link>
  );
}

export function CommentChain(props: {
  rootId: number;
  depth: number;
  op?: string;
  postId?: string;
}) {
  const isTopLevel = props.depth === 1;
  const { ref, near } = useNearViewport();
  const shouldFetch = isTopLevel || near;

  const q = useQuery({
    queryKey: ["comment", props.rootId],
    queryFn: () => fetchHnComment(props.rootId),
    enabled: shouldFetch,
    retry: 1,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const [sanitized, setSanitized] = useState<string | null>(null);
  const item = q.data ?? null;

  useEffect(() => {
    if (item && (item.deleted || item.dead)) {
      setSanitized(null);
      return;
    }
    if (item && item.content !== undefined && item.content !== null) {
      sanitizeComment(item.content).then(setSanitized);
      return;
    }
    setSanitized(null);
  }, [item]);

  if (q.isError) {
    return <FailedPlaceholder id={props.rootId} />;
  }

  if (!shouldFetch || q.isLoading || !item) {
    return (
      <div ref={ref}>
        <ChainSkeleton />
      </div>
    );
  }

  if (item.deleted || item.dead) {
    return (
      <FadeIn delay={Math.min((props.depth - 1) * 30, 200)}>
        <Collapsible
          persistId={`collapse:${item.id}`}
          className="flex"
          indentLevel={props.depth}
          collapsedElement={
            <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
              <span className="font-bold not-italic text-muted-foreground">
                {item.by ?? "[deleted]"}
              </span>
            </span>
          }
        >
          <CommentBody
            id={item.id}
            user={item.by}
            time={item.time}
            content={null}
            op={props.op}
            postId={props.postId}
            deleted={item.deleted}
            dead={item.dead}
          />
        </Collapsible>
      </FadeIn>
    );
  }

  const collapsedIndicator = (
    <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
      <span className="font-bold not-italic text-muted-foreground">
        {item.by ?? "[deleted]"}
      </span>
    </span>
  );

  const atMaxDepth = props.depth >= MAX_INLINE_DEPTH;
  const hasMoreKids = item.kids.length > 0;

  return (
    <FadeIn delay={Math.min((props.depth - 1) * 30, 200)}>
      <Collapsible
        persistId={`collapse:${item.id}`}
        className="flex"
        indentLevel={props.depth}
        collapsedElement={collapsedIndicator}
      >
        <CommentBody
          id={item.id}
          user={item.by}
          time={item.time}
          content={sanitized}
          op={props.op}
          postId={props.postId}
          deleted={item.deleted}
          dead={item.dead}
        />
        {!atMaxDepth && hasMoreKids && (
          <div className="flex flex-col">
            {item.kids.map((kidId) => (
              <CommentChain
                key={kidId}
                rootId={kidId}
                depth={props.depth + 1}
                op={props.op}
                postId={props.postId}
              />
            ))}
          </div>
        )}
        {atMaxDepth && hasMoreKids && (
          <SeeInContext
            commentId={item.id}
            postId={props.postId}
            replyCount={item.kids.length}
          />
        )}
      </Collapsible>
    </FadeIn>
  );
}

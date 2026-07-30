"use client";
import React, { useEffect, useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { FadeIn } from "~/components/ui/fade-in";
import { Skeleton } from "~/components/ui/skeleton";
import { HNComment } from "~/app/post/components/comment";
import { Collapsible } from "~/app/post/components/collapsible";
import {
  fetchSubtreeBatched,
  type HydratedComment,
  type BatchFetchFn,
  type BatchFetchResponse,
} from "~/lib/client/waterfall";

function CommentSkeleton() {
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

function ProgressBar({
  loaded,
  total,
  done,
}: {
  loaded: number;
  total: number;
  done: boolean;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-1 rounded-md border border-slate-200 bg-background/80 px-3 py-2 backdrop-blur">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {!done && (
            <span className="inline-block size-2 animate-pulse rounded-full bg-slate-400" />
          )}
          {done ? "Loaded" : "Loading"} {loaded} of {total} replies
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-slate-500 transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CommentSubtree({
  rootId,
  postId,
  postTime,
  op,
  initialComments,
}: {
  rootId: number;
  postId: number;
  postTime?: number;
  op?: string | null;
  initialComments?: HydratedComment[];
}) {
  const initialMap = useMemo(() => {
    const m = new Map<number, HydratedComment>();
    if (initialComments) {
      for (const c of initialComments) {
        m.set(c.id, c);
      }
    }
    return m;
  }, [initialComments]);

  const [nodes, setNodes] = useState<Map<number, HydratedComment>>(initialMap);
  const [order, setOrder] = useState<number[]>(() =>
    initialComments ? initialComments.map((c) => c.id) : [],
  );
  const [progress, setProgress] = useState({
    loaded: initialComments?.length ?? 0,
    total: initialComments?.length ?? 0,
  });
  const [done, setDone] = useState(Boolean(initialComments && initialComments.length > 0));
  const [error, setError] = useState<string | null>(null);

  const hasInitial = Boolean(initialComments && initialComments.length > 0);

  useEffect(() => {
    if (hasInitial) {
      return;
    }

    let cancelled = false;

    const fetcher: BatchFetchFn = async (req) => {
      const resp = await fetch("/api/subtree/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!resp.ok) {
        return {
          comments: [],
          missing: req.ids,
          nextCursor: req.cursor + req.limit,
          hasMore: req.cursor + req.limit < req.ids.length,
          total: req.ids.length,
        } satisfies BatchFetchResponse;
      }
      return (await resp.json()) as BatchFetchResponse;
    };

    fetchSubtreeBatched(
      [rootId],
      {
        postId,
        postTime,
        maxDepth: 100,
        baseLevel: 1,
        fetcher,
        chunkSize: 20,
        onComment: (comment) => {
          if (cancelled) return;
          setNodes((prev) => {
            if (prev.has(comment.id)) return prev;
            const next = new Map(prev);
            next.set(comment.id, comment);
            return next;
          });
          setOrder((prev) =>
            prev.includes(comment.id) ? prev : [...prev, comment.id],
          );
        },
        onProgress: (loaded, total) => {
          if (cancelled) return;
          setProgress({ loaded, total });
        },
      },
    )
      .then(() => {
        if (!cancelled) setDone(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load replies");
      });

    return () => {
      cancelled = true;
    };
  }, [rootId, postId, postTime, initialComments]);

  const childrenByParent = useMemo(() => {
    const m = new Map<number, HydratedComment[]>();
    for (const c of nodes.values()) {
      const list = m.get(c.parent_id) ?? [];
      list.push(c);
      m.set(c.parent_id, list);
    }
    for (const [, list] of m) {
      list.sort((a, b) => a.id - b.id);
    }
    return m;
  }, [nodes]);

  const root = nodes.get(rootId);
  const descendants = order.filter((id) => id !== rootId);
  const expectedCount = progress.total > 0 ? progress.total - 1 : 0;
  const showProgress = !done && descendants.length < expectedCount;

  if (!root) {
    if (done) {
      return (
        <div className="text-muted-foreground p-4 text-sm">
          Comments unavailable.
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <ProgressBar loaded={0} total={1} done={false} />
        <CommentSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showProgress && (
        <ProgressBar
          loaded={descendants.length}
          total={Math.max(expectedCount, descendants.length) + 1}
          done={done}
        />
      )}
      {error && (
        <div className="text-destructive text-sm">Failed: {error}</div>
      )}
      {descendants.length === 0 && done && (
        <div className="text-muted-foreground p-4 text-sm">No replies.</div>
      )}
      {descendants.map((id) => {
        const comment = nodes.get(id)!;
        return (
          <FadeIn
            key={id}
            delay={Math.min((comment.level - 1) * 30, 200)}
          >
            <SubtreeNode
              comment={comment}
              allNodes={nodes}
              childrenByParent={childrenByParent}
              postId={postId}
              op={op}
            />
          </FadeIn>
        );
      })}
    </div>
  );
}

function SubtreeNode({
  comment,
  allNodes,
  childrenByParent,
  postId,
  op,
}: {
  comment: HydratedComment;
  allNodes: Map<number, HydratedComment>;
  childrenByParent: Map<number, HydratedComment[]>;
  postId: number;
  op?: string | null;
}) {
  const children = childrenByParent.get(comment.id) ?? [];
  const collapsedIndicator = (
    <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
      <span className="font-bold not-italic text-muted-foreground">
        {comment.by ?? "[deleted]"}
      </span>
      <span>{formatDistanceToNow(comment.time * 1000, { addSuffix: true })}</span>
    </span>
  );
  return (
    <div className="mb-1">
      <Collapsible
        persistId={`collapse:${comment.id}`}
        className="flex"
        collapsedElement={collapsedIndicator}
        indentLevel={comment.level}
      >
        <HNComment
          id={comment.id}
          user={comment.by}
          time={comment.time}
          content={comment.content}
          deleted={comment.deleted}
          dead={comment.dead}
          op={op}
          postId={String(postId)}
        />
        {children.length > 0 &&
          children.map((child) => (
            <SubtreeNode
              key={child.id}
              comment={child}
              allNodes={allNodes}
              childrenByParent={childrenByParent}
              postId={postId}
              op={op}
            />
          ))}
        {children.length === 0 && comment.kids.length > 0 && (
          <div className="pl-4 pt-1 text-xs text-muted-foreground italic">
            {comment.kids.length} repl{comment.kids.length === 1 ? "y" : "ies"} not loaded
          </div>
        )}
      </Collapsible>
    </div>
  );
}

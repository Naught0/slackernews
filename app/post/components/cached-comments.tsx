"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FadeIn } from "~/components/ui/fade-in";
import { Skeleton } from "~/components/ui/skeleton";
import { HNComment } from "./comment";
import { Collapsible } from "./collapsible";
import {
  fetchSubtreeBatched,
  type HydratedComment,
  type BatchFetchFn,
  type BatchFetchResponse,
} from "~/lib/client/waterfall";
import type { CachedComment, StoryResponse, SubtreeNode } from "~/lib/types";

const MAX_INLINE_DEPTH = 4;

function SeeMore({
  commentId,
  postId,
  replyCount,
}: {
  commentId: number;
  postId: string;
  replyCount: number;
}) {
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

interface SubtreeChild {
  comment: CachedComment | HydratedComment;
  kids: SubtreeChild[];
}

function CommentNode({
  comment,
  kids,
  depth,
  maxDepth,
  postId,
  op,
}: {
  comment: CachedComment | HydratedComment;
  kids: SubtreeChild[];
  depth: number;
  maxDepth: number;
  postId: string;
  op?: string | null;
}) {
  const isAtMaxDepth = depth >= maxDepth;
  const collapsedIndicator = (
    <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
      <span className="font-bold not-italic text-muted-foreground">
        {comment.by ?? "[deleted]"}
      </span>
      {comment.kids.length > 0 && (
        <span>
          · {comment.kids.length} repl{comment.kids.length === 1 ? "y" : "ies"}
        </span>
      )}
    </span>
  );

  return (
    <div className="mb-1">
      <Collapsible
        persistId={`collapse:${comment.id}`}
        className="flex"
        collapsedElement={collapsedIndicator}
        indentLevel={depth}
      >
        <HNComment
          id={comment.id}
          user={comment.by}
          time={comment.time}
          content={comment.content}
          deleted={comment.deleted}
          dead={comment.dead}
          op={op}
          postId={postId}
        />
        {!isAtMaxDepth && kids.length > 0 && (
          <div className="flex flex-col">
            {kids.map((child) => (
              <CommentNode
                key={child.comment.id}
                comment={child.comment}
                kids={child.kids}
                depth={depth + 1}
                maxDepth={maxDepth}
                postId={postId}
                op={op}
              />
            ))}
          </div>
        )}
        {isAtMaxDepth && comment.kids.length > 0 && (
          <div className="pl-4 pt-1">
            <SeeMore
              commentId={comment.id}
              postId={postId}
              replyCount={comment.kids.length}
            />
          </div>
        )}
      </Collapsible>
    </div>
  );
}

function buildSubtree(
  id: number,
  allNodes: Map<number, HydratedComment | CachedComment>,
  currentLevel: number,
  maxLevel: number,
  visited: Set<number>,
): { comment: HydratedComment | CachedComment; kids: SubtreeChild[] } | null {
  if (visited.has(id)) return null;
  visited.add(id);
  const comment = allNodes.get(id);
  if (!comment) return null;
  if (currentLevel >= maxLevel || comment.kids.length === 0) {
    return { comment, kids: [] };
  }
  const kids: SubtreeChild[] = [];
  for (const kidId of comment.kids) {
    const child = buildSubtree(
      kidId,
      allNodes,
      currentLevel + 1,
      maxLevel,
      visited,
    );
    if (child) kids.push(child);
  }
  return { comment, kids };
}

function convertSubtree(node: SubtreeNode): SubtreeChild {
  return {
    comment: node.comment,
    kids: node.children.map(convertSubtree),
  };
}

function CachedBranch({
  node,
  postId,
  op,
  maxDepth,
}: {
  node: SubtreeNode;
  postId: string;
  op?: string | null;
  maxDepth: number;
}) {
  return (
    <CommentNode
      comment={node.comment}
      kids={convertSubtree(node).kids}
      depth={1}
      maxDepth={maxDepth}
      postId={postId}
      op={op}
    />
  );
}

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
            <span className="bg-muted-foreground/60 inline-block size-2 animate-pulse rounded-full" />
          )}
          {done ? "Loaded" : "Loading"} {loaded} of {total} comments
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

export function CachedCommentsList({
  initialSubtree,
  postId,
  postTime,
  op,
}: {
  initialSubtree: StoryResponse["initialSubtree"];
  postId: string;
  postTime: number;
  op: string | null;
}) {
  const uncachedIds = useMemo(
    () => initialSubtree.filter((s) => !s.cached).map((s) => s.id),
    [initialSubtree],
  );
  const cachedItems = useMemo(
    () =>
      initialSubtree.filter(
        (s): s is Extract<typeof s, { cached: true }> => s.cached,
      ),
    [initialSubtree],
  );
  const cachedById = useMemo(() => {
    const m = new Map<
      number,
      { comment: CachedComment; children: SubtreeNode[] }
    >();
    for (const item of cachedItems) {
      m.set(item.id, { comment: item.comment, children: item.children });
    }
    return m;
  }, [cachedItems]);

  const [fetched, setFetched] = useState<Map<number, HydratedComment>>(
    () =>
      new Map(cachedItems.map((c) => [c.id, c.comment as HydratedComment])),
  );
  const [progress, setProgress] = useState({
    loaded: cachedItems.length,
    total: initialSubtree.length,
  });
  const [done, setDone] = useState(uncachedIds.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setFetched(
      new Map(cachedItems.map((c) => [c.id, c.comment as HydratedComment])),
    );
    setProgress({
      loaded: cachedItems.length,
      total: initialSubtree.length,
    });

    if (uncachedIds.length === 0) {
      setDone(true);
      return;
    }

    let cancelled = false;
    setDone(false);

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

    fetchSubtreeBatched(uncachedIds, {
      postId: Number(postId),
      postTime,
      maxDepth: MAX_INLINE_DEPTH,
      baseLevel: 1,
      fetcher,
      chunkSize: 20,
      onComment: (c) => {
        if (cancelled) return;
        setFetched((prev) => {
          if (prev.has(c.id)) return prev;
          const next = new Map(prev);
          next.set(c.id, c);
          return next;
        });
      },
      onProgress: (loaded) => {
        if (cancelled) return;
        setProgress({
          loaded: Math.max(loaded, cachedItems.length),
          total: initialSubtree.length,
        });
      },
    })
      .then(() => {
        if (!cancelled) setDone(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load comments");
      });

    return () => {
      cancelled = true;
    };
  }, [postId, postTime, uncachedIds, cachedItems, initialSubtree.length]);

  const showProgress =
    uncachedIds.length > 0 && (!done || fetched.size < initialSubtree.length);
  const visibleLoaded = Math.min(fetched.size, initialSubtree.length);

  return (
    <div className="flex flex-col gap-3">
      {showProgress && (
        <ProgressBar
          loaded={visibleLoaded}
          total={initialSubtree.length}
          done={done}
        />
      )}
      {error && (
        <div className="text-destructive text-sm">
          Failed to load comments: {error}
        </div>
      )}
      {initialSubtree.map((item) => {
        if (item.cached) {
          return (
            <FadeIn key={item.id}>
              <CachedBranch
                node={cachedById.get(item.id)!}
                postId={postId}
                op={op}
                maxDepth={MAX_INLINE_DEPTH}
              />
            </FadeIn>
          );
        }
        const fetchedComment = fetched.get(item.id);
        const cached = cachedById.get(item.id);
        if (fetchedComment) {
          const all = new Map<number, HydratedComment>(fetched);
          for (const ci of cachedItems) {
            if (!all.has(ci.id)) {
              all.set(ci.id, ci.comment as HydratedComment);
            }
          }
          const visited = new Set<number>();
          const subtree = buildSubtree(item.id, all, 1, MAX_INLINE_DEPTH, visited);
          if (subtree) {
            return (
              <FadeIn
                key={item.id}
                delay={Math.min((fetchedComment.level - 1) * 30, 200)}
              >
                <CommentNode
                  comment={subtree.comment}
                  kids={subtree.kids}
                  depth={1}
                  maxDepth={MAX_INLINE_DEPTH}
                  postId={postId}
                  op={op}
                />
              </FadeIn>
            );
          }
        }
        if (cached) {
          return (
            <FadeIn key={item.id}>
              <CachedBranch
                node={cached}
                postId={postId}
                op={op}
                maxDepth={MAX_INLINE_DEPTH}
              />
            </FadeIn>
          );
        }
        return (
          <FadeIn key={item.id}>
            <CommentSkeleton />
          </FadeIn>
        );
      })}
    </div>
  );
}

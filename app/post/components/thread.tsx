"use client";
import React from "react";
import Link from "next/link";
import { FadeIn } from "~/components/ui/fade-in";
import { Skeleton } from "~/components/ui/skeleton";
import { HNComment } from "./comment";
import {
  fetchSubtreeBatched,
  type HydratedComment,
  type BatchFetchFn,
  type BatchFetchResponse,
} from "~/lib/client/waterfall";
import type { StoryResponse, SubtreeNode, CachedComment } from "~/lib/types";

function SeeMore({
  commentId,
  postId,
}: {
  commentId: number;
  postId: string;
}) {
  return (
    <Link
      href={`/post/${postId}/comment/${commentId}`}
      className="hover:opacity-80"
      prefetch={false}
    >
      See replies <span className="ml-1">→</span>
    </Link>
  );
}

function CommentNode({
  comment,
  children,
  depth,
  maxDepth,
  postId,
  op,
}: {
  comment: CachedComment | HydratedComment;
  children: Array<{ comment: CachedComment | HydratedComment; children: any[] }>;
  depth: number;
  maxDepth: number;
  postId: string;
  op?: string | null;
}) {
  const isAtMaxDepth = depth >= maxDepth;

  return (
    <div className="mb-1">
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
      {!isAtMaxDepth && children.length > 0 && (
        <div className="pl-3 border-l-2 border-solid border-slate-300 ml-2">
          {children.map((child) => (
            <CommentNode
              key={child.comment.id}
              comment={child.comment}
              children={child.children}
              depth={depth + 1}
              maxDepth={maxDepth}
              postId={postId}
              op={op}
            />
          ))}
        </div>
      )}
      {isAtMaxDepth && comment.kids.length > 0 && (
        <div className="pl-8 pt-1 text-sm text-accent-foreground underline lg:text-base">
          <SeeMore commentId={comment.id} postId={postId} />
        </div>
      )}
    </div>
  );
}

function buildSubtree(
  id: number,
  allNodes: Map<number, HydratedComment | CachedComment>,
  currentLevel: number,
  maxLevel: number,
  visited: Set<number>,
): {
  comment: HydratedComment | CachedComment;
  children: Array<{ comment: HydratedComment | CachedComment; children: any[] }>;
} | null {
  if (visited.has(id)) return null;
  visited.add(id);
  const comment = allNodes.get(id);
  if (!comment) return null;
  if (currentLevel >= maxLevel || comment.kids.length === 0) {
    return { comment, children: [] };
  }
  const children: Array<any> = [];
  for (const kidId of comment.kids) {
    const child = buildSubtree(kidId, allNodes, currentLevel + 1, maxLevel, visited);
    if (child) children.push(child);
  }
  return { comment, children };
}

function CachedBranch({
  node,
  postId,
  op,
}: {
  node: SubtreeNode;
  postId: string;
  op?: string | null;
}) {
  return (
    <CommentNode
      comment={node.comment}
      children={node.children}
      depth={1}
      maxDepth={3}
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
            <span className="inline-block size-2 animate-pulse rounded-full bg-slate-400" />
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

function CommentsList({
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
  const uncachedIds = React.useMemo(
    () => initialSubtree.filter((s) => !s.cached).map((s) => s.id),
    [initialSubtree],
  );
  const cachedItems = React.useMemo(
    () =>
      initialSubtree.filter(
        (s): s is Extract<typeof s, { cached: true }> => s.cached,
      ),
    [initialSubtree],
  );
  const cachedById = React.useMemo(() => {
    const m = new Map<
      number,
      { comment: CachedComment; children: SubtreeNode[] }
    >();
    for (const item of cachedItems) {
      m.set(item.id, { comment: item.comment, children: item.children });
    }
    return m;
  }, [cachedItems]);

  const [fetched, setFetched] = React.useState<Map<number, HydratedComment>>(
    () => new Map(cachedItems.map((c) => [c.id, c.comment as HydratedComment])),
  );
  const [progress, setProgress] = React.useState({
    loaded: cachedItems.length,
    total: initialSubtree.length,
  });
  const [done, setDone] = React.useState(uncachedIds.length === 0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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
      maxDepth: 3,
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
      onProgress: (loaded, _total) => {
        if (cancelled) return;
        setProgress({
          loaded: Math.max(loaded, cachedItems.length),
          total: initialSubtree.length,
        });
      },
    })
      .then(() => {
        if (cancelled) return;
        setDone(true);
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
          const subtree = buildSubtree(item.id, all, 1, 3, visited);
          if (subtree) {
            return (
              <FadeIn key={item.id} delay={Math.min((fetchedComment.level - 1) * 30, 200)}>
                <CommentNode
                  comment={subtree.comment}
                  children={subtree.children as any}
                  depth={1}
                  maxDepth={3}
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
              <CachedBranch node={cached} postId={postId} op={op} />
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

export function Thread({
  postId,
  currentPage,
  totalPages,
  data,
}: {
  postId: string;
  currentPage: number;
  totalPages: number;
  data: StoryResponse;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CommentsList
        key={`${postId}:${currentPage}`}
        initialSubtree={data.initialSubtree}
        postId={postId}
        postTime={data.post.time}
        op={data.post.by}
      />
      {totalPages > 1 && (
        <Pagination
          postId={postId}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}

function Pagination({
  postId,
  currentPage,
  totalPages,
}: {
  postId: string;
  currentPage: number;
  totalPages: number;
}) {
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const prevHref = prevPage > 0 ? `/post/${postId}?page=${prevPage}` : null;
  const nextHref = nextPage < totalPages ? `/post/${postId}?page=${nextPage}` : null;

  return (
    <div className="flex justify-center gap-4 py-6 text-sm lg:text-base">
      {prevHref ? (
        <Link
          href={prevHref}
          className="rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-50"
          prefetch={false}
        >
          ← Previous page
        </Link>
      ) : (
        <span className="rounded-md border border-slate-100 px-4 py-2 text-muted-foreground opacity-50">
          ← Previous page
        </span>
      )}
      <span className="flex items-center text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </span>
      {nextHref ? (
        <Link
          href={nextHref}
          className="rounded-md border border-slate-200 px-4 py-2 hover:bg-slate-50"
          prefetch={false}
        >
          Next page →
        </Link>
      ) : (
        <span className="rounded-md border border-slate-100 px-4 py-2 text-muted-foreground opacity-50">
          Next page →
        </span>
      )}
    </div>
  );
}

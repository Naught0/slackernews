"use client";
import { useEffect, useRef, useState } from "react";
import { CommentChain } from "./comment-chain";
import { Skeleton } from "~/components/ui/skeleton";

function TopLevelSkeleton() {
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

function useEager() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [eager, setEager] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (eager) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEager(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);
  return { ref, eager };
}

export function CommentCascade(props: {
  topLevelIds: number[];
  source: "server" | "hn";
  op?: string;
  postId?: string;
}) {
  const { ref, eager } = useEager();

  return (
    <div className="flex flex-col gap-3">
      <div ref={ref}>
        {eager ? (
          <CommentChain
            rootId={props.topLevelIds[0]}
            depth={1}
            op={props.op}
            source={props.source}
            postId={props.postId}
            eager
          />
        ) : (
          <TopLevelSkeleton />
        )}
      </div>
      {props.topLevelIds.slice(1).map((id) => (
        <CommentChain
          key={id}
          rootId={id}
          depth={1}
          op={props.op}
          source={props.source}
          postId={props.postId}
        />
      ))}
    </div>
  );
}

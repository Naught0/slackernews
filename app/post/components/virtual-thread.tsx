"use client";
import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { Collapsible } from "./collapsible";
import { HNComment } from "./comment";
import Link from "next/link";
import { GoArrowRight } from "react-icons/go";
import { AnchorButtons } from "./anchor-buttons";
import { Button } from "~/components/ui/button";
import { ArrowDownToLine } from "lucide-react";

const indentColorsClassName = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
];
const rightBorder = "border-l-2 border-solid";

function getIndentColor(indentLevel?: number) {
  return indentColorsClassName[indentLevel ?? 0] ?? indentColorsClassName[0];
}

const NestedComments = React.memo(
  ({
    comments,
    indentLevel,
    maxDepth,
    postId,
    op,
  }: {
    comments: HNPWAItem[];
    indentLevel: number;
    maxDepth: number;
    postId?: string;
    op?: string | null;
  }) => {
    const indentColor = getIndentColor(indentLevel);
    const isAtMaxDepth = indentLevel >= maxDepth;

    const commentsToRender = indentLevel > 2 ? comments.slice(0, 3) : comments;

    return (
      <div className={`grid items-start`}>
        {commentsToRender.map((comment: HNPWAItem) => (
          <div key={comment.id} className="mb-1">
            <Collapsible
              persistId={`collapse:${comment.id}`}
              collapsedElement={
                <CollapsedComment
                  user={comment.user ?? "???"}
                  timeAgo={comment.time_ago}
                />
              }
            >
              <div className={`${rightBorder} ${indentColor}`}>
                <HNComment
                  {...comment}
                  anchor={false}
                  postId={postId}
                  op={op}
                />
                {!isAtMaxDepth && comment.comments.length > 0 && (
                  <NestedComments
                    comments={comment.comments}
                    indentLevel={indentLevel + 1}
                    maxDepth={maxDepth}
                    postId={postId}
                    op={op}
                  />
                )}
              </div>
            </Collapsible>
            {isAtMaxDepth && comment.comments.length > 0 && (
              <div className="pl-8 pt-1 text-sm text-accent-foreground underline lg:text-base">
                <Link href={`/comment/${comment.id}`} prefetch={false}>
                  {comment.comments.length} repl
                  {comment.comments.length === 1 ? "y" : "ies"}
                  <GoArrowRight className="ml-1 inline" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  },
);

NestedComments.displayName = "NestedComments";

export const VirtualThread = ({
  comments,
  maxDepth = 3,
  postId,
  op,
}: HNPWAItem & {
  maxDepth?: number;
  postId?: string;
  op?: string | null;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{
        height: "98vh",
        overflow: "auto",
      }}
    >
      {comments.length > 2 && (
        <div className="mb-6 flex justify-center">
          <Button
            className="grid items-center justify-center text-slate-300"
            variant="link"
            onClick={(e) =>
              (e.target as HTMLButtonElement).parentElement?.scrollIntoView({
                inline: "start",
                block: "start",
              })
            }
          >
            <ArrowDownToLine className="m-auto size-9" strokeWidth={1} />
          </Button>
        </div>
      )}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <AnchorButtons container={parentRef.current} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => {
            const comment = comments[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="mb-1.5"
              >
                <div className={`flex flex-col items-start gap-9`}>
                  <Collapsible
                    collapsedElement={
                      <CollapsedComment
                        user={comment.user ?? ""}
                        timeAgo={comment.time_ago}
                      />
                    }
                    persistId={`collapse:${comment.id}`}
                  >
                    <div
                      className={`${rightBorder} ${indentColorsClassName[0]}`}
                    >
                      <HNComment
                        {...comment}
                        anchor={true}
                        postId={postId}
                        op={op}
                      />
                      {comment.comments.length > 0 && (
                        <NestedComments
                          comments={comment.comments}
                          indentLevel={1}
                          maxDepth={maxDepth}
                          postId={postId}
                          op={op}
                        />
                      )}
                    </div>
                  </Collapsible>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function CollapsedComment({
  user,
  timeAgo,
}: {
  user: string;
  timeAgo: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-primary-foreground opacity-70">
      <span className="text-muted-foreground">{user}</span>
      {timeAgo}
    </span>
  );
}

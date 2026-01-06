import Link from "next/link";
import { GoArrowRight } from "react-icons/go";
import { HNComment } from "./comment";
import { AnchorButtons } from "./anchor-buttons";
import { Collapsible } from "./collapsible";

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

function getIndentColor(indentLevel: number) {
  return indentColorsClassName[indentLevel] ?? indentColorsClassName[0];
}

const StaticNestedComments = ({
  comments,
  indentLevel,
  maxDepth,
  postId,
  op,
}: {
  comments: any[];
  indentLevel: number;
  maxDepth: number;
  postId?: string;
  op?: string | null;
}) => {
  const indentColor = getIndentColor(indentLevel);
  const isAtMaxDepth = indentLevel >= maxDepth;

  return (
    <div className="grid items-start">
      {comments.map((comment) => (
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
            <div className={`${rightBorder} ${indentColor} pl-2`}>
              <HNComment {...comment} anchor={false} postId={postId} op={op} />

              {!isAtMaxDepth && comment.comments?.length > 0 && (
                <StaticNestedComments
                  comments={comment.comments}
                  indentLevel={indentLevel + 1}
                  maxDepth={maxDepth}
                  postId={postId}
                  op={op}
                />
              )}
            </div>
          </Collapsible>

          {isAtMaxDepth && comment.comments?.length > 0 && (
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
};

export const StaticThread = ({
  comments,
  maxDepth = 3,
  postId,
  op,
}: {
  comments: any[];
  maxDepth?: number;
  postId?: string;
  op?: string | null;
}) => {
  return (
    <div>
      <AnchorButtons container={null} />
      {comments.map((comment) => (
        <div key={comment.id} className="mb-2">
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
              className={`${rightBorder} ${indentColorsClassName[0]} ml-1 max-w-screen-md pl-2`}
            >
              <HNComment {...comment} anchor={true} postId={postId} op={op} />
              {comment.comments?.length > 0 && (
                <StaticNestedComments
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
      ))}
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
    <span className="inline-flex items-center gap-1 opacity-70">
      <span className="font-bold text-muted-foreground">{user}</span>
      <span className="text-xs">{timeAgo}</span>
    </span>
  );
}

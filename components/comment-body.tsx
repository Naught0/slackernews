import Link from "next/link";
import { RiHashtag } from "react-icons/ri";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "~/components/ui/timestamp";
import { HNLink } from "~/app/components/hn-link";

export interface CommentBodyProps {
  id: number;
  user: string | null;
  time: number;
  content: string | null;
  deleted?: boolean;
  dead?: boolean;
  op?: string | null;
  postId?: string;
  anchor?: boolean;
}

export function CommentBody(props: CommentBodyProps) {
  const commentLink = props.postId
    ? `/post/${props.postId}/comment/${props.id}`
    : `/comment/${props.id}`;
  const isOp = !props.deleted && props.user === props.op;
  const timeAgo = formatDistanceToNow(props.time * 1000, { addSuffix: true });
  const showDeleted = props.deleted || props.dead;

  return (
    <article
      className={`${props.anchor ? "anchor " : ""}${showDeleted ? "opacity-70" : ""} flex min-w-0 flex-1 flex-col items-start gap-y-1`}
    >
      <div className="flex w-full flex-row flex-wrap items-center gap-1 text-sm lg:text-base">
        {showDeleted ? (
          <span className="text-muted-foreground">[deleted]</span>
        ) : (
          <Link
            href={`/user/${props.user}`}
            className={`font-bold ${isOp ? "text-link-foreground" : "text-muted-foreground"}`}
            prefetch={false}
          >
            {props.user}
          </Link>
        )}
        <div className="flex flex-row items-center gap-1.5 md:gap-1">
          <Timestamp timeAgo={timeAgo} time={props.time} />
          <Link href={commentLink} className="text-lg" prefetch={false}>
            <RiHashtag />
          </Link>
          <HNLink id={props.id} />
        </div>
      </div>
      {props.content && (
        <div
          dangerouslySetInnerHTML={{
            __html: props.content,
          }}
          className="prose prose-sm prose-slate max-w-none dark:prose-invert md:prose-base"
        />
      )}
    </article>
  );
}

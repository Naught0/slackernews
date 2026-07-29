import Link from "next/link";
import { RiHashtag } from "react-icons/ri";
import sanitizeHtml from "sanitize-html";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "~/components/ui/timestamp";
import { HNLink } from "~/app/components/hn-link";

export interface CommentProps {
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

export const HNComment = (props: CommentProps) => {
  const commentLink = props.postId
    ? `/post/${props.postId}/comment/${props.id}`
    : `/comment/${props.id}`;
  const isOp = !props.deleted && props.user === props.op;
  const timeAgo = formatDistanceToNow(props.time * 1000, { addSuffix: true });
  const showDeleted = props.deleted || props.dead;

  return (
    <article
      className={`${props.anchor ? "anchor " : ""}${showDeleted ? "opacity-70" : ""} flex min-w-0 flex-1 flex-col items-start gap-y-1 border-l-0 border-solid pl-2`}
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
            __html: replaceHnLinks(sanitizeHtml(props.content)),
          }}
          className="prose prose-sm prose-slate max-w-none dark:prose-invert md:prose-base"
        />
      )}
    </article>
  );
};

export function replaceHnLinks(sanitizedHtml: string) {
  const hnLinkRegex =
    /href="https:..news.ycombinator.com.(user|item)\?id=([\w\d]+)/gim;
  const matches = sanitizedHtml.matchAll(hnLinkRegex);

  for (const match of matches) {
    const toReplace = match[0];
    const id = match[2];
    const type = match[1];
    sanitizedHtml = sanitizedHtml.replace(
      toReplace,
      `href="/${type === "user" ? "user" : "comment"}/${id}`,
    );
  }
  return sanitizedHtml;
}

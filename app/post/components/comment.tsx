import Link from "next/link";
import { RiHashtag } from "react-icons/ri";
import sanitizeHtml from "sanitize-html";
import { Timestamp } from "~/components/ui/timestamp";
import { HNLink } from "~/app/components/hn-link";

export const HNComment = (
  props: HNPWAItem & {
    op?: string | null;
    postId?: string;
    anchor?: boolean;
  },
) => {
  const commentLink = props.postId
    ? `/post/${props.postId}/comment/${props.id}`
    : `/comment/${props.id}`;
  const isOp = props.user === props.op;
  return (
    <article
      className={`${props.anchor ? "anchor " : ""}flex min-w-0 flex-1 flex-col items-start gap-y-1 border-l-0 border-solid pl-3`}
    >
      <div className="flex w-full flex-row flex-wrap items-center gap-1 text-sm lg:text-base">
        {props.deleted ? (
          <span className="text-muted-foreground">[deleted]</span>
        ) : (
          <Link
            href={`/user/${props.user}`}
            className={isOp ? "text-link-foreground" : "text-muted-foreground"}
          >
            {props.user}
          </Link>
        )}
        <div className="flex flex-row items-center gap-1.5 md:gap-1">
          <Timestamp timeAgo={props.time_ago} time={props.time} />
          <Link href={commentLink} className="text-lg">
            <RiHashtag />
          </Link>
          <HNLink id={props.id} />
        </div>
      </div>
      {props.content && (
        <div
          dangerouslySetInnerHTML={{ __html: processText(props.content) }}
          className="prose prose-sm prose-slate max-w-none dark:prose-invert md:prose-base"
        />
      )}
    </article>
  );
};

function processText(text: string) {
  let sanitized = sanitizeHtml(text);
  const regex = /href="https:.*news.ycombinator.com.*item\?id=([0-9]+)/g;
  const matches = sanitized.matchAll(regex);

  for (const match of matches) {
    const id = match[1];
    sanitized = sanitized.replace(
      regex,
      `href="/comment/${id}">https://news.ycombinator.com/item?id=${match[1]}`,
    );
  }
  return sanitized;
}

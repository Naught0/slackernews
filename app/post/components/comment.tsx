import Link from "next/link";
import { RiHashtag } from "react-icons/ri";
import sanitizeHtml from "sanitize-html";
import { Timestamp } from "~/components/ui/timestamp";

export const HNComment = (
  props: HNPWAItem & { op?: string | null; postId: string },
) => {
  const isOp = props.user === props.op;
  return (
    <article
      id={`${props.id}`}
      className={
        "flex min-w-0 flex-1 flex-col items-start  border-l-0 border-solid pl-3"
      }
    >
      <div className="flex w-full flex-row flex-wrap items-center gap-x-1 text-sm lg:text-base">
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
        <div className="flex flex-row items-center">
          <Timestamp time={props.time} />
          <Link
            href={`/post/${props.postId}/comment/${props.id}`}
            className="py-2"
          >
            <RiHashtag />
          </Link>
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
  return sanitizeHtml(text);
}

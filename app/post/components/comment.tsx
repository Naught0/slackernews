import Link from "next/link";
import { RiHashtag } from "react-icons/ri";
import sanitizeHtml from "sanitize-html";
import { Timestamp } from "~/components/ui/timestamp";

export const HNComment = (props: HNComment & { op: string }) => {
  const isOp = props.by === props.op;
  return (
    <article
      id={`${props.id}`}
      className={
        "flex min-w-0 flex-1 flex-col items-start justify-between border-l-0 border-solid pl-3"
      }
    >
      <div className="flex w-full flex-row items-center gap-1 text-sm lg:text-base">
        {props.deleted ? (
          <span className="text-muted-foreground">[deleted]</span>
        ) : (
          <Link
            href={`/user/${props.by}`}
            className={
              isOp
                ? "text-blue-600 dark:text-blue-300"
                : "text-muted-foreground"
            }
          >
            {props.by}
          </Link>
        )}
        <Timestamp time={props.time} />
        <Link href={`#${props.id}`} className="py-2">
          <RiHashtag />
        </Link>
      </div>
      {props.text && (
        <div
          dangerouslySetInnerHTML={{ __html: processText(props.text) }}
          className="prose prose-sm prose-slate max-w-none dark:prose-invert md:prose-base"
        />
      )}
    </article>
  );
};

function processText(text: string) {
  return sanitizeHtml(text);
}

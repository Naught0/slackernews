import Link from "next/link";
import { Timestamp } from "~/components/ui/timestamp";
import { RiHashtag } from "react-icons/ri";
import { Button } from "~/components/ui/button";

const indentClassNames = [
  "",
  "ml-[25px]",
  "ml-[50px]",
  "ml-[75px]",
  "ml-[100px]",
  "ml-[125px]",
  "ml-[150px]",
];

const indentColorsClassName = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
];
export const HNComment = (
  props: HNComment & { indentLevel?: number; op: string },
) => {
  const isOp = props.by === props.op;
  const indentClass =
    indentClassNames[props.indentLevel ?? 0] ?? indentClassNames[0];
  return !props?.comments && (props.kids?.length ?? 0) > 0 ? (
    <Button className={`w-fit ${indentClass}`} variant="link">
      Load more comments ({props.kids!.length})
    </Button>
  ) : (
    <article
      id={`${props.id}`}
      className={`flex flex-1 flex-col items-start justify-between gap-2 ${
        indentColorsClassName?.[props.indentLevel ?? 0] ??
        indentColorsClassName[0]
      } py-2 pl-3 ${indentClass} min-w-0`}
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
        <Link href={`#${props.id}`}>
          <RiHashtag />
        </Link>
      </div>
      {props.text && (
        <div
          dangerouslySetInnerHTML={{ __html: props.text }}
          className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-screen-xl"
        />
      )}
    </article>
  );
};

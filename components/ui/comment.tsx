import Link from "next/link";
import { Timestamp } from "./timestamp";
import { RiHashtag } from "react-icons/ri";

const indentLevels = ["ml-0", "ml-6", "ml-12", "ml-18", "ml-24", "ml-28"];

const indentColorsClassName = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
];
export const HNComment = (props: HNComment & { indentLevel?: number }) => {
  return (
    <article
      id={`${props.id}`}
      className={`flex flex-col justify-between gap-2 ${
        indentColorsClassName?.[props.indentLevel ?? 0] ??
        indentColorsClassName[-1]
      } py-2 pl-3 ${
        indentLevels?.[props.indentLevel ?? 0] ?? indentLevels[0]
      } mb-2 min-w-0 max-w-fit`}
    >
      <div className="flex flex-row items-center gap-1 text-sm lg:text-base">
        <Link href={`/user/${props.by}`} className="text-muted-foreground">
          {props.by}
        </Link>
        <Timestamp time={props.time} />
        <Link href={`#${props.id}`}>
          <RiHashtag />
        </Link>
      </div>
      {props.text && (
        <div
          dangerouslySetInnerHTML={{ __html: props.text }}
          className="prose prose-sm md:prose-base prose-slate dark:prose-invert"
        />
      )}
    </article>
  );
};

import Link from "next/link";
import { Timestamp } from "./timestamp";

const indentLevels = ["ml-0", "ml-4", "ml-8", "ml-12", "ml-16", "ml-20"];
const indentColorsClassName = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
];
export const Comment = (props: TComment & { indentLevel?: number }) => {
  return (
    <article
      className={`flex flex-col justify-between gap-2 border-l-2 border-solid ${
        indentColorsClassName?.[props.indentLevel ?? 0] ??
        indentColorsClassName[-1]
      } py-1 pl-3 ${
        indentLevels?.[props.indentLevel ?? 0] ?? indentLevels[-1]
      } mb-2 min-w-0 max-w-fit`}
    >
      <div className="flex flex-row items-center gap-1 text-sm lg:text-base">
        <Link href={`/user/${props.author}`} className="text-muted-foreground">
          {props.author}
        </Link>
        <Timestamp time={props.time} timeAgo={props.time_ago} />
      </div>
      {props.text && (
        <div
          dangerouslySetInnerHTML={{ __html: props.text }}
          className="content"
        />
      )}
    </article>
  );
};

import { Collapsible } from "./collapsible";
import { HNComment } from "./comment";
import Link from "next/link";
import { GoArrowRight } from "react-icons/go";

const indentColorsClassName = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
];
const leftBorder = "border-l-2 border-solid";
export const HNThreadComponent = async (
  props: HNPWAItem & {
    indentLevel?: number;
    op?: string | null;
    postId?: string;
    maxDepth?: number;
  },
) => {
  const indentColor = getIndentColor(props.indentLevel);
  const indentLevel = props.indentLevel ?? 0;
  const maxDepth = props.maxDepth ?? 3;

  return (
    <Collapsible persistId={`collapse:${props.id}`}>
      <div
        className={`flex flex-col items-start gap-1 ${leftBorder} ${indentColor}`}
      >
        <HNComment {...props} anchor={indentLevel === 0 ? true : false} />
        {props.comments?.map((c) => {
          const borderColor = getIndentColor((props?.indentLevel ?? 0) + 1);
          return indentLevel < maxDepth ? (
            <HNThreadComponent
              key={c.id}
              {...c}
              op={props.op}
              indentLevel={(props.indentLevel ?? 0) + 1}
              postId={props.postId}
            />
          ) : (
            <Collapsible persistId={`collapse:${c.id}`} key={c.id}>
              <div className={`${leftBorder} ${borderColor}`}>
                <HNComment postId={props.postId} {...c} op={props.op} />
              </div>
              {c.comments.length > 0 && (
                <div
                  key={c.id}
                  className="py-1 text-sm text-accent-foreground underline lg:text-base"
                >
                  <Link
                    href={`/post/${props.postId}/comment/${c.id}`}
                    prefetch={false}
                  >
                    See replies
                    <GoArrowRight className="ml-1 inline" />
                  </Link>
                </div>
              )}
            </Collapsible>
          );
        })}
      </div>
    </Collapsible>
  );
};
function getIndentColor(indentLevel?: number) {
  return indentColorsClassName[indentLevel ?? 0] ?? indentColorsClassName[0];
}

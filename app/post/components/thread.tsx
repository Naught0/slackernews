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
  props: HNComment & { indentLevel?: number; op?: string; postId: string },
) => {
  const indentColor = getIndentColor(props.indentLevel);

  return (
    <Collapsible>
      <div
        className={`flex flex-col items-start gap-1 ${leftBorder} ${indentColor}`}
      >
        <HNComment indentLevel={0} {...props} />
        {props.comments?.map((c) => {
          const borderColor = getIndentColor((props?.indentLevel ?? 0) + 1);
          return c.comments ? (
            <HNThreadComponent
              key={c.id}
              {...c}
              op={props.op}
              indentLevel={(props.indentLevel ?? 0) + 1}
              postId={props.postId}
            />
          ) : (
            <Collapsible key={c.id}>
              <div className={`${leftBorder} ${borderColor}`}>
                <HNComment postId={props.postId} {...c} op={props.op} />
              </div>
              {c.kids && (
                <div
                  key={c.id}
                  className="py-1 text-sm text-accent-foreground underline lg:text-base"
                >
                  <Link href={`/post/${props.postId}/comment/${c.id}`}>
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

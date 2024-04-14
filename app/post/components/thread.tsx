import { Collapsible } from "./collapsible";
import { HNComment } from "./comment";

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
  props: HNComment & { indentLevel?: number; op: string },
) => {
  const indentColor = getIndentColor(props.indentLevel);

  return (
    <Collapsible>
      <div
        className={`flex flex-1 basis-full flex-col items-start gap-1 ${leftBorder} ${indentColor}`}
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
            />
          ) : (
            <Collapsible key={c.id}>
              <div className={`${leftBorder} ${borderColor}`}>
                <HNComment {...c} op={props.op} />
              </div>
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

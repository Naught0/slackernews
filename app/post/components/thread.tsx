import { HNComment } from "./comment";

export const HNThreadComponent = async (
  props: HNComment & { maxDepth?: number; indentLevel?: number; op: string },
) => {
  return (
    <div className="flex flex-1 basis-full flex-col">
      <HNComment indentLevel={0} {...props} />
      {props.comments?.map((c) => {
        return c.comments ? (
          <HNThreadComponent
            key={c.id}
            op={props.op}
            {...c}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        ) : (
          <HNComment
            key={c.id}
            {...c}
            op={props.op}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        );
      })}
    </div>
  );
};

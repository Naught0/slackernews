import { HNComment } from "./comment";

export const HNThreadComponent = async (
  props: HNComment & { maxDepth?: number; indentLevel?: number },
) => {
  return (
    <div>
      <HNComment {...props} />
      {props.comments?.map((c) => {
        return c.comments ? (
          <HNThreadComponent
            key={c.id}
            {...c}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        ) : (
          <HNComment
            key={c.id}
            {...c}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        );
      })}
    </div>
  );
};

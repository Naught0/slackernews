import { getThreadComments } from "~/app/hackernews-api";
import { Comment, HNComment } from "./comment";

export const Thread = async (
  props: TComment & { maxDepth?: number; indentLevel?: number },
) => {
  const comments = await getThreadComments(props.id);

  return (
    <div>
      <Comment {...props} />
      {comments.children.map((c) => {
        return c.children ? (
          <Thread
            key={c.id}
            {...c}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        ) : (
          <Comment
            key={c.id}
            {...c}
            indentLevel={(props.indentLevel ?? 0) + 1}
          />
        );
      })}
    </div>
  );
};

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

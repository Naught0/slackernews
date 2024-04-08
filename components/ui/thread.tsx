import { getThreadComments } from "~/app/hackernews-api";
import { Comment } from "./comment";

export const Thread = async (
  props: TComment & { maxDepth?: number; indentLevel?: number },
) => {
  const comments = await getThreadComments(props.id);

  return (
    <div>
      <Comment {...props} />
      {comments.comments.map((c) => {
        return c.comments ? (
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

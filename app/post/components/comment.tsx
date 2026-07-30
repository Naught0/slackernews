import sanitizeHtml from "sanitize-html";
import { replaceHnLinks } from "~/lib/client/hn-links";
import { CommentBody, type CommentBodyProps } from "~/components/comment-body";

export type CommentProps = CommentBodyProps;

export const HNComment = (props: CommentProps) => {
  return (
    <CommentBody
      {...props}
      content={props.content ? replaceHnLinks(sanitizeHtml(props.content)) : null}
    />
  );
};

"use client";
import { CommentChain } from "./comment-chain";

export function CommentCascade(props: {
  topLevelIds: number[];
  op?: string;
  postId?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {props.topLevelIds.map((id) => (
        <CommentChain
          key={id}
          rootId={id}
          depth={1}
          op={props.op}
          postId={props.postId}
        />
      ))}
    </div>
  );
}

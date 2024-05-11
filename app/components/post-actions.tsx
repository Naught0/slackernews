import Link from "next/link";
import React from "react";
import { BiCommentDetail } from "react-icons/bi";
import { Button } from "~/components/ui/button";

export const PostActions = (props: { postId: number; comments: number }) => {
  return (
    <div className="flex flex-row flex-wrap gap-3">
      <Link className="cursor-pointer" href={`/post/${props.postId}`}>
        <Button className="gap-1" variant="outline">
          <BiCommentDetail />
          {Intl.NumberFormat().format(props.comments)}
        </Button>
      </Link>
    </div>
  );
};

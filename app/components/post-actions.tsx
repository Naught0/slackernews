import Link from "next/link";
import { BiCommentDetail } from "react-icons/bi";
import { Button, buttonVariants } from "~/components/ui/button";
import { LiaHackerNews } from "react-icons/lia";

export const PostActions = (props: { postId: number; comments: number }) => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <Link className="cursor-pointer" href={`/post/${props.postId}`}>
        <Button className="gap-1" variant="outline">
          <BiCommentDetail />
          {Intl.NumberFormat().format(props.comments)}
        </Button>
      </Link>

      <a
        className={buttonVariants({ variant: "outline", size: "icon" })}
        href={`https://news.ycombinator.com/item?id=${props.postId}`}
        target="_blank"
        rel="noreferrer"
      >
        <LiaHackerNews className="text-2xl" />
      </a>
    </div>
  );
};

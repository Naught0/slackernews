import Link from "next/link";
import { PostActions } from "./post-actions";
import { PersonIcon, TriangleUpIcon } from "@radix-ui/react-icons";

export const Post = (props: HNStory) => {
  return (
    <article className="flex flex-col gap-3 rounded-md border border-solid border-slate-300 bg-primary px-6 py-4 transition-colors hover:border-slate-400 dark:border-slate-700 hover:dark:border-slate-600">
      <div className="flex flex-row gap-3">
        <span className="align-middle text-muted-foreground">
          <TriangleUpIcon className="inline size-6" />
          {props.score}
        </span>{" "}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Link href={props.url} className="w-fit text-lg lg:text-xl">
              {props.title}
              <p className="ml-1 text-xs text-muted-foreground lg:text-sm">
                {new URL(props.url).hostname}
              </p>
            </Link>
            <Link
              href={`/user/${props.by}`}
              className="flex w-fit items-center gap-1 text-sm text-slate-500 dark:text-muted-foreground md:text-base"
            >
              <PersonIcon />
              {props.by}
            </Link>
          </div>
          <PostActions comments={props.descendants} postId={props.id} />
        </div>
      </div>
    </article>
  );
};

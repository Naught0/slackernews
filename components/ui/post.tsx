import Link from "next/link";
import { PostActions } from "./post-actions";
import { PersonIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import { HTMLProps } from "react";
import { cn } from "~/lib/utils";

export const Post = ({
  story,
  ...props
}: { story: HNStory } & HTMLProps<HTMLDivElement>) => {
  return (
    <article
      {...props}
      className={cn(
        "flex flex-col gap-3 rounded-md border border-solid border-slate-300 bg-primary px-6 py-4 transition-colors hover:border-slate-400 dark:border-slate-700 hover:dark:border-slate-600",
        props.className,
      )}
    >
      <div className="flex flex-row gap-3">
        <span className="align-middle text-muted-foreground">
          <TriangleUpIcon className="inline size-6" />
          {story.score}
        </span>{" "}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Link href={story.url} className="w-fit text-lg lg:text-xl">
              {story.title}
              <p className="ml-1 text-xs text-muted-foreground lg:text-sm">
                {new URL(story.url).hostname}
              </p>
            </Link>
            <Link
              href={`/user/${story.by}`}
              className="flex w-fit items-center gap-1 text-sm text-slate-500 dark:text-muted-foreground md:text-base"
            >
              <PersonIcon />
              {story.by}
            </Link>
          </div>
          <PostActions comments={story.descendants} postId={story.id} />
        </div>
      </div>
    </article>
  );
};

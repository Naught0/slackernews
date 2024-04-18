import Link from "next/link";
import { PostActions } from "./post-actions";
import { PersonIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import { MainItemContainer } from "./main-item-container";

export const Post = ({
  story,
  className,
}: {
  story: HNPost;
  className?: string;
}) => {
  return (
    <MainItemContainer className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          {"url" in story && story.url.startsWith("https") ? (
            <Link href={story.url} className="w-fit text-lg lg:text-xl">
              {story.title}
              <p className="ml-1 break-all text-xs text-muted-foreground lg:text-sm">
                {new URL(story.url).hostname}
              </p>
            </Link>
          ) : (
            <p className="w-fit text-lg lg:text-xl">{story.title}</p>
          )}
          <Link
            href={`/user/${story.by}`}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground dark:text-muted-foreground md:text-base"
          >
            <PersonIcon />
            {story.by}
          </Link>
        </div>
        <div className="flex flex-row items-center gap-3">
          <span className="align-middle text-sm text-secondary-foreground lg:text-base">
            <TriangleUpIcon className="inline size-6" />
            {story.score}
          </span>
          {"descendants" in story && (
            <PostActions comments={story.descendants} postId={story.id} />
          )}
        </div>
      </div>
    </MainItemContainer>
  );
};

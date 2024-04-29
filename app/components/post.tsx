import { RxPerson, RxCaretUp, RxClock, RxLink1, RxLink2 } from "react-icons/rx";
import Link from "next/link";
import { MainItemContainer } from "./main-item-container";
import { PostActions } from "./post-actions";
import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
import { Timestamp } from "~/components/ui/timestamp";
dayjs.extend(relative);

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
              <br />
              <p className="flex items-center gap-1 break-all text-xs text-muted-foreground lg:text-sm">
                <RxLink2 />
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
            <RxPerson />
            {story.by}
          </Link>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <RxClock />
            <Timestamp time={story.time} />
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          <span className="align-middle text-sm text-secondary-foreground lg:text-base">
            <RxCaretUp className="inline size-6" />
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

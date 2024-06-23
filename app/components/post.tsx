import { RxPerson, RxCaretUp, RxClock, RxLink2 } from "react-icons/rx";
import Link from "next/link";
import { MainItemContainer } from "./main-item-container";
import { PostActions } from "./post-actions";
import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
import { Timestamp } from "~/components/ui/timestamp";
import { BiLinkExternal } from "react-icons/bi";
import { buttonVariants } from "~/components/ui/button";
dayjs.extend(relative);

export const Post = ({
  story,
  className,
  showHnLink,
}: {
  story: HNPWAFeedItem;
  className?: string;
  showHnLink?: boolean;
}) => {
  return (
    <MainItemContainer className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          {"url" in story && story.url?.startsWith("http") ? (
            <Link
              href={story.url}
              rel="noopener noreferrer"
              target="_blank"
              className="w-fit text-lg lg:text-xl"
            >
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

          {story.user && (
            <Link
              href={`/user/${story.user}`}
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground dark:text-muted-foreground md:text-base"
            >
              <RxPerson />
              {story.user}
            </Link>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <RxClock />
            <Timestamp time={story.time} timeAgo={story.time_ago} />
          </div>
        </div>
        {story.points && (
          <div className="flex flex-row items-center gap-3">
            <span className="align-middle text-sm text-secondary-foreground lg:text-base">
              <RxCaretUp className="inline size-6" />
              {Intl.NumberFormat().format(story.points)}
            </span>
            {"comments_count" in story && story.type !== "job" && (
              <PostActions comments={story.comments_count} postId={story.id} />
            )}
            {showHnLink && (
              <a
                href={`https://news.ycombinator.com/item?id=${story.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "link",
                  className: "w-fit px-0 text-sm",
                  size: "sm",
                })}
              >
                <span className="pr-1">View on HN</span>
                <BiLinkExternal className="inline" />
              </a>
            )}
          </div>
        )}
      </div>
    </MainItemContainer>
  );
};

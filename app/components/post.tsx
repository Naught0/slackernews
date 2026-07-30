import { RxPerson, RxCaretUp, RxClock, RxLink2 } from "react-icons/rx";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MainItemContainer } from "./main-item-container";
import { PostActions } from "./post-actions";
import { Timestamp } from "~/components/ui/timestamp";
import { BiLinkExternal } from "react-icons/bi";
import { buttonVariants } from "~/components/ui/button";
import sanitizeHtml from "sanitize-html";
import { replaceHnLinks } from "~/lib/client/hn-links";

interface StoryProps {
  id: number;
  title: string;
  url?: string;
  by?: string;
  user?: string | null;
  time: number;
  time_ago?: string;
  score?: number;
  points?: number | null;
  descendants?: number;
  comments_count?: number;
  text?: string;
  content?: string;
  domain?: string;
  type?: string;
}

export const Post = ({
  story,
  className,
  showHnLink,
  showText = false,
  prefetch = true,
}: {
  story: StoryProps;
  className?: string;
  showHnLink?: boolean;
  showText?: boolean;
  prefetch?: boolean;
}) => {
  const user = story.user ?? story.by ?? null;
  const points = story.points ?? story.score ?? null;
  const commentsCount = story.comments_count ?? story.descendants ?? 0;
  const content = story.content ?? story.text ?? "";
  const timeAgo = story.time_ago ?? formatDistanceToNow(story.time * 1000, { addSuffix: true });

  return (
    <MainItemContainer className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          {story.url?.startsWith("http") ? (
            <Link
              href={story.url}
              rel="noopener noreferrer"
              target="_blank"
              className="w-fit text-lg lg:text-xl"
              prefetch={prefetch}
            >
              {story.title}
              <br />
              <p className="flex items-center gap-1 break-all text-xs text-muted-foreground lg:text-sm">
                <RxLink2 />
                {story.domain ?? (story.url ? new URL(story.url).hostname : "self")}
              </p>
            </Link>
          ) : (
            <p className="w-fit text-lg lg:text-xl">{story.title}</p>
          )}

          {user && (
            <Link
              href={`/user/${user}`}
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground dark:text-muted-foreground md:text-base"
              prefetch={false}
            >
              <RxPerson />
              {user}
            </Link>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <RxClock />
            <Timestamp time={story.time} timeAgo={timeAgo} />
          </div>
        </div>
        {points && (
          <div className="flex flex-row items-center gap-3">
            <span className="align-middle text-sm text-secondary-foreground lg:text-base">
              <RxCaretUp className="inline size-6" />
              {Intl.NumberFormat().format(points)}
            </span>
            {story.type !== "job" && (
              <PostActions comments={commentsCount} postId={story.id} />
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
      {showText && content && (
        <article
          className="prose prose-sm prose-slate max-w-none border-l-2 pl-3 dark:prose-invert md:prose-base"
          dangerouslySetInnerHTML={{
            __html: replaceHnLinks(sanitizeHtml(content)),
          }}
        />
      )}
    </MainItemContainer>
  );
};

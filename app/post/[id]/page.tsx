import Link from "next/link";
import {
  gatherComments,
  getComments,
  getItemById,
  getThreadComments,
} from "~/app/hackernews-api";
import { BrowserBackButton } from "~/components/ui/browser-back-button";
import { Separator } from "~/components/ui/separator";
import { HNThreadComponent, Thread } from "~/components/ui/thread";
import { Timestamp } from "~/components/ui/timestamp";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const post = await getItemById<HNComment>(id);
  const comments = await getThreadComments(id);
  const test = await gatherComments(parseInt(id), 4);
  console.log(JSON.stringify(test, undefined, 2));

  return (
    <div className="flex flex-col flex-wrap gap-6">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-row flex-wrap items-center gap-3">
          <BrowserBackButton />
          <Link className="text-lg lg:text-xl" href={post.url}>
            {post.title}
          </Link>
        </div>
        <h2 className="text-sm lg:text-base">
          Submitted by{" "}
          <Link className="text-muted-foreground" href={`/user/${post.user}`}>
            {post.user}
          </Link>{" "}
          <Timestamp time={post.time} timeAgo={"test"} />
        </h2>
      </div>
      <Separator />
      {comments?.children?.map((item) => <Thread key={item.id} {...item} />)}
      {test.comments?.map((comment) => (
        <HNThreadComponent key={comment.id} {...comment} />
      ))}
    </div>
  );
}

import { getItemById, timedComments } from "~/app/hackernews-api";
import { BackHomeButton } from "~/components/ui/browser-back-button";
import { Post } from "~/app/components/post";
import { AnchorButtons } from "../components/anchor-buttons";
import { HNThreadComponent } from "../components/thread";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const story = await getItemById<HNStory>(id);
  const thread = await timedComments(id);

  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-3">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-1 flex-row flex-wrap gap-3">
          <BackHomeButton />
          <Post story={story} className="flex-grow" />
        </div>
      </div>
      <br />
      {thread.comments?.map((comment) => (
        <HNThreadComponent op={story.by} key={comment.id} {...comment} />
      ))}
      <AnchorButtons />
    </div>
  );
}

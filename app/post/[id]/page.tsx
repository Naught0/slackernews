import { getItemById, timedComments } from "~/app/hackernews-api";
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
    <>
      {thread.comments?.map((comment) => (
        <HNThreadComponent
          postId={id}
          op={story.by}
          key={comment.id}
          {...comment}
        />
      ))}
      <AnchorButtons />
    </>
  );
}

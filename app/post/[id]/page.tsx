import { gatherComments, getItemById } from "~/app/hackernews-api";
import { AnchorButtons } from "~/components/ui/anchor-buttons";
import { BrowserBackButton } from "~/components/ui/browser-back-button";
import { Post } from "~/components/ui/post";
import { Separator } from "~/components/ui/separator";
import { HNThreadComponent } from "~/components/ui/thread";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const story = await getItemById<HNStory>(id);
  const test = await gatherComments(parseInt(id), 4);

  return (
    <div className="flex flex-col flex-wrap gap-6">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-1 flex-row gap-3">
          <BrowserBackButton />
          <Post story={story} className="flex-grow" />
        </div>
      </div>
      <Separator />
      {test.comments?.map((comment) => (
        <HNThreadComponent key={comment.id} {...comment} />
      ))}
      <AnchorButtons />
    </div>
  );
}

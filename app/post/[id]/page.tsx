import { notFound } from "next/navigation";
import { AnchorButtons } from "../components/anchor-buttons";
import { HNThreadComponent } from "../components/thread";
import { getItem } from "~/app/hackernews-api/hnpwa";
import { Post } from "~/app/components/post";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getItem(id);
  if (!thread) notFound();

  return (
    <div className="flex flex-col flex-wrap gap-3">
      <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
        <Post story={thread} className="flex-grow" showHnLink />
      </div>
      <div className="comments flex flex-col gap-3">
        {thread.comments?.map((comment) => (
          <HNThreadComponent
            postId={id}
            op={thread.user}
            key={comment.id}
            {...comment}
          />
        ))}
        <AnchorButtons />
      </div>
    </div>
  );
}

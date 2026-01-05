import { notFound } from "next/navigation";
import { getItem } from "~/app/hackernews-api/hnpwa";
import { Post } from "~/app/components/post";
import { VirtualThread } from "../components/virtual-thread";

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
      <div className="flex flex-col gap-3">
        <VirtualThread
          comments={thread.comments}
          postId={id}
          op={thread.user}
          id={0}
          title={""}
          points={null}
          user={null}
          time={0}
          time_ago={""}
          content={""}
          type={"link"}
          level={0}
          comments_count={0}
        />
      </div>
    </div>
  );
}

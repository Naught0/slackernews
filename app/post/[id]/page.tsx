import { notFound } from "next/navigation";
import { AnchorButtons } from "../components/anchor-buttons";
import { HNThreadComponent } from "../components/thread";
import { getItem } from "~/app/hackernews-api/hnpwa";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getItem(id);
  if (!thread) notFound();

  return (
    <>
      {thread.comments?.map((comment) => (
        <HNThreadComponent
          postId={id}
          op={thread.user}
          key={comment.id}
          {...comment}
        />
      ))}
      <AnchorButtons />
    </>
  );
}

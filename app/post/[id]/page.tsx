import { AnchorButtons } from "../components/anchor-buttons";
import { HNThreadComponent } from "../components/thread";
import { getComments } from "~/app/hackernews-api/hnpwa";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const thread = await getComments(id);

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

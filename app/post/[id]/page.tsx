import { notFound } from "next/navigation";
import { getStoryPage } from "~/lib/server/story";
import { Post } from "~/app/components/post";
import { Thread } from "../components/thread";
import type { HNPost } from "~/lib/types";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);

  const postId = parseInt(id, 10);
  if (isNaN(postId)) notFound();

  const data = await getStoryPage({ postId, page, backgroundPrefetch: true });
  if (!data) notFound();

  const story = data.post as HNPost;

  return (
    <div className="flex flex-col flex-wrap gap-3">
      <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
        <Post story={story} className="flex-grow" showHnLink />
      </div>
      <div className="flex flex-col gap-3">
        <Thread
          postId={id}
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(data.topLevelIds.length / data.perPage))}
          data={data}
        />
      </div>
    </div>
  );
}

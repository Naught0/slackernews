import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Post } from "~/app/components/post";
import { getItem } from "~/app/hackernews-api/hnpwa";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const story = await getItem(id);
  if (!story) notFound();

  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-6">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
          <Post story={story} className="flex-grow" showHnLink />
        </div>
      </div>
      <div className="comments flex flex-col gap-3">{children}</div>
    </div>
  );
}

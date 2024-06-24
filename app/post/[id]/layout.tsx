import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Post } from "~/app/components/post";
import { getItem } from "~/app/hackernews-api/hnpwa";
import { BackHomeButton } from "~/components/ui/browser-back-button";

export default async function Layout({
  params: { id },
  children,
}: {
  params: { id: string };
  children: ReactNode;
}) {
  const story = await getItem(id);
  if (!story) notFound();

  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-3">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
          <BackHomeButton />
          <Post story={story} className="flex-grow" showHnLink />
        </div>
      </div>
      <br />
      <div className="comments flex flex-col gap-3">{children}</div>
    </div>
  );
}

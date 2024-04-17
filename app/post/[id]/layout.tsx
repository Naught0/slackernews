import { ReactNode } from "react";
import { Post } from "~/app/components/post";
import { getItemById } from "~/app/hackernews-api";
import { BackHomeButton } from "~/components/ui/browser-back-button";

export default async function Layout({
  params: { id },
  children,
}: {
  params: { id: string };
  children: ReactNode;
}) {
  const story = await getItemById<HNStory>(id);

  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-3">
      <div className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-1 flex-row flex-wrap gap-3">
          <BackHomeButton />
          <Post story={story} className="flex-grow" />
        </div>
      </div>
      <br />
      {children}
    </div>
  );
}

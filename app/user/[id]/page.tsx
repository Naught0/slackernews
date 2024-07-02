import { getUserById } from "~/app/hackernews-api";
import { getPaginatedItems } from "~/app/hackernews-api/hnpwa";
import Items from "~/app/components/items";
import User from "./components/user";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { notFound } from "next/navigation";

export default async function Page({
  params: { id: userId },
  searchParams: { page, perPage },
}: {
  params: { id: string };
  searchParams: { page?: string; perPage?: string };
}) {
  const user = await getUserById(userId);
  if (!user) notFound();

  const { items } = await getPaginatedItems({
    items: user.submitted,
    perPage: parseInt(perPage ?? "15"),
    pageIndex: parseInt(page ?? "1") - 1,
  });

  return (
    <div className="flex w-full flex-col gap-3 md:max-w-screen-md lg:gap-6">
      <div className="border-color flex flex-row items-start gap-3 border-b pb-3">
        <User user={user} className="flex-1" />
      </div>
      <h1 className="text-lg lg:text-2xl">Recent activity</h1>
      <Items items={items} />
      <HomepagePagination searchParams={{ page, perPage }} />
    </div>
  );
}

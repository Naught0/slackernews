import React from "react";
import { getUserById } from "~/app/hackernews-api";
import { getItem } from "~/app/hackernews-api/hnpwa";
import Items from "~/app/components/items";
import User from "./components/user";
import { BackHomeButton } from "~/components/ui/browser-back-button";

export default async function Page(props: {
  params: { id: string };
  searchParams: { page?: string; perPage?: string };
}) {
  const user = await getUserById(props.params.id);
  const items = await Promise.all(
    user.submitted.slice(0, 10).map((itemId) => getItem(itemId)),
  );
  return (
    <div className="flex flex-1 flex-col gap-2 lg:max-w-screen-md">
      <div className="flex flex-row items-start gap-3">
        <BackHomeButton /> <User user={user} className="flex-1" />
      </div>
      <h1 className="text-lg lg:text-xl">Recent activity</h1>
      <Items items={items} />
    </div>
  );
}

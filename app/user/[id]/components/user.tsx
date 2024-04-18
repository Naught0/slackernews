import { PersonIcon, CalendarIcon } from "@radix-ui/react-icons";
import { GoTriangleUp } from "react-icons/go";
import { MainItemContainer } from "~/app/components/main-item-container";
import { Post } from "~/app/components/post";
import { getUserById } from "~/app/hackernews-api";
import { getItem } from "~/app/hackernews-api/hnpwa";
import { Collapsible } from "~/app/post/components/collapsible";
import { HNComment } from "~/app/post/components/comment";

const formatNumber = Intl.NumberFormat();
export async function User(props: { userId: string }) {
  const user = await getUserById(props.userId);
  const items = await Promise.all(
    user.submitted.slice(0, 10).map((itemId) => getItem(itemId)),
  );
  return (
    <div className="flex flex-1 flex-col gap-2 lg:max-w-screen-md">
      <MainItemContainer>
        <p className="inline-flex items-center gap-1 text-lg text-destructive-foreground lg:text-xl">
          <PersonIcon />
          {user.id}
        </p>
        <p className="inline-flex items-center gap-1">
          <CalendarIcon />
          {new Date(user.created * 1000).toLocaleDateString()}
        </p>
        <p>
          <GoTriangleUp className="inline" />
          {formatNumber.format(user.karma)} points
        </p>
        <p>
          {formatNumber.format(user.submitted.length)} submission
          {user.submitted.length !== 1 && "s"}
        </p>
      </MainItemContainer>
      <h1 className="text-lg lg:text-xl">Recent activity</h1>
      <div className="flex flex-col gap-2 px-3 lg:px-6">
        {items
          .filter((item) => !item.deleted)
          .map((item) => {
            if (item.type === "comment") {
              return (
                <Collapsible key={item.id} className="bottom-border py-2">
                  <HNComment postId={""} {...item} />
                </Collapsible>
              );
            }
            if (item.type === "link") {
              return (
                <Post
                  key={item.id}
                  story={{
                    ...item,
                    url: item.url?.includes("http")
                      ? item.url
                      : "https://google.com",
                    type: "story",
                    by: item.user ?? "",
                    descendants: item.comments_count,
                    kids: [],
                    score: item.points ?? 0,
                  }}
                />
              );
            }
          })}
      </div>
    </div>
  );
}

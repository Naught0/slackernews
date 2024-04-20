import { Collapsible } from "../post/components/collapsible";
import { HNComment } from "../post/components/comment";
import { Post } from "./post";

export default function Items({ items }: { items: HNPWAItem[] }) {
  return (
    <div className="flex flex-col gap-2 px-3 lg:px-6">
      {items
        .filter((item) => !item.deleted)
        .map((item) => {
          if (item.type === "comment") {
            return (
              <Collapsible key={item.id} className="bottom-border py-2">
                <HNComment {...item} />
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
  );
}

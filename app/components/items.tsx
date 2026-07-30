import { Collapsible } from "../post/components/collapsible";
import { HNComment } from "../post/components/comment";
import { Post } from "./post";
import type { HnRawItem } from "~/lib/hn";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="py-3">{children}</div>;
}
export default function Items({ items }: { items: HnRawItem[] }) {
  return (
    <div className="border-color flex flex-col gap-2 divide-y px-3 lg:px-6">
      {items
        .filter((item) => !item.deleted)
        .map((item) => {
          if (item.type === "comment") {
            return (
              <Wrapper key={item.id}>
                <Collapsible persistId={`collapse:${item.id}`} className="py-2">
                  <HNComment
                    id={item.id}
                    user={item.by ?? null}
                    time={item.time}
                    content={item.text ?? null}
                    deleted={item.deleted}
                    dead={item.dead}
                  />
                </Collapsible>
              </Wrapper>
            );
          }
          if (item.type === "story" || item.type === "job") {
            return (
              <Wrapper key={item.id}>
                <Post story={item as any} />
              </Wrapper>
            );
          }
        })}
    </div>
  );
}

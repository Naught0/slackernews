import { Collapsible } from "../post/components/collapsible";
import { HNComment } from "../post/components/comment";
import { Post } from "./post";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="py-3">{children}</div>;
}
export default function Items({ items }: { items: HNPWAItem[] }) {
  return (
    <div className="border-color flex flex-col gap-2 divide-y px-3 lg:px-6">
      {items
        .filter((item) => !item.deleted)
        .map((item) => {
          if (item.type === "comment") {
            return (
              <Wrapper key={item.id}>
                <Collapsible className="py-2">
                  <HNComment {...item} />
                </Collapsible>
              </Wrapper>
            );
          }
          if (item.type === "link") {
            return (
              <Wrapper key={item.id}>
                <Post story={item} />
              </Wrapper>
            );
          }
        })}
    </div>
  );
}

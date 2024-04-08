import { getHomepage } from "./hackernews-api";
import { Post } from "~/components/ui/post";

export default async function Home() {
  const results = await getHomepage();
  return (
    <div className="flex w-full  basis-full flex-col gap-3">
      {results.items.map((item) => (
        <Post key={item.id} {...item} />
      ))}
    </div>
  );
}

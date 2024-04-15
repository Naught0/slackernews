import { getHomepage } from "~/app/hackernews-api";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { Post } from "~/app/components/post";

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const results = await getHomepage({
    count: parseInt(searchParams?.["perPage"] ?? "25"),
    pageIndex: parseInt(searchParams?.["page"] ?? "1") - 1,
  });
  return (
    <div className="flex flex-col gap-3">
      {results.items.map((item) => (
        <Post key={item.id} story={item} />
      ))}
      <HomepagePagination searchParams={searchParams} />
    </div>
  );
}

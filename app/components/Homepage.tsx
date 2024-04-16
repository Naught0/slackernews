import { getHomepage } from "~/app/hackernews-api";
import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { Post } from "~/app/components/post";
import { HomepageSelector } from "~/app/components/homepage-selector";

export default async function Homepage({
  searchParams,
  type = "top",
}: {
  searchParams?: Record<string, string | undefined>;
  type: HNHomepageType;
}) {
  const results = await getHomepage({
    count: parseInt(searchParams?.["perPage"] ?? "15"),
    pageIndex: parseInt(searchParams?.["page"] ?? "1") - 1,
    homepageType: type,
  });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <HomepageSelector />
      </div>
      {results.items.map((item) => (
        <Post key={item.id} story={item} />
      ))}
      <HomepagePagination searchParams={searchParams} />
    </div>
  );
}

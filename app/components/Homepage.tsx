import { HomepagePagination } from "~/components/ui/homepage-pagination";
import { Post } from "~/app/components/post";
import { HomepageSelector } from "~/app/components/homepage-selector";
import { getHomepage } from "../hackernews-api/hnpwa";

export default async function Homepage({
  searchParams,
  type = "news",
}: {
  searchParams?: Record<string, string | undefined>;
  type: HNPWAFeedType;
}) {
  const { items } = await getHomepage({
    count: parseInt(searchParams?.["perPage"] ?? "15"),
    pageIndex: parseInt(searchParams?.["page"] ?? "1") - 1,
    homepageType: type,
  });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <HomepageSelector />
      </div>
      <div className="border-color divide-y">
        {items.map((item) => (
          <div key={item.id} className="py-3">
            <Post story={item} />
          </div>
        ))}
      </div>
      <HomepagePagination searchParams={searchParams} />
    </div>
  );
}

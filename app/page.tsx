import Homepage from "./components/Homepage";

export const revalidate = 120;

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  return <Homepage searchParams={searchParams} type="news" />;
}

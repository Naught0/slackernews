import Homepage from "./components/Homepage";

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  return <Homepage searchParams={searchParams} type="top" />;
}

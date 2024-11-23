import Homepage from "./components/Homepage";

export const revalidate = 120;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <Homepage searchParams={await searchParams} type="news" />;
}

import { redirect } from "next/navigation";
import Homepage from "../components/Homepage";

export const revalidate = 120;

export default async function Home(props: {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ homepageType: HNPWAFeedType }>;
}) {
  const { homepageType } = await props.params;
  if (
    !(
      ["show", "news", "ask", "jobs", "newest", "best"] as (
        | HNPWAFeedType
        | "best"
      )[]
    ).includes(homepageType)
  ) {
    return redirect("/");
  }
  return (
    <Homepage searchParams={await props?.searchParams} type={homepageType} />
  );
}

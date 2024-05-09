import { redirect } from "next/navigation";
import Homepage from "../components/Homepage";

export default function Home(props: {
  searchParams: Record<string, string | undefined>;
  params: { homepageType: HNPWAFeedType };
}) {
  if (
    !(
      ["show", "news", "ask", "jobs", "newest", "best"] as (
        | HNPWAFeedType
        | "best"
      )[]
    ).includes(props.params.homepageType)
  ) {
    return redirect("/");
  }
  return (
    <Homepage
      searchParams={props?.searchParams}
      type={props.params.homepageType}
    />
  );
}

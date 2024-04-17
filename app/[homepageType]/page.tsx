import Homepage from "../components/Homepage";

export default function Home(props: {
  searchParams: Record<string, string | undefined>;
  params: { homepageType: string };
}) {
  return (
    <Homepage
      searchParams={props?.searchParams}
      type={props.params.homepageType as HNHomepageType}
    />
  );
}

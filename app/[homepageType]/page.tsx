"use client";
import { use } from "react";
import { redirect } from "next/navigation";
import Homepage from "../components/Homepage";

const VALID_TYPES = ["show", "news", "ask", "jobs", "newest", "best"];

export default function Home(props: {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ homepageType: string }>;
}) {
  const { homepageType } = use(props.params);
  if (!VALID_TYPES.includes(homepageType)) {
    redirect("/");
  }
  return (
    <Homepage searchParams={use(props.searchParams)} type={homepageType} />
  );
}

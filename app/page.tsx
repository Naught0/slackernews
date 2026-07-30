"use client";
import { use } from "react";
import Homepage from "./components/Homepage";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <Homepage searchParams={use(searchParams)} type="news" />;
}

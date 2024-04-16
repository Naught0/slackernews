import React from "react";
import Homepage from "../components/Homepage";

export default function Best(props?: {
  searchParams: Record<string, string | undefined>;
}) {
  return <Homepage searchParams={props?.searchParams} type="new" />;
}

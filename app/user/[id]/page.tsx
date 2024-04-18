import React from "react";
import { User } from "./components/user";

export default function Page(props: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  return <User userId={props.params.id} />;
}

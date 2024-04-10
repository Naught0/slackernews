import { ReactNode } from "react";

export default function Layout(props: { children: ReactNode }) {
  return <div className="max-w-screen-lg">{props.children}</div>;
}

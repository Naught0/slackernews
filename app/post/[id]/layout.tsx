import { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-6">{children}</div>
  );
}

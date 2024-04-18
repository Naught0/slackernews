import React, { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-screen-lg flex-col gap-3">{children}</div>
  );
}

"use client";
import { Link } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export const ActiveLogo = () => {
  const path = usePathname();
  const params = useSearchParams();
  return (
    <Link href="/" className="font-mono">
      /slacker_news{path.length > 1 && path}
      {params.size > 0 && "?" + new URLSearchParams(params).toString()}
    </Link>
  );
};

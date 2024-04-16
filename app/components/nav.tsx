"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ModeToggle } from "~/components/ui/theme-toggle";

export const Nav = () => {
  const path = usePathname();
  const params = useSearchParams();
  const page = params.get("page") ?? "1";
  return (
    <div className="flex flex-row justify-center p-6">
      <div className="flex w-full max-w-screen-lg flex-grow flex-row items-center justify-between gap-3 lg:gap-6">
        <div className="flex">
          <Link href="/" className="font-mono">
            /slacker_news{path.length > 1 && path}?page={page}
          </Link>
        </div>
        <div className="flex">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

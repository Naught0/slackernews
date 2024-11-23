"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ModeToggle } from "~/components/ui/theme-toggle";

export const Nav = () => {
  const path = usePathname();
  const params = useSearchParams();
  return (
    <div className="flex flex-row justify-center p-2 md:p-6">
      <div className="flex w-full max-w-screen-lg flex-grow flex-row items-center justify-between gap-3 lg:gap-6">
        <div className="flex">
          <Link href="/" className="font-mono">
            /slackernews
            <wbr />
            {path.length > 1 &&
              path
                .split("/")
                .filter((item) => item)
                .map(
                  (part) =>
                    part && (
                      <span key={part}>
                        <wbr />/{part}
                      </span>
                    ),
                )}
            {params.size > 0 && "?" + new URLSearchParams(params).toString()}
          </Link>
        </div>
        <div className="flex">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

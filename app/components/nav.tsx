import Link from "next/link";
import { ModeToggle } from "~/components/ui/theme-toggle";

export const Nav = () => {
  return (
    <div className="flex flex-row justify-center p-6">
      <div className="flex w-full max-w-screen-lg flex-grow flex-row items-center justify-between gap-3 lg:gap-6">
        <div className="flex">
          <Link href="/">/slackernews</Link>
        </div>
        <div className="flex">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

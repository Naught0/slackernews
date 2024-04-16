import { ModeToggle } from "~/components/ui/theme-toggle";
import { ActiveLogo } from "./active-logo";

export const Nav = () => {
  return (
    <div className="flex flex-row justify-center p-6">
      <div className="flex w-full max-w-screen-lg flex-grow flex-row items-center justify-between gap-3 lg:gap-6">
        <div className="flex">
          <ActiveLogo />
        </div>
        <div className="flex">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

import { ModeToggle } from "~/components/ui/theme-toggle";

export const Nav = () => {
  return (
    <div className="flex flex-row justify-center p-6">
      <div className="w-full max-w-screen-lg flex-grow">
        <ModeToggle />
      </div>
    </div>
  );
};

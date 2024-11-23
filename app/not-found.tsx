import { Separator } from "~/components/ui/separator";

export default async function Page() {
  return (
    <div className="flex max-w-screen-sm flex-grow flex-row items-center gap-3 lg:gap-8">
      <h1 className="text-6xl font-bold lg:text-9xl">404</h1>
      <Separator orientation="vertical" className="h-16 lg:h-32" />
      <p className="text-xl lg:text-3xl">Not found</p>
    </div>
  );
}

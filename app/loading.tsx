import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-color divide-y">
        {[...new Array(15).keys()].map((idx) => (
          <div key={idx} className="py-3">
            <Skeleton className="h-36 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

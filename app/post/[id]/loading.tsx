import { Skeleton } from "~/components/ui/skeleton";

function PostHeaderSkeleton() {
  return (
    <div className="border-color flex flex-1 flex-row flex-wrap gap-3 border-b pb-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-80 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="flex flex-row items-center gap-3">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="mb-1">
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-5/6 rounded" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col flex-wrap gap-3">
      <PostHeaderSkeleton />
      <div className="flex flex-col gap-3">
        {[...new Array(12).keys()].map((idx) => (
          <CommentSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

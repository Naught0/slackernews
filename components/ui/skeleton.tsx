import { ReactNode } from "react";
import { cn } from "~/lib/utils";

function Skeleton({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse bg-muted", className)} {...props}>
      <div className="invisible">{children}</div>
    </div>
  );
}

function SkeleWrap({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return loading ? <Skeleton>{children}</Skeleton> : children;
}

export { Skeleton, SkeleWrap };

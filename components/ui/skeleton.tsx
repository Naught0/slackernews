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

export { Skeleton };

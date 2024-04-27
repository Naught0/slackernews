import { cn } from "~/lib/utils";

export const MainItemContainer = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <article className={cn("flex flex-col gap-3 p-3", className)}>
      {children}
    </article>
  );
};

import { HTMLProps, ReactNode } from "react";
import { BiMessageSquareAdd, BiMessageSquareMinus } from "react-icons/bi";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const StaticCollapsible = ({
  persistId,
  children,
  className,
  canCollapse = true,
  collapsedElement,
  ...props
}: {
  persistId: string;
  children: ReactNode;
  canCollapse?: boolean;
  collapsedElement?: ReactNode;
} & HTMLProps<HTMLDivElement>) => {
  return (
    <div
      id={persistId}
      className={cn("collapse-comment flex", className)}
      {...props}
    >
      <button
        className={`flex items-start gap-2 rounded-none border-none p-2 transition-colors hover:bg-white/5`}
      >
        <BiMessageSquareMinus className="expanded" strokeWidth={1} />
        <BiMessageSquareAdd className="collapsed hidden" strokeWidth={0.8} />
        <div className="collapsed hidden">{collapsedElement}</div>
      </button>
      <div className="expanded">{children}</div>
    </div>
  );
};

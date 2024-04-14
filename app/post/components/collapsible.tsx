"use client";
import { HTMLProps, ReactNode, useState } from "react";
import { BiMessageSquareAdd, BiMessageSquareMinus } from "react-icons/bi";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const Collapsible = ({
  children,
  className,
  canCollapse = true,
  collapsedElement,
  ...props
}: {
  children: ReactNode;
  canCollapse?: boolean;
  collapsedElement?: ReactNode;
} & HTMLProps<HTMLDivElement>) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div
      className={cn(
        `flex flex-row ${expanded ? "items-start" : "items-center"}`,
        className,
      )}
      {...props}
    >
      {canCollapse && (
        <Button
          onClick={() => setExpanded(!expanded)}
          variant={"link"}
          size={"sm"}
          className="gap-2"
        >
          {expanded ? <BiMessageSquareMinus /> : <BiMessageSquareAdd />}
          {!expanded && !collapsedElement && (
            <span className="italic">collapsed</span>
          )}
          {!expanded && collapsedElement}
        </Button>
      )}
      {expanded && children}
    </div>
  );
};

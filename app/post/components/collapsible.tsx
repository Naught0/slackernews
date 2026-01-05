"use client";
import { Activity, HTMLProps, ReactNode, useRef, useState } from "react";
import { BiMessageSquareAdd, BiMessageSquareMinus } from "react-icons/bi";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const Collapsible = ({
  persistId,
  children,
  className,
  canCollapse = true,
  collapsedElement,
  ...props
}: {
  persistId?: string;
  children: ReactNode;
  canCollapse?: boolean;
  collapsedElement?: ReactNode;
} & HTMLProps<HTMLDivElement>) => {
  const [expanded, setExpanded] = useState(getExpandedFromSession(persistId));
  const ref = useRef<HTMLDivElement>(null);

  function onClick() {
    setExpanded((prev) => {
      if (persistId) {
        sessionStorage.setItem(persistId, prev ? "0" : "1");
      }
      return !prev;
    });
  }

  return (
    <div className={cn(className, `flex`)} {...props} ref={ref}>
      {canCollapse && (
        <div className="flex">
          <Button
            onClick={onClick}
            variant={"outline"}
            size={"sm"}
            className={`h-full max-w-fit ${expanded ? "items-start" : "items-center"} justify-start gap-2 rounded-none border-none p-2`}
          >
            {expanded ? (
              <BiMessageSquareMinus strokeWidth={1} />
            ) : (
              <BiMessageSquareAdd strokeWidth={0.8} />
            )}
            {!expanded && !collapsedElement && (
              <span className="italic">collapsed</span>
            )}
            {!expanded && collapsedElement}
          </Button>
        </div>
      )}
      <Activity mode={expanded ? "visible" : "hidden"}>{children}</Activity>
    </div>
  );
};

function getExpandedFromSession(persistId?: string) {
  if (!persistId) return true;
  if (typeof window !== "undefined") {
    return (sessionStorage.getItem(persistId) ?? "1") === "1";
  }

  return true;
}

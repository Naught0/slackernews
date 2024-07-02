"use client";
import { HTMLProps, ReactNode, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  function onClick() {
    const top = ref.current?.getBoundingClientRect().top;
    if (expanded && top && top < 0) {
      ref.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    setExpanded(!expanded);
  }

  return (
    <div className={cn(className, `flex`)} {...props} ref={ref}>
      {canCollapse && (
        <div className="flex">
          <Button
            onClick={onClick}
            variant={"outline"}
            size={"sm"}
            className={`h-full max-w-fit ${expanded ? "items-start" : "items-center"} justify-start gap-2 rounded-none border-none p-1 lg:p-2`}
          >
            {expanded ? <BiMessageSquareMinus /> : <BiMessageSquareAdd />}
            {!expanded && !collapsedElement && (
              <span className="italic">collapsed</span>
            )}
            {!expanded && collapsedElement}
          </Button>

          <div className="w-full flex-grow border-b" />
        </div>
      )}
      {<div className={`${expanded ? "" : "hidden"}`}>{children}</div>}
    </div>
  );
};

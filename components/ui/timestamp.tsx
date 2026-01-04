"use client";
import { HTMLProps, ReactNode, useState } from "react";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export const Timestamp = ({
  time,
  timeAgo,
  ...props
}: {
  time: number;
  timeAgo: ReactNode;
} & HTMLProps<HTMLSpanElement>) => {
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={700}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger onClick={() => setOpen(!open)}>
          <span
            {...props}
            className={cn("text-xs lg:text-base", props.className)}
          >
            {timeAgo}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-primary">
          <span className="font-mono text-xs">
            {new Date(time * 1000).toLocaleString()}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

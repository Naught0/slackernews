"use client";
import { HTMLProps } from "react";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
dayjs.extend(relative);

export const Timestamp = ({
  time,
  ...props
}: {
  time: number;
} & HTMLProps<HTMLSpanElement>) => {
  const djs = dayjs.unix(time);
  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger>
          <span
            {...props}
            className={cn("text-xs lg:text-base", props.className)}
          >
            {dayjs().to(djs)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-primary">
          <span className="font-mono text-xs">
            {djs.toDate().toLocaleString()}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

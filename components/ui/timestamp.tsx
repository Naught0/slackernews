import { HTMLProps } from "react";
import { cn } from "~/lib/utils";

export const Timestamp = ({
  timeAgo,
  time,
  ...props
}: {
  timeAgo: string;
  time: number;
} & HTMLProps<HTMLSpanElement>) => {
  return (
    <span
      {...props}
      title={new Date(time * 1000).toLocaleString()}
      className={cn("text-xs lg:text-base", props.className)}
    >
      {timeAgo}
    </span>
  );
};

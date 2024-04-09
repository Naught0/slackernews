import { HTMLProps } from "react";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
dayjs.extend(relative);

export const Timestamp = ({
  time,
  ...props
}: {
  time: number;
} & HTMLProps<HTMLSpanElement>) => {
  const djs = dayjs.unix(time);
  return (
    <span
      {...props}
      title={djs.toDate().toLocaleString()}
      className={cn("text-xs lg:text-base", props.className)}
    >
      {dayjs().to(djs)}
    </span>
  );
};

"use client";
import { HTMLProps, ReactNode, useRef, useState, startTransition } from "react";
import { BiMessageSquareAdd, BiMessageSquareMinus } from "react-icons/bi";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const BORDER_COLORS = [
  "border-slate-300",
  "border-slate-400",
  "border-slate-500",
  "border-slate-600",
  "border-zinc-400",
  "border-zinc-500",
  "border-zinc-600",
] as const;

export function getBorderColorForDepth(depth: number) {
  const n = BORDER_COLORS.length;
  return BORDER_COLORS[(((depth - 1) % n) + n) % n];
}

export const Collapsible = ({
  persistId,
  children,
  className,
  canCollapse = true,
  collapsedElement,
  indentLevel = 1,
  ...props
}: {
  persistId?: string;
  children: ReactNode;
  canCollapse?: boolean;
  collapsedElement?: ReactNode;
  indentLevel?: number;
} & HTMLProps<HTMLDivElement>) => {
  const [expanded, setExpanded] = useState(getExpandedFromSession(persistId));
  const ref = useRef<HTMLDivElement>(null);

  function toggle() {
    const wasExpanded = expanded;
    startTransition(() => {
      setExpanded((prev) => {
        const next = !prev;
        if (persistId) {
          sessionStorage.setItem(persistId, next ? "1" : "0");
        }
        return next;
      });
    });
    if (wasExpanded) {
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el && el.getBoundingClientRect().top < 0) {
          el.scrollIntoView({ block: "start" });
        }
      });
    }
  }

  const borderColor = getBorderColorForDepth(indentLevel);

  return (
    <div ref={ref} className={cn(className, "flex")} {...props}>
      {canCollapse && (
        <Button
          onClick={toggle}
          variant={"outline"}
          size={"sm"}
          className={cn(
            "h-auto min-h-full w-fit shrink-0 self-stretch justify-start gap-2 rounded-none border-none p-1 lg:p-2",
            expanded ? "items-start" : "items-center",
          )}
        >
          {expanded ? <BiMessageSquareMinus /> : <BiMessageSquareAdd />}

          {!expanded && (
            <div className="flex items-center pl-2 gap-1 text-xs italic text-muted-foreground">
              {collapsedElement}
            </div>
          )}
        </Button>
      )}
      {expanded && (
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1",
            "border-l-2 pl-2 border-solid",
            borderColor,
          )}
        >
          {children}
        </div>
      )}
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

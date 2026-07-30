"use client";
import {
  Activity,
  HTMLProps,
  ReactNode,
  useRef,
  useState,
  startTransition,
} from "react";
import { cn } from "~/lib/utils";

const BORDER_COLORS = [
  "border-slate-400",
  "border-sky-400",
  "border-teal-400",
  "border-amber-400",
  "border-rose-400",
  "border-indigo-400",
  "border-emerald-400",
] as const;

export function getBorderColorForDepth(depth: number) {
  const n = BORDER_COLORS.length;
  return BORDER_COLORS[((depth - 1) % n + n) % n];
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
  const containerRef = useRef<HTMLDivElement>(null);

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
        const el = containerRef.current;
        if (el && el.getBoundingClientRect().top < 0) {
          el.scrollIntoView({ block: "start" });
        }
      });
    }
  }

  const borderColor = getBorderColorForDepth(indentLevel);

  return (
    <div ref={containerRef} className={cn(className, "flex")} {...props}>
      {canCollapse && (
        <button
          type="button"
          onClick={toggle}
          aria-label={expanded ? "Collapse thread" : "Expand thread"}
          aria-expanded={expanded}
          className={cn(
            "shrink-0 cursor-pointer border-l-2 border-solid bg-transparent",
            "min-w-[8px] transition-colors hover:bg-slate-200/40",
            borderColor,
          )}
        />
      )}
      <div className="min-w-0 flex-1 pl-2">
        {!expanded && collapsedElement}
        <Activity mode={expanded ? "visible" : "hidden"}>{children}</Activity>
      </div>
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

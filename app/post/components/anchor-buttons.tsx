"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import { useState } from "react";

function findLinksWithIds() {
  return [...document.querySelectorAll(".comments article")];
}

export function AnchorButtons() {
  const [idx, setIdx] = useState(-1);

  function scrollToLink(newIdx: number) {
    if (newIdx < 0) {
      setIdx(-1);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const ids = findLinksWithIds();
    if (newIdx > ids.length - 1) return setIdx(ids.length - 1);

    setIdx(newIdx);
    ids[newIdx]?.scrollIntoView({ behavior: "auto", block: "start" });
  }

  return (
    <aside className="sticky bottom-1/4 right-0 flex w-full justify-end">
      <div className="flex w-fit flex-col gap-1 opacity-40 hover:opacity-85 lg:bottom-10 lg:left-10">
        <Button
          onClick={() => scrollToLink(idx - 1)}
          type="button"
          size={"icon"}
          variant={"outline"}
        >
          <ArrowUpIcon />
        </Button>
        <Button
          onClick={() => scrollToLink(idx + 1)}
          type="button"
          size="icon"
          variant="outline"
        >
          <ArrowDownIcon />
        </Button>
      </div>
    </aside>
  );
}

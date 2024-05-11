"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import { useState } from "react";

function findAnchors() {
  return [...document.querySelectorAll(".comments .anchor")];
}

export function AnchorButtons() {
  const [idx, setIdx] = useState(-1);

  function scrollToLink(newIdx: number) {
    if (newIdx < 0) {
      setIdx(-1);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const ids = findAnchors();
    if (newIdx > ids.length - 1) return setIdx(ids.length - 1);

    if (ids[newIdx]?.checkVisibility()) {
      setIdx(newIdx);
      return ids[newIdx]?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    if (newIdx > idx && newIdx < ids.length) {
      setIdx(newIdx + 1);
      scrollToLink(newIdx + 1);
    }
    if (newIdx < idx && newIdx > -1) {
      setIdx(newIdx - 1);
      scrollToLink(newIdx - 1);
    }
  }

  return (
    <div className="fixed bottom-1/3 right-12 flex w-fit flex-col gap-1 opacity-45 hover:opacity-85 lg:right-24">
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
  );
}

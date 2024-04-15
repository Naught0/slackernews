"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import { useState } from "react";

function findLinksWithIds() {
  return [...document.querySelectorAll("a")].filter((elem) => !!elem.hash);
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
    ids[newIdx]?.scrollIntoView({ behavior: "auto", inline: "start" });
  }

  return (
    <div className="sticky bottom-5 left-5 flex w-fit flex-row gap-1 lg:bottom-10 lg:left-10">
      <Button
        onClick={() => scrollToLink(idx - 1)}
        type="button"
        variant={"outline"}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        onClick={() => scrollToLink(idx + 1)}
        type="button"
        variant="outline"
      >
        <ArrowDownIcon />
      </Button>
    </div>
  );
}
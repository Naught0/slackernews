"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "./button";

export function AnchorButtons() {
  return (
    <div className="fixed bottom-5 right-5 flex w-fit flex-row gap-1 lg:bottom-10 lg:right-10">
      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        type="button"
      >
        <ArrowUpIcon />
      </Button>
      <Button
        onClick={() => window.scrollTo({ top: document.body.scrollHeight })}
      >
        <ArrowDownIcon />
      </Button>
    </div>
  );
}

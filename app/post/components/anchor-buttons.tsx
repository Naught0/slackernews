"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";

export function AnchorButtons({
  onNext,
  onPrev,
}: {
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="fixed bottom-1/3 right-12 flex w-fit flex-col gap-1 opacity-45 hover:opacity-85 lg:right-24">
      <Button onClick={onPrev} type="button" size={"icon"} variant={"outline"}>
        <ArrowUpIcon />
      </Button>
      <Button onClick={onNext} type="button" size="icon" variant="outline">
        <ArrowDownIcon />
      </Button>
    </div>
  );
}

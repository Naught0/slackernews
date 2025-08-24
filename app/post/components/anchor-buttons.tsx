"use client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";

export function AnchorButtons() {
  function next() {
    const elem = findNextAnchor();
    if (!elem) return;

    elem.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function prev() {
    const elem = findPrevAnchor();
    if (!elem) return window.scrollTo({ top: 0 });

    elem.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-1/3 right-12 flex w-fit flex-col gap-1 opacity-45 hover:opacity-85 lg:right-24">
      <Button onClick={prev} type="button" size={"icon"} variant={"outline"}>
        <ArrowUpIcon />
      </Button>
      <Button onClick={next} type="button" size="icon" variant="outline">
        <ArrowDownIcon />
      </Button>
    </div>
  );
}

function findAnchors() {
  const anchors = [...document.querySelectorAll(".anchor")].toSorted(
    (a, b) => b.getBoundingClientRect().y - a.getBoundingClientRect().y,
  );
  return anchors;
}

function findPrevAnchor() {
  return findAnchors().find((a) => a.getBoundingClientRect().y < -25);
}

function findNextAnchor() {
  // Source: https://medium.com/@alan.nguyen2050/detect-scroll-reaches-the-bottom-acb315824214
  const scrolledTo = window.scrollY + window.innerHeight;
  const threshold = 150;
  const cantScroll = document.body.scrollHeight - threshold <= scrolledTo;
  if (cantScroll) return;

  return findAnchors()
    .toReversed()
    .find((a) => a.getBoundingClientRect().y > 25);
}

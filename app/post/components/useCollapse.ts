"use client";
import { useLayoutEffect } from "react";

function collapseComment(evt: MouseEvent) {
  const btn = evt.target as HTMLButtonElement;
  const parent = btn.closest(".collapse-comment");
  if (!parent) return console.log("NO PARENT");

  const isHidden = parent.classList.contains("is-hidden");
  const collapsed = parent.querySelectorAll(".collapsed");
  const expanded = parent.querySelectorAll(".expanded");

  if (!isHidden) {
    collapsed.forEach((el) => el.classList.remove("hidden"));
    expanded.forEach((el) => el.classList.add("hidden"));
  } else {
    collapsed.forEach((el) => el.classList.add("hidden"));
    expanded.forEach((el) => el.classList.remove("hidden"));
  }

  parent.classList.toggle("is-hidden");
  // Ensure element top is at least partially above the top of the viewport
  if (parent.getBoundingClientRect().top < 0) {
    parent.scrollIntoView(true);
  }
  sessionStorage.setItem(parent.id, !isHidden ? "1" : "0");
}

function useCollapse() {
  useLayoutEffect(function syncCollapse() {
    if (typeof window === "undefined") return;

    const comments = [...document.querySelectorAll(".collapse-comment")];
    const buttons = comments.map((comment) => comment.querySelector("button"));

    buttons.forEach((btn) => {
      if (!btn) return;

      btn.addEventListener("click", collapseComment);
    });

    return () => {
      buttons.forEach((btn) => {
        if (!btn) return;
        btn.removeEventListener("click", collapseComment);
      });
    };
  }, []);

  function getExpandedFromSession(persistId?: string) {
    if (!persistId) return true;
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem(persistId) ?? "1") === "1";
    }

    return true;
  }
}

export function StaticCollapseInjector() {
  useCollapse();
  return null;
}

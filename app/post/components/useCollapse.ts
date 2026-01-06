"use client";
import { useEffect, useLayoutEffect } from "react";

function collapseComment(evt: MouseEvent) {
  const btn = evt.target as HTMLButtonElement;
  const parent = btn.closest(".collapse-comment");
  if (!parent) return console.log("NO PARENT");

  parent.classList.toggle("is-hidden");
  const isHidden = parent.classList.contains("is-hidden");
  const collapsed = parent.querySelectorAll(".collapsed");
  const expanded = parent.querySelectorAll(".expanded");

  if (isHidden) {
    collapsed.forEach((el) => el.classList.remove("hidden"));
    expanded.forEach((el) => el.classList.add("hidden"));
    btn.classList.add("items-start");
    btn.classList.remove("items-center");
  } else {
    collapsed.forEach((el) => el.classList.add("hidden"));
    expanded.forEach((el) => el.classList.remove("hidden"));
    btn.classList.remove("items-start");
    btn.classList.add("items-center");
  }

  sessionStorage.setItem(parent.id, !isHidden ? "1" : "0");
}

function useCollapse() {
  useLayoutEffect(function syncCollapse() {
    if (typeof window === "undefined") return;

    const comments = [...document.querySelectorAll(".collapse-comment")];
    const buttons = comments.map((comment) => comment.querySelector("button"));
    console.log("Found", buttons.length, "buttons");

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
  console.log("RENDERING COLLAPSE INJECTOR");
  useCollapse();
  return null;
}

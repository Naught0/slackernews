"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchHnItem } from "~/lib/hn";

async function walkToRoot(id: number): Promise<number> {
  let current = id;
  const visited = new Set<number>();
  for (let i = 0; i < 50; i++) {
    if (visited.has(current)) break;
    visited.add(current);
    const item = await fetchHnItem(current);
    if (!item) break;
    if (item.type === "story" || item.type === "job") return item.id;
    if (item.parent) {
      current = item.parent;
    } else {
      break;
    }
  }
  return current;
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;

    walkToRoot(numId).then((rootId) => {
      if (rootId === numId) {
        router.replace(`/post/${rootId}`);
      } else {
        router.replace(`/post/${rootId}/comment/${id}`);
      }
      setResolved(true);
    });
  }, [id, router]);

  return (
    <div className="text-muted-foreground p-4 text-sm">
      Redirecting to comment context...
    </div>
  );
}

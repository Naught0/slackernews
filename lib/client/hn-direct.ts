const HN_BASE = "https://hacker-news.firebaseio.com/v0";

export interface HnRawItem {
  id: number;
  type: string;
  by?: string;
  time: number;
  text?: string;
  parent?: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
}

export async function fetchHnItem(id: number): Promise<HnRawItem | null> {
  const res = await fetch(`${HN_BASE}/item/${id}.json`, {
    signal: AbortSignal.timeout(10000),
    cache: "force-cache" as RequestCache,
  });
  if (!res.ok) return null;
  return res.json();
}

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

export interface UserView {
  id: string;
  created: number;
  karma: number;
  about: string;
  submitted: number[];
}

export interface CommentView {
  id: number;
  by: string | null;
  time: number;
  content: string | null;
  parent: number;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchHnItem(id: number): Promise<HnRawItem | null> {
  return fetchJson<HnRawItem>(`${HN_BASE}/item/${id}.json`);
}

export async function fetchHnUser(id: string): Promise<UserView | null> {
  return fetchJson<UserView>(`${HN_BASE}/user/${id}.json`);
}

export async function fetchHnFeedIds(type: string): Promise<number[]> {
  return (await fetchJson<number[]>(`${HN_BASE}/${type}stories.json`)) ?? [];
}

export async function fetchHnComment(
  id: number,
): Promise<CommentView | null> {
  const item = await fetchHnItem(id);
  if (!item) return null;
  return {
    id: item.id,
    by: item.by ?? null,
    time: item.time,
    content: item.text ?? null,
    parent: item.parent ?? 0,
    kids: item.kids ?? [],
    dead: item.dead ?? false,
    deleted: item.deleted ?? false,
  };
}

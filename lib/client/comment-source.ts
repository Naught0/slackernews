import type { CachedComment } from "../types";
import { fetchHnItem } from "./hn-direct";

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

export function toCommentView(cached: CachedComment): CommentView {
  return {
    id: cached.id,
    by: cached.by,
    time: cached.time,
    content: cached.content,
    parent: cached.parent_id,
    kids: cached.kids,
    dead: cached.dead,
    deleted: cached.deleted,
  };
}

const FETCH_TIMEOUT_MS = 8000;

type Resolver = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
  fn: () => Promise<unknown>;
};

const queue: Resolver[] = [];
let inFlight = 0;
const MAX_CONCURRENT = 4;

function drain() {
  while (inFlight < MAX_CONCURRENT && queue.length > 0) {
    const next = queue.shift()!;
    inFlight++;
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), FETCH_TIMEOUT_MS),
    );
    Promise.race([next.fn(), timeout])
      .then((value) => next.resolve(value))
      .catch((err) => next.reject(err))
      .finally(() => {
        inFlight--;
        drain();
      });
  }
}

function enqueue<T>(fn: () => Promise<T | null>): Promise<T | null> {
  return new Promise((resolve, reject) => {
    queue.push({
      resolve: resolve as (v: unknown) => void,
      reject,
      fn,
    });
    drain();
  });
}

export async function fetchServerComment(
  id: number,
): Promise<CommentView | null> {
  return enqueue(async () => {
    const res = await fetch(`/api/comment/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.comment) return null;

    if (json.cached) {
      return toCommentView(json.comment as CachedComment);
    }

    const raw = json.comment as {
      id: number;
      by: string | null;
      time: number;
      text: string | null;
      parent: number;
      kids: number[];
      dead: boolean;
      deleted: boolean;
    };
    return {
      id: raw.id,
      by: raw.by,
      time: raw.time,
      content: raw.text,
      parent: raw.parent,
      kids: raw.kids,
      dead: raw.dead,
      deleted: raw.deleted,
    };
  });
}

export async function fetchHnComment(id: number): Promise<CommentView | null> {
  return enqueue(async () => {
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
  });
}


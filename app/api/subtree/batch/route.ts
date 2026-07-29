import { NextRequest, NextResponse } from "next/server";
import { fetchAndCacheComments } from "~/lib/server/cache";
import type { CachedComment } from "~/lib/types";

export interface SubtreeBatchRequest {
  ids: number[];
  cursor: number;
  limit: number;
  postId: number;
  baseLevel: number;
  postTime?: number;
}

export interface SubtreeBatchResponse {
  comments: CachedComment[];
  missing: number[];
  nextCursor: number;
  hasMore: boolean;
  total: number;
}

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function POST(request: NextRequest) {
  let body: SubtreeBatchRequest;
  try {
    body = (await request.json()) as SubtreeBatchRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) {
    return NextResponse.json({
      comments: [],
      missing: [],
      nextCursor: 0,
      hasMore: false,
      total: 0,
    } satisfies SubtreeBatchResponse);
  }

  if (typeof body.postId !== "number" || isNaN(body.postId)) {
    return NextResponse.json({ error: "invalid postId" }, { status: 400 });
  }
  if (typeof body.baseLevel !== "number" || body.baseLevel < 0) {
    return NextResponse.json({ error: "invalid baseLevel" }, { status: 400 });
  }

  const cursor = Math.max(0, Math.min(body.cursor ?? 0, ids.length));
  const limit = Math.min(
    Math.max(1, body.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const slice = ids.slice(cursor, cursor + limit);

  if (slice.length === 0) {
    return NextResponse.json({
      comments: [],
      missing: [],
      nextCursor: cursor,
      hasMore: cursor < ids.length,
      total: ids.length,
    } satisfies SubtreeBatchResponse);
  }

  const result = await fetchAndCacheComments({
    ids: slice,
    postId: body.postId,
    baseLevel: body.baseLevel,
    postTime: body.postTime,
  });

  const nextCursor = cursor + slice.length;
  return NextResponse.json({
    comments: result.comments,
    missing: result.missing,
    nextCursor,
    hasMore: nextCursor < ids.length,
    total: ids.length,
  } satisfies SubtreeBatchResponse);
}

import { NextRequest, NextResponse } from "next/server";
import { upsertComments } from "~/lib/server/cache";
import type { CacheSubtreeRequest } from "~/lib/types";

export async function POST(request: NextRequest) {
  let body: CacheSubtreeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { accepted: false, reason: "validation_failed" },
      { status: 400 },
    );
  }

  if (!body.postId || !Array.isArray(body.comments)) {
    return NextResponse.json(
      { accepted: false, reason: "validation_failed" },
      { status: 400 },
    );
  }

  const inserted = upsertComments(body.comments, body.postTime ?? 0);
  return NextResponse.json({ accepted: true, inserted });
}

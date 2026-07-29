import { NextResponse } from "next/server";
import { getCachedSubtree, getCachedComment } from "~/lib/server/cache";
import type { CachedComment } from "~/lib/types";

export interface SubtreeResponse {
  rootId: number;
  comments: CachedComment[];
  cacheable: boolean;
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rootId: string }> },
) {
  const { rootId: rootIdStr } = await params;
  const rootId = parseInt(rootIdStr, 10);
  if (isNaN(rootId)) {
    return NextResponse.json({ error: "invalid rootId" }, { status: 400 });
  }

  const root = getCachedComment(rootId);
  if (!root) {
    return NextResponse.json(
      { error: "not cached", rootId, comments: [], cacheable: false },
      { status: 404 },
    );
  }

  const subtree = getCachedSubtree(rootId, 100);
  if (!subtree) {
    return NextResponse.json(
      { error: "not cached", rootId, comments: [], cacheable: false },
      { status: 404 },
    );
  }

  return NextResponse.json({
    rootId,
    comments: subtree,
    cacheable: true,
  } satisfies SubtreeResponse);
}

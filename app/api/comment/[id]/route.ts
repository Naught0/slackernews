import { NextResponse } from "next/server";
import { getItem } from "~/lib/server/hn";
import { getCachedComment, getCachedPost, upsertComments } from "~/lib/server/cache";
import type { HNComment } from "~/lib/types";
import type { CachedComment } from "~/lib/types";

interface RawComment {
  id: number;
  by: string | null;
  time: number;
  text: string | null;
  parent: number;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}

type CommentResponse =
  | { cached: true; comment: CachedComment }
  | { cached: false; comment: RawComment | null };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentId = parseInt(id, 10);
  if (isNaN(commentId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const cached = getCachedComment(commentId);
  if (cached) {
    return NextResponse.json({ cached: true, comment: cached } satisfies CommentResponse);
  }

  const item = await getItem(commentId);
  if (!item || (item as HNComment).type !== "comment") {
    return NextResponse.json({ cached: false, comment: null } satisfies CommentResponse);
  }

  const hn = item as HNComment;

  tryWriteThrough(hn);

  return NextResponse.json({
    cached: false,
    comment: {
      id: hn.id,
      by: hn.by ?? null,
      time: hn.time,
      text: hn.text ?? null,
      parent: hn.parent,
      kids: hn.kids ?? [],
      dead: hn.dead ?? false,
      deleted: hn.deleted ?? false,
    },
  } satisfies CommentResponse);
}

function tryWriteThrough(hn: HNComment) {
  const parentComment = getCachedComment(hn.parent);
  if (!parentComment) return;

  const post = getCachedPost(parentComment.post_id);
  if (!post) return;

  upsertComments(
    [
      {
        id: hn.id,
        post_id: parentComment.post_id,
        parent_id: hn.parent,
        level: parentComment.level + 1,
        by: hn.by ?? null,
        time: hn.time,
        content: hn.text ?? null,
        kids: hn.kids ?? [],
        dead: hn.dead ?? false,
        deleted: hn.deleted ?? false,
      },
    ],
    post.post.time,
  );
}

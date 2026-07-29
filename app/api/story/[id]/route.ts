import { NextRequest, NextResponse } from "next/server";
import { getStoryPage } from "~/lib/server/story";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "0", 10);
  const prefetchParam = url.searchParams.get("prefetch");
  const backgroundPrefetch = prefetchParam !== "0";

  const data = await getStoryPage({ postId, page, backgroundPrefetch });
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

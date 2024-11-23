import { RedirectType, notFound, permanentRedirect } from "next/navigation";
import { getCommentPost } from "~/app/hackernews-api/hnpwa";

export const revalidate = 120;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getCommentPost(id);
  if (!post) return notFound();

  if (post.id.toString() === id) {
    return permanentRedirect(`/post/${post.id}`, RedirectType.replace);
  }
  permanentRedirect(`/post/${post.id}/comment/${id}`, RedirectType.replace);
}

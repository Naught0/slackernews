import { RedirectType, permanentRedirect } from "next/navigation";
import { getCommentPost } from "~/app/hackernews-api/hnpwa";

export const revalidate = 120;

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const post = await getCommentPost(id);
  if (post.id.toString() === id) {
    return permanentRedirect(`/post/${post.id}`, RedirectType.replace);
  }
  permanentRedirect(`/post/${post.id}/comment/${id}`, RedirectType.replace);
}

import { RedirectType, permanentRedirect } from "next/navigation";
import { getCommentPost } from "~/app/hackernews-api/hnpwa";

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const post = await getCommentPost(id);
  permanentRedirect(`/post/${post.id}/comment/${id}`, RedirectType.replace);
}

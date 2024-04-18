import { CommentPage } from "~/app/components/comment-page";

export default function Page({ params: { id } }: { params: { id: string } }) {
  return <CommentPage commentId={id} />;
}

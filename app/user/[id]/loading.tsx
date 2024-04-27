import User from "./components/user";
import CommentLoading from "~/app/post/[id]/loading";

const fakeUser = {
  about: "This is a description",
  created: 1555054453,
  id: "a_totally_real_person",
  karma: 13795,
  submitted: [123, 345, 456],
};
export default function Loading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-2 lg:max-w-screen-md">
      <User user={fakeUser} loading />
      <h1 className="text-lg lg:text-2xl">Recent activity</h1>
      <div className="flex flex-col gap-2 px-3 lg:px-6">
        <CommentLoading />
      </div>
    </div>
  );
}

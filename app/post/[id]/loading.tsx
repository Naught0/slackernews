import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { HNComment } from "../components/comment";
import { generateKey } from "crypto";
import { randomChoice } from "~/lib/utils";

const LoadingComment = (
  props: HNPWAItem & { op?: string | null; postId: string },
) => {
  return (
    <article
      id={`${props.id}`}
      className={
        "flex min-w-0 flex-1 flex-col items-start justify-between gap-3 border-l-0 border-solid pl-3"
      }
    >
      <div className="flex w-full flex-row flex-wrap items-center gap-3 gap-x-1 text-sm lg:text-base">
        <Skeleton>
          <span className="text-muted-foreground">[deleted]</span>
        </Skeleton>
        <Skeleton>
          <div className="flex flex-row items-center">30 minutes ago</div>
        </Skeleton>
      </div>
      <Skeleton>{props.content}</Skeleton>
    </article>
  );
};

function generateComment() {
  return {
    user: randomChoice([
      "billy",
      "bingus_springleMcGee",
      "another name",
      "dr_Octagonapus_III_Esq.",
      "bap",
    ]),
    postId: "0",
    comments: [],
    comments_count: 0,
    level: 0,
    title: "test",
    id: 0,
    time: 0,
    type: "comment",
    points: 0,
    time_ago: "80 years ago",
    content:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat. Lorem ipsum dolor sit amet, officia excepteur ex fugiat reprehenderit enim labore culpa sint ad nisi Lorem pariatur mollit ex esse exercitation amet. Nisi anim cupidatat excepteur officia. Reprehenderit nostrud nostrud ipsum Lorem est aliquip amet voluptate voluptate dolor minim nulla est proident. Nostrud officia pariatur ut officia. Sit irure elit esse ea nulla sunt ex occaecat reprehenderit commodo officia dolor Lorem duis laboris cupidatat officia voluptate. Culpa proident adipisicing id nulla nisi laboris ex in Lorem sunt duis officia eiusmod. Aliqua reprehenderit commodo ex non excepteur duis sunt velit enim. Voluptate laboris sint cupidatat ullamco ut ea consectetur et est culpa et culpa duis.".slice(
        0,
        randomChoice([120, 300, 500, 800, 1000]),
      ),
  };
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      {[...new Array(5).keys()].map((idx) => (
        <LoadingComment key={idx} {...generateComment()} />
      ))}
    </div>
  );
}

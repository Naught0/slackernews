interface HNItem {
  deleted?: boolean;
  dead?: boolean;
}
interface HNStory extends HNItem {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  type: "story";
  url: string;
}

interface HNComment extends HNItem {
  by: string;
  id: number;
  kids?: number[];
  parent: number;
  text?: string;
  time: number;
  type: "comment";
}

interface HNAsk extends HNItem {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  text: string;
  time: number;
  title: string;
  type: "story";
}

interface HNJob extends HNItem {
  by: string;
  id: number;
  score: number;
  text: string;
  time: number;
  title: string;
  type: "job";
  url: string;
}

interface HNPoll extends HNItem {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  parts: number[];
  score: number;
  text: string;
  time: number;
  title: string;
  type: "poll";
}

interface HNPollOpt {
  by: string;
  id: number;
  poll: number;
  score: number;
  text: string;
  time: number;
  type: "pollopt";
}

type HNAnyItem = HNStory | HNAsk | HNJob | HNComment | HNPoll;

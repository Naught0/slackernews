export interface HNItem {
  deleted?: boolean;
  dead?: boolean;
}

export interface HNStory extends HNItem {
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

export interface HNComment extends HNItem {
  by: string;
  id: number;
  kids?: number[];
  parent: number;
  text?: string;
  time: number;
  type: "comment";
}

export interface HNAsk extends HNItem {
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

export interface HNJob extends HNItem {
  by: string;
  id: number;
  score: number;
  text: string;
  time: number;
  title: string;
  type: "job";
  url: string;
}

export interface HNPoll extends HNItem {
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

export interface HNPollOpt {
  by: string;
  id: number;
  poll: number;
  score: number;
  text: string;
  type: "pollopt";
}

export interface HNUser {
  created: number;
  id: string;
  karma: number;
  submitted: number[];
  about: string;
}

export type HNAnyItem = HNStory | HNAsk | HNJob | HNComment | HNPoll;
export type HNPost = HNStory | HNAsk | HNJob;

export type HNHomepageType = "top" | "best" | "new" | "ask" | "show" | "job";

export const PER_PAGE = 20;

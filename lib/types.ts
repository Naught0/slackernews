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

export type HNHit =
  | HNStory
  | HNComment
  | HNAsk
  | HNJob
  | HNPoll
  | HNPollOpt
  | null;

export type HNHomepageType = "top" | "best" | "new" | "ask" | "show" | "job";

export type HNPWAFeedType = "news" | "newest" | "ask" | "show" | "jobs";

export interface CachedComment {
  id: number;
  post_id: number;
  parent_id: number;
  level: number;
  by: string | null;
  time: number;
  content: string | null;
  kids: number[];
  dead: boolean;
  deleted: boolean;
}

export interface SubtreeNode {
  comment: CachedComment;
  children: SubtreeNode[];
}

export interface StoryResponse {
  post: HNPost;
  topLevelIds: number[];
  page: number;
  perPage: number;
  initialSubtree: Array<
    | { id: number; cached: true; comment: CachedComment; children: SubtreeNode[] }
    | { id: number; cached: false }
  >;
  cacheable: boolean;
  stale: boolean;
}

export interface CommentResponse {
  cached: boolean;
  comment: CachedComment | null;
}

export interface CacheSubtreeRequest {
  postId: number;
  postTime: number;
  comments: CachedComment[];
}

export interface CacheSubtreeResponse {
  accepted: boolean;
  reason?: string;
  inserted?: number;
}

// Legacy HNPWA types — used by homepage/items until migrated
export interface HNPWAItem {
  id: number;
  title: string;
  points: number | null;
  user: string | null;
  time: number;
  time_ago: string;
  content: string;
  deleted?: boolean;
  dead?: boolean;
  type: "comment" | "link" | "job" | "poll" | "pollopt";
  url?: string;
  domain?: string;
  comments: HNPWAItem[];
  level: number;
  comments_count: number;
}

export interface HNPWAFeedItem {
  id: number;
  title: string;
  points?: number | null;
  user?: string | null;
  time: number;
  time_ago: string;
  content?: string;
  comments_count: number;
  type: string;
  url?: string;
  domain?: string;
}

export const PER_PAGE = 20;
export const MAX_INITIAL_DEPTH = 4;
export { MAX_CACHE_AGE_SECONDS, isFresh } from "./server/freshness";

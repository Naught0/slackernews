import { HomepageSelector } from "../components/homepage-selector";
import { Post } from "../components/post";

const testPosts: HNPWAFeedItem[] = [
  {
    id: 1,
    title: "Understanding TypeScript",
    points: 120,
    user: "alice",
    time: 1713945600,
    time_ago: "3 hours ago",
    comments_count: 25,
    type: "story",
    url: "https://example.com/typescript",
    domain: "example.com",
  },
  {
    id: 2,
    title: "Show HN: New JS framework",
    points: 95,
    user: "bob",
    time: 1713942000,
    time_ago: "4 hours ago",
    comments_count: 18,
    type: "show",
    url: "https://example.com/js-framework",
    domain: "example.com",
  },
  {
    id: 3,
    title: "Ask HN: Best dev setup?",
    points: 60,
    user: "carol",
    time: 1713938400,
    time_ago: "5 hours ago",
    comments_count: 40,
    type: "ask",
  },
  {
    id: 4,
    title: "Launch HN: New startup",
    points: 200,
    user: "dave",
    time: 1713934800,
    time_ago: "6 hours ago",
    comments_count: 55,
    type: "launch",
    url: "https://launchstartup.com",
    domain: "launchstartup.com",
  },
  {
    id: 5,
    title: "HN Discussion: AI Trends",
    points: 180,
    user: "eve",
    time: 1713931200,
    time_ago: "7 hours ago",
    comments_count: 70,
    type: "story",
    url: "https://ai-discussion.com",
    domain: "ai-discussion.com",
  },
  {
    id: 6,
    title: "Tech salaries in 2025",
    points: null,
    user: null,
    time: 1713927600,
    time_ago: "8 hours ago",
    comments_count: 30,
    type: "story",
  },
  {
    id: 7,
    title: "Show HN: Code visualizer",
    points: 45,
    user: "frank",
    time: 1713924000,
    time_ago: "9 hours ago",
    comments_count: 12,
    type: "show",
    url: "https://codeviz.io",
    domain: "codeviz.io",
  },
  {
    id: 8,
    title: "Ask HN: How to learn Rust?",
    points: 80,
    user: "grace",
    time: 1713920400,
    time_ago: "10 hours ago",
    comments_count: 33,
    type: "ask",
  },
  {
    id: 9,
    title: "Python 3.13 Released",
    points: 300,
    user: "helen",
    time: 1713916800,
    time_ago: "11 hours ago",
    comments_count: 88,
    type: "story",
    url: "https://python.org/3.13",
    domain: "python.org",
  },
  {
    id: 10,
    title: "WebAssembly in 2025",
    points: 110,
    user: "ian",
    time: 1713913200,
    time_ago: "12 hours ago",
    comments_count: 20,
    type: "story",
    url: "https://webassembly.dev",
    domain: "webassembly.dev",
  },
];

export default function Loading() {
  return (
    <div className="flex w-full max-w-screen-lg flex-col">
      <div className="self-end">
        <HomepageSelector />
      </div>
      <div className="flex flex-col gap-3">
        <div className="border-color divide-y">
          {testPosts.map((item) => (
            <div key={item.id} className="py-3">
              <Post story={item} />
            </div>
          ))}
        </div>
        {/* <HomepagePagination searchParams={searchParams} /> */}
      </div>
    </div>
  );
}

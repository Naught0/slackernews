import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
dayjs.extend(relative);

const FIELD_MAP: Map<keyof HNStory, keyof HNPWAItem> = new Map([
  ["id", "id"],
  ["title", "title"],
  ["score", "points"],
  ["by", "user"],
  ["time", "time"],
  ["descendants", "comments_count"],
  ["url", "url"],
]);

export function convertPostToPWA(post: HNStory): HNPWAItem {
  const ret: Partial<HNPWAItem> = {};
  for (const [k, v] of Object.entries(post)) {
    if (FIELD_MAP.has(k as keyof HNStory)) {
      ret[FIELD_MAP.get(k as keyof HNStory)!] = v;
    }
  }
  if (ret.time)
    ret["time_ago"] = dayjs().to(dayjs(ret.time * 1000));

  return ret as HNPWAItem;
}

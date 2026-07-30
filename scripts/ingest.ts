import {
  backfill,
  ingestUpdates,
  ingestFeeds,
  fetchUpdates,
  evictStale,
  type FeedType,
} from "../lib/server/ingest";

const UPDATES_MS = Number(process.env.INGEST_UPDATES_MS ?? 30_000);
const FEEDS_MS = Number(process.env.INGEST_FEEDS_MS ?? 300_000);
const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY ?? 16);
const BACKFILL_N = Number(process.env.INGEST_BACKFILL ?? 500);
const FEEDS: FeedType[] = (
  process.env.INGEST_FEEDS ?? "top,best,new,ask,show,job"
).split(",") as FeedType[];

const seen = new Set<number>();

function trimSeen() {
  if (seen.size > 10_000) {
    const arr = Array.from(seen);
    seen.clear();
    for (const x of arr.slice(arr.length - 5_000)) seen.add(x);
  }
}

function sleepBreakable(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((res) => {
    const t = setTimeout(res, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      res();
    }, { once: true });
  });
}

const ac = new AbortController();
const stop = (sig: string) => {
  console.log(`[ingest] received ${sig}, stopping after current wave`);
  ac.abort();
};
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

async function loop() {
  const ev0 = evictStale();
  console.log(`[ingest] boot evict posts=${ev0.posts} comments=${ev0.comments}`);

  try {
    const r = await backfill({
      concurrency: CONCURRENCY,
      budget: BACKFILL_N,
      signal: ac.signal,
    });
    console.log(
      `[ingest] backfill posts=${r.posts} comments=${r.comments}`,
    );
  } catch (e) {
    console.error(e);
  }

  let lastFeeds = 0;
  let lastUpdates = 0;

  while (!ac.signal.aborted) {
    const now = Date.now();

    if (now - lastUpdates >= UPDATES_MS) {
      lastUpdates = now;
      try {
        const u = await fetchUpdates();
        const r = await ingestUpdates(u.items, {
          concurrency: CONCURRENCY,
          seen,
          signal: ac.signal,
        });
        console.log(
          `[ingest] updates items=${u.items.length} posts=${r.posts} comments=${r.comments} skipped=${r.skipped}`,
        );
        trimSeen();
      } catch (e) {
        console.error(e);
      }
    }

    if (now - lastFeeds >= FEEDS_MS) {
      lastFeeds = now;
      try {
        const r = await ingestFeeds(FEEDS, {
          concurrency: CONCURRENCY,
          seen,
          signal: ac.signal,
        });
        console.log(
          `[ingest] feeds posts=${r.posts} skipped=${r.skipped}`,
        );
        trimSeen();
      } catch (e) {
        console.error(e);
      }
    }

    evictStale();
    await sleepBreakable(
      Math.min(UPDATES_MS, FEEDS_MS, 5000),
      ac.signal,
    );
  }

  console.log("[ingest] exiting");
  process.exit(0);
}

loop().catch((e) => {
  console.error("[ingest] fatal", e);
  process.exit(1);
});

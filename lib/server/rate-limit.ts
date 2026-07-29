const MAX_CONCURRENT = 8;
const MIN_INTERVAL_MS = 1000;
const MAX_QUEUE_SIZE = 5000;

class GlobalHnRateLimiter {
  private activeCount = 0;
  private lastRequestTime = 0;
  private waitQueue: Array<() => void> = [];
  private rejectedCount = 0;

  acquire(): boolean {
    if (this.waitQueue.length >= MAX_QUEUE_SIZE) {
      this.rejectedCount++;
      return false;
    }
    this.waitQueue.push(() => {});
    this.drain();
    return true;
  }

  private drain() {
    while (
      this.activeCount < MAX_CONCURRENT &&
      this.waitQueue.length > 0
    ) {
      const next = this.waitQueue.shift()!;
      const now = Date.now();
      const wait = Math.max(0, MIN_INTERVAL_MS - (now - this.lastRequestTime));
      this.activeCount++;
      if (wait === 0) {
        this.lastRequestTime = Date.now();
        next();
      } else {
        setTimeout(() => {
          this.lastRequestTime = Date.now();
          next();
        }, wait);
      }
    }
  }

  release() {
    this.activeCount--;
    this.drain();
  }

  stats() {
    return {
      active: this.activeCount,
      queued: this.waitQueue.length,
      rejected: this.rejectedCount,
    };
  }
}

const globalLimiter = new GlobalHnRateLimiter();

export async function withHnRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (!globalLimiter.acquire()) {
    throw new Error("HN rate limit: queue full");
  }
  try {
    return await fn();
  } finally {
    globalLimiter.release();
  }
}

export function hnRateLimitStats() {
  return globalLimiter.stats();
}

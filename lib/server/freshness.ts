export const MAX_CACHE_AGE_SECONDS = 60 * 60 * 24 * 30;
export const FRESH_MS = MAX_CACHE_AGE_SECONDS * 1000;

export function isFresh(postTime: number, now: number = Date.now() / 1000): boolean {
  return now - postTime < MAX_CACHE_AGE_SECONDS;
}

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NODE_ENV === "development") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { evictStaleCache } = await import("./lib/server/cache");
    try { evictStaleCache(); } catch { /* ignore */ }
    setInterval(() => {
      try { evictStaleCache(); } catch { /* ignore */ }
    }, 24 * 60 * 60 * 1000);
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

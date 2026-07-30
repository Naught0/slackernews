"use client";
import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";

const PERSIST_KEY = "slackernews-rq-v1";
const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

interface PersistedQuery {
  queryKey: QueryKey;
  data: unknown;
  dataUpdatedAt: number;
}

function restoreCache(queryClient: QueryClient) {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw) as {
      timestamp: number;
      queries: PersistedQuery[];
    };
    if (Date.now() - entry.timestamp > MAX_AGE) return;
    for (const q of entry.queries) {
      queryClient.setQueryData(q.queryKey, q.data);
    }
  } catch {
    localStorage.removeItem(PERSIST_KEY);
  }
}

function persistCache(queryClient: QueryClient) {
  const queries = queryClient.getQueryCache().getAll();
  const toPersist: PersistedQuery[] = [];
  for (const q of queries) {
    const state = q.state;
    if (state.data !== undefined && state.status === "success") {
      toPersist.push({
        queryKey: q.queryKey,
        data: state.data,
        dataUpdatedAt: state.dataUpdatedAt,
      });
    }
  }
  if (toPersist.length === 0) return;
  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({ timestamp: Date.now(), queries: toPersist }),
  );
}

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 15,
            retry: 1,
            gcTime: 1000 * 60 * 60 * 24,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  useEffect(() => {
    restoreCache(queryClient);
  }, [queryClient]);

  useEffect(() => {
    const persist = () => persistCache(queryClient);
    window.addEventListener("beforeunload", persist);
    return () => window.removeEventListener("beforeunload", persist);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {props.children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

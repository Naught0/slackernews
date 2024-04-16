"use client";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {props.children}
    </ThemeProvider>
  );
}

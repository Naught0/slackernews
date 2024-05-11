import "~/app/globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "~/app/components/nav";
import { Footer } from "./components/footer";
import { Providers } from "./providers";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ClientSideScrollRestorer } from "./components/hooks/scroll-restore";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "slackernews",
  description: "a featureful alternative hackernews frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable}`}>
        <Analytics />
        <Providers>
          <Suspense>
            <Nav />
          </Suspense>
          <main className="flex min-h-screen flex-col items-center p-6 lg:p-12 xl:px-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
      <Suspense>
        <ClientSideScrollRestorer />
      </Suspense>
    </html>
  );
}

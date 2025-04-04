import "~/app/globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "~/app/components/nav";
import { Footer } from "./components/footer";
import { Providers } from "./providers";
import { Suspense } from "react";
import Script from "next/script";
import { HomepageSelector } from "./components/homepage-selector";

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
        <Providers>
          <Suspense>
            <Nav />
          </Suspense>
          <main className="flex min-h-screen flex-col items-center px-2 py-6 pb-10 md:p-12 md:pb-16 xl:px-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
      <Script
        defer
        data-domain="slackernews.jamese.dev"
        src="https://plausible.jamese.dev/js/script.js"
      ></Script>
    </html>
  );
}

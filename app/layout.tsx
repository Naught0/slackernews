import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "~/app/globals.css";
import { Nav } from "~/components/ui/nav";
import { ThemeProvider } from "~/components/ui/theme-provider";

const inter = Inter({ subsets: ["latin"] });

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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <body className={inter.className}>
          <Nav />
          <main className="flex min-h-screen max-w-full flex-col items-center justify-between p-6 lg:p-12 xl:px-16">
            {children}
          </main>
        </body>
      </ThemeProvider>
    </html>
  );
}

import type { Metadata } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";
import "./globals.css";

const sans = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Code only: branches, file paths, commit SHAs, diffs.
const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Relay",
  description: "GitHub pull request code review dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full bg-background">
      <body
        className={`${sans.variable} ${mono.variable} min-h-full antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

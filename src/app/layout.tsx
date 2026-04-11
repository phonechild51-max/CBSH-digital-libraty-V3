import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CBSH Digital Library",
  description: "Academic digital library for CBSH — browse materials, take quizzes, and manage academic resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
          style={{
            fontFamily: "var(--font-body), sans-serif",
            backgroundColor: "var(--color-bg-app)",
            color: "var(--color-text-primary)",
          }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

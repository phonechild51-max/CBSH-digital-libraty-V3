import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taking Quiz — CBSH Digital Library",
  description: "Answer questions in a timed quiz environment.",
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        {children}
      </div>
    </ClerkProvider>
  );
}

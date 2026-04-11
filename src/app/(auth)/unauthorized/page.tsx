import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Unauthorized — CBSH Digital Library",
  description: "You do not have permission to access this page.",
};

export default function UnauthorizedPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-6">
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8"
        style={{
          backgroundColor: "var(--color-accent-amber-glow)",
          border: "1px solid var(--color-accent-amber)",
        }}
      >
        <Lock size={44} style={{ color: "var(--color-accent-amber)" }} />
      </div>

      <h1
        className="text-4xl font-bold mb-3"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-text-heading)",
        }}
      >
        Access Denied
      </h1>

      <p
        className="text-base mb-8 max-w-sm text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        You don&apos;t have permission to access this page. Please contact an
        administrator if you believe this is an error.
      </p>

      <div className="flex gap-4">
        <SignOutButton>
          <button
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: "var(--color-accent-amber)",
              color: "#000",
            }}
          >
            Force Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}

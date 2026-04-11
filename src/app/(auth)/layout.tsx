import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — CBSH Digital Library",
  description: "Sign in to access the CBSH Digital Library academic platform.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      {children}
    </div>
  );
}

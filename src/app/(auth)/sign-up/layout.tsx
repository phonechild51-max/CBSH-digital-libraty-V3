import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — CBSH Digital Library",
  description: "Register for the CBSH Digital Library academic platform.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

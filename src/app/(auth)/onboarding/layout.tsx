import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Account — CBSH Digital Library",
  description: "Choose your role to complete your CBSH Digital Library account setup.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

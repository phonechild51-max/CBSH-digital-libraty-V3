"use client";

import { useTransition } from "react";
import { setRoleAction } from "./actions";
import { User, GraduationCap } from "lucide-react";

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition();

  const handleSelectRole = (role: "student" | "teacher") => {
    startTransition(async () => {
      try {
        await setRoleAction(role);
      } catch (err) {
        console.error("Failed to set role", err);
        alert("Something went wrong setting your role. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in-up">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Welcome to CBSH Digital Library
          </h1>
          <p
            className="text-lg"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Please tell us who you are so we can set up your account correctly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => handleSelectRole("student")}
            disabled={isPending}
            className="group relative flex flex-col items-center p-10 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ backgroundColor: "var(--color-accent-amber)" }}
            />
            
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: "var(--color-border-card)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <User size={36} style={{ color: "var(--color-text-primary)" }} />
            </div>
            
            <h3
              className="text-2xl font-semibold mb-3"
              style={{ color: "var(--color-text-heading)" }}
            >
              I am a Student
            </h3>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              Access study materials, take quizzes, and track your learning progress.
            </p>
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => handleSelectRole("teacher")}
            disabled={isPending}
            className="group relative flex flex-col items-center p-10 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-accent-amber)",
              boxShadow: "0 10px 40px -10px rgba(212, 146, 42, 0.15)",
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
              style={{ backgroundColor: "var(--color-accent-amber)" }}
            />
            
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: "var(--color-accent-amber-glow)",
                border: "1px solid var(--color-accent-amber)",
              }}
            >
              <GraduationCap size={36} style={{ color: "var(--color-accent-amber)" }} />
            </div>
            
            <h3
              className="text-2xl font-semibold mb-3"
              style={{ color: "var(--color-text-heading)" }}
            >
              I am a Teacher
            </h3>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              Manage study materials, create quizzes, and monitor student performance.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

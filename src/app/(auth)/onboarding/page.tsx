"use client";

import { useState, useTransition } from "react";
import { setRoleAction } from "./actions";
import { User, GraduationCap, CheckCircle, XCircle } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function OnboardingPage() {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [submittedRole, setSubmittedRole] = useState<"student" | "teacher" | null>(null);

  const status = user?.publicMetadata?.status as string | undefined;
  const requestedRole = (user?.publicMetadata?.requested_role || submittedRole) as string | undefined;

  const handleSelectRole = (role: "student" | "teacher") => {
    setSubmittedRole(role);
    startTransition(async () => {
      try {
        await setRoleAction(role);
      } catch (err) {
        console.error("Failed to set role", err);
        alert("Something went wrong setting your role. Please try again.");
        setSubmittedRole(null);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 animate-fade-in-up relative">
      <div className="w-full max-w-2xl relative z-10">
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
              border: submittedRole === "student" ? "1px solid var(--color-accent-amber)" : "1px solid var(--color-border-card)",
              boxShadow: submittedRole === "student" ? "0 10px 40px -10px rgba(212, 146, 42, 0.15)" : "none",
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ backgroundColor: "var(--color-accent-amber)" }}
            />
            
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: submittedRole === "student" ? "var(--color-accent-amber-glow)" : "var(--color-border-card)",
                border: submittedRole === "student" ? "1px solid var(--color-accent-amber)" : "1px solid var(--color-border-divider)",
              }}
            >
              <User size={36} style={{ color: submittedRole === "student" ? "var(--color-accent-amber)" : "var(--color-text-primary)" }} />
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
              border: submittedRole === "teacher" ? "1px solid var(--color-accent-amber)" : "1px solid var(--color-border-card)",
              boxShadow: submittedRole === "teacher" ? "0 10px 40px -10px rgba(212, 146, 42, 0.15)" : "none",
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
              style={{ backgroundColor: "var(--color-accent-amber)" }}
            />
            
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: submittedRole === "teacher" ? "var(--color-accent-amber-glow)" : "var(--color-border-card)",
                border: submittedRole === "teacher" ? "1px solid var(--color-accent-amber)" : "1px solid var(--color-border-divider)",
              }}
            >
              <GraduationCap size={36} style={{ color: submittedRole === "teacher" ? "var(--color-accent-amber)" : "var(--color-text-primary)" }} />
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

      {(status === "pending" || (!status && submittedRole)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div 
            className="p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-fade-in-up border"
            style={{ 
              backgroundColor: "var(--color-bg-card)",
              borderColor: "var(--color-border-card)"
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: "var(--color-accent-amber-glow)",
                border: "1px solid var(--color-accent-amber)"
              }}
            >
              <CheckCircle size={32} style={{ color: "var(--color-accent-amber)" }} />
            </div>
            <h3 
              className="text-2xl font-bold mb-3" 
              style={{ color: "var(--color-text-heading)", fontFamily: "var(--font-display)" }}
            >
              Request Submitted
            </h3>
            <p 
              className="mb-6 leading-relaxed" 
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your request to join as a <strong className="capitalize" style={{ color: "var(--color-accent-amber)" }}>{requestedRole || "user"}</strong> has been received. Please wait while an administrator approves your account.
            </p>
            <div className="flex justify-center mb-6">
              <div 
                className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "var(--color-border-divider)", borderTopColor: "var(--color-accent-amber)" }}
              ></div>
            </div>
            <SignOutButton>
              <button 
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
                style={{ backgroundColor: "var(--color-bg-input)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-input)" }}
              >
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}

      {status === "denied" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div 
            className="p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-fade-in-up border"
            style={{ 
              backgroundColor: "var(--color-bg-card)",
              borderColor: "var(--color-border-card)"
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: "var(--color-danger-subtle)",
                border: "1px solid var(--color-danger)"
              }}
            >
              <XCircle size={32} style={{ color: "var(--color-danger)" }} />
            </div>
            <h3 
              className="text-2xl font-bold mb-3" 
              style={{ color: "var(--color-text-heading)", fontFamily: "var(--font-display)" }}
            >
              Request Denied
            </h3>
            <p 
              className="mb-6 leading-relaxed" 
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your account approval request was denied by an administrator. Please contact support if you believe this is a mistake.
            </p>
            <SignOutButton>
              <button 
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 mx-auto"
                style={{
                  backgroundColor: "var(--color-danger)",
                  color: "#fff",
                }}
              >
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}

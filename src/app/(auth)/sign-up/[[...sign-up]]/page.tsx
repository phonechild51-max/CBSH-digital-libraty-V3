"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, BookOpen } from "lucide-react";

export default function SignUpPage() {
  const { theme, toggle } = useTheme();

  return (
    <>
      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="fixed top-6 right-6 z-50 p-2.5 rounded-full transition-all duration-200 hover:scale-110"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          color: "var(--color-accent-amber)",
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Left Panel — Decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background:
            "linear-gradient(135deg, var(--color-bg-sidebar) 0%, #1a1410 50%, var(--color-bg-app) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-su" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D4922A" strokeWidth="0.5" />
              </pattern>
              <pattern id="diamonds-su" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#D4922A" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-su)" />
            <rect width="100%" height="100%" fill="url(#diamonds-su)" />
          </svg>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background:
              "linear-gradient(to top, rgba(212,146,42,0.08), transparent)",
          }}
        />

        <div className="relative z-10 text-center max-w-md">
          <div
            className="mb-8 mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-accent-amber-glow)",
              border: "1px solid var(--color-accent-amber)",
            }}
          >
            <BookOpen size={36} style={{ color: "var(--color-accent-amber)" }} />
          </div>

          <h1
            className="text-5xl font-bold mb-4 leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-accent-amber)",
            }}
          >
            CBSH
          </h1>
          <h2
            className="text-2xl font-medium mb-6"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Digital Library
          </h2>

          <div
            className="w-16 h-px mx-auto mb-6"
            style={{ backgroundColor: "var(--color-accent-amber)" }}
          />

          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Join our academic community to access study materials, take quizzes,
            and collaborate with fellow students and teachers.
          </p>
        </div>
      </div>

      {/* Right Panel — Sign Up Form */}
      <div
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="mb-4 mx-auto w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-accent-amber-glow)",
                border: "1px solid var(--color-accent-amber)",
              }}
            >
              <BookOpen size={28} style={{ color: "var(--color-accent-amber)" }} />
            </div>
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-accent-amber)",
              }}
            >
              CBSH Digital Library
            </h1>
          </div>

          <h3
            className="text-2xl font-semibold mb-2 text-center lg:text-left"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Create your account
          </h3>
          <p
            className="mb-8 text-center lg:text-left"
            style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}
          >
            Sign up to get started
          </p>

          <div className="flex justify-center lg:justify-start">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full shadow-none",
                  card: "w-full shadow-none bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]",
                  formFieldLabel: "text-[var(--color-text-secondary)]",
                  formFieldInput:
                    "bg-[var(--color-bg-input)] border-[var(--color-border-input)] text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:ring-[var(--color-accent-amber-glow)]",
                  formButtonPrimary:
                    "bg-[var(--color-accent-amber)] hover:bg-[var(--color-accent-amber-pressed)] text-black font-semibold",
                  footerActionLink: "text-[var(--color-accent-amber)] hover:text-[var(--color-accent-amber-light)]",
                  identityPreviewEditButton: "text-[var(--color-accent-amber)]",
                  formFieldAction: "text-[var(--color-accent-amber)]",
                  footer: "hidden",
                },
              }}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/"
            />
          </div>

          <div
            className="mt-6 p-4 rounded-xl text-center text-sm"
            style={{
              backgroundColor: "var(--color-accent-amber-subtle)",
              border: "1px solid var(--color-border-card)",
              color: "var(--color-text-secondary)",
            }}
          >
            After signing up, an admin will review and approve your account.
          </div>
        </div>
      </div>
    </>
  );
}

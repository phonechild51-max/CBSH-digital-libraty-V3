import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { createServerClient } from "@/lib/supabase/server";
import { GraduationCap, Award, Download, Bookmark } from "lucide-react";

export default async function StudentProfilePage() {
  const { userId } = await auth();
  
  const sb = createServerClient();
  const { data: dbUser } = await sb.from("users").select("id").eq("insforge_uid", userId).single();
  
  let stats = {
    quizzesTaken: 0,
    averageScore: 0,
    downloads: 0,
    bookmarks: 0
  };

  if (dbUser) {
    const [quizRes, downloadsRes, bookmarksRes] = await Promise.all([
      sb.from("quiz_attempts").select("percentage", { count: "exact" }).eq("student_id", dbUser.id),
      sb.from("downloads").select("id", { count: "exact" }).eq("user_id", dbUser.id),
      sb.from("bookmarks").select("id", { count: "exact" }).eq("user_id", dbUser.id),
    ]);

    const attemptsCount = quizRes.count || 0;
    const percentages = quizRes.data?.map((a) => a.percentage) || [];
    const avgPct = percentages.length > 0 ? (percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;

    stats = {
      quizzesTaken: attemptsCount,
      averageScore: Math.round(avgPct),
      downloads: downloadsRes.count || 0,
      bookmarks: bookmarksRes.count || 0
    };
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          My Profile
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          View your academic statistics and manage your account.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Quizzes Taken",
            value: stats.quizzesTaken,
            icon: GraduationCap,
          },
          {
            label: "Avg. Score",
            value: `${stats.averageScore}%`,
            icon: Award,
          },
          {
            label: "Downloads",
            value: stats.downloads,
            icon: Download,
          },
          {
            label: "Bookmarks",
            value: stats.bookmarks,
            icon: Bookmark,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {stat.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                {stat.value}
              </p>
            </div>
            <div
              className="p-3 rounded-xl flex-shrink-0"
              style={{
                backgroundColor: "var(--color-accent-amber-glow)",
                color: "var(--color-accent-amber)",
              }}
            >
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <UserProfile 
          routing="hash"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#D97706",
              colorBackground: "#18181b",
              colorInputBackground: "#27272a",
              colorInputText: "#f4f4f5",
            }
          }}
        />
      </div>
    </div>
  );
}

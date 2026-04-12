import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { createServerClient } from "@/lib/supabase/server";
import { Upload, FileText, ClipboardList, TrendingUp } from "lucide-react";

export default async function TeacherProfilePage() {
  const { userId } = await auth();
  
  const sb = createServerClient();
  const { data: dbUser } = await sb.from("users").select("id").eq("insforge_uid", userId).single();
  
  let stats = {
    materialsUploaded: 0,
    quizzesCreated: 0,
    totalDownloads: 0,
    studentsAssessed: 0
  };

  if (dbUser) {
    const [matsRes, quizRes] = await Promise.all([
      sb.from("materials").select("id, download_count").eq("uploaded_by", dbUser.id),
      sb.from("quizzes").select("id").eq("created_by", dbUser.id),
    ]);

    const downloads = matsRes.data?.reduce((acc, mat) => acc + (mat.download_count || 0), 0) || 0;

    let studentsAssessed = 0;
    if (quizRes.data && quizRes.data.length > 0) {
      const quizIds = quizRes.data.map(q => q.id);
      const attemptsRes = await sb.from("quiz_attempts").select("student_id").in("quiz_id", quizIds);
      if (attemptsRes.data) {
        const uniqueStudents = new Set(attemptsRes.data.map(a => a.student_id));
        studentsAssessed = uniqueStudents.size;
      }
    }

    stats = {
      materialsUploaded: matsRes.data?.length || 0,
      quizzesCreated: quizRes.data?.length || 0,
      totalDownloads: downloads,
      studentsAssessed
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
          Manage your account and view the impact of your materials.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Materials Uploaded",
            value: stats.materialsUploaded,
            icon: Upload,
          },
          {
            label: "Total Downloads",
            value: stats.totalDownloads,
            icon: FileText,
          },
          {
            label: "Quizzes Created",
            value: stats.quizzesCreated,
            icon: ClipboardList,
          },
          {
            label: "Students Assessed",
            value: stats.studentsAssessed,
            icon: TrendingUp,
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

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.publicMetadata?.role as string | undefined;

  switch (role) {
    case "admin":
      redirect("/admin/dashboard");
    case "teacher":
      redirect("/teacher/dashboard");
    case "student":
      redirect("/student/dashboard");
    default:
      // No role assigned yet (pending approval)
      redirect("/unauthorized");
  }
}

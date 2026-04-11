import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (user?.publicMetadata?.role !== "teacher") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

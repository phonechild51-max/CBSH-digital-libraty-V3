import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (user?.publicMetadata?.role !== "student") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

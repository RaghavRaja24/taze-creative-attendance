import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  redirect(session.user.role === "ADMIN" ? "/admin" : "/employee");
}

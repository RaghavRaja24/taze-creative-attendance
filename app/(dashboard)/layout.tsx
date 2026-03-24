import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
      <Sidebar role={session.user.role} />
      <div className="flex-1 space-y-6">
        <DashboardHeader
          email={session.user.email ?? ""}
          name={session.user.name ?? "Team Member"}
          roleLabel={session.user.role === "ADMIN" ? "Admin Dashboard" : "Employee Dashboard"}
        />
        {children}
      </div>
    </div>
  );
}

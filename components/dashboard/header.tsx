"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type DashboardHeaderProps = {
  name: string;
  email: string;
  roleLabel: string;
};

export function DashboardHeader({ name, email, roleLabel }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border bg-card/90 p-5 shadow-soft backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{roleLabel}</p>
        <h2 className="mt-1 text-3xl font-semibold">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-secondary"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          type="button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}

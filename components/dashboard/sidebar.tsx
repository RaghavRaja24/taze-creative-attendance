"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  LayoutGrid,
  ReceiptIndianRupee,
  MonitorSmartphone,
  ShieldCheck,
  SunMedium,
  Users,
} from "lucide-react";
import type { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: Role;
};

const nav = {
  ADMIN: [
    { href: "/admin", label: "Overview", icon: ShieldCheck },
    { href: "/admin/team", label: "Team", icon: Users },
    { href: "/admin/terminal", label: "Terminal", icon: MonitorSmartphone },
    { href: "/admin/leave", label: "Leave Queue", icon: ClipboardCheck },
    { href: "/admin/balances", label: "Balances", icon: BadgeCheck },
    { href: "/admin/payslips", label: "Payslips", icon: ReceiptIndianRupee },
    { href: "/admin/holidays", label: "Holidays", icon: SunMedium },
  ],
  EMPLOYEE: [
    { href: "/employee", label: "Overview", icon: LayoutGrid },
    { href: "/employee/check-in", label: "Check-In", icon: BriefcaseBusiness },
    { href: "/employee/history", label: "History", icon: ClipboardCheck },
    { href: "/employee/calendar", label: "Calendar", icon: CalendarDays },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-72 flex-col gap-6 rounded-[2rem] border bg-card/90 p-6 shadow-soft backdrop-blur xl:flex">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            T
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Attendance OS</p>
            <h1 className="text-2xl font-semibold">Taze Creative</h1>
          </div>
        </div>
        <Card className="rounded-[1.5rem] border-0 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-white/75">Access</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">{role === "ADMIN" ? "Admin" : "Employee"} Portal</p>
              <p className="mt-1 text-sm text-white/80">Daily attendance, leave approvals, and monthly insights.</p>
            </div>
            <Badge className="bg-white/20 text-white" tone="default">
              Small Team
            </Badge>
          </div>
        </Card>
      </div>

      <nav className="space-y-2">
        {nav[role].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-dashed border-border bg-background/70 p-5 text-sm text-muted-foreground">
        Attendance is auto-treated as absent on past working days with no check-in, no approved leave, and no holiday.
      </div>
    </aside>
  );
}

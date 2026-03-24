import Link from "next/link";

import { AttendanceCalendar } from "@/components/dashboard/calendar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { assignManualAttendanceAction } from "@/lib/actions";
import { buildCalendar, getDashboardMetrics, getMonthlyAttendanceSummary } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { formatDate, formatTime } from "@/lib/utils";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const { users, attendanceRecords, leaveRequests, holidays, currentFinancialYear } = await getAdminDashboardData();

  const metrics = getDashboardMetrics({
    attendanceRecords: users.flatMap((user) => user.attendanceRecords),
    leaveRequests: users.flatMap((user) => user.leaveRequests),
    holidays,
  });
  const monthlySummary = getMonthlyAttendanceSummary(users.flatMap((user) => user.attendanceRecords)).slice(-3).reverse();
  const calendar = buildCalendar({
    attendanceRecords: users[0]?.attendanceRecords ?? [],
    leaveRequests: users[0]?.leaveRequests ?? [],
    holidays,
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard hint="Approved team members" label="Employees" value={users.length} />
        <StatCard hint="Across all recorded data" label="Present Days" value={metrics.presentDays} />
        <StatCard hint="Approved leave business days" label="Leaves Taken" value={metrics.leaveDays} />
        <StatCard hint={`${currentFinancialYear} holiday calendar`} label="Holidays" value={holidays.length} />
      </section>

      <MinimizableSection
        title="Workplace Overview"
        description="Run attendance, leave, and policy changes from focused pages."
      >
        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Workspace Overview</p>
          <h3 className="mt-1 text-3xl font-semibold">Run attendance, leave, and policy changes from focused pages</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            The dashboard is now split into clearer routes so admins can manage team setup, leave queues, balances,
            and holidays without scrolling through a single long screen.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link href="/admin/team" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="text-sm font-semibold">Team Management</p>
              <p className="mt-2 text-sm text-muted-foreground">Add employees, update roles, and review member access.</p>
            </Link>
            <Link href="/admin/leave" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="text-sm font-semibold">Leave Queue</p>
              <p className="mt-2 text-sm text-muted-foreground">Approve, archive, assign, or review leave requests.</p>
            </Link>
            <Link href="/admin/balances" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="text-sm font-semibold">Leave Balances</p>
              <p className="mt-2 text-sm text-muted-foreground">Track usage bars and financial-year history per employee.</p>
            </Link>
            <Link href="/admin/holidays" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="text-sm font-semibold">Holiday Calendar</p>
              <p className="mt-2 text-sm text-muted-foreground">Set financial-year holidays and preview calendar impact.</p>
            </Link>
          </div>
        </Card>
      </MinimizableSection>

      <MinimizableSection
        title="Calendar Preview"
        description="Wider calendar layout for a cleaner attendance snapshot."
      >
        <AttendanceCalendar label={`${users[0]?.name ?? "Team"} calendar preview`} days={calendar.days} />
      </MinimizableSection>

      <MinimizableSection
        title="Operations"
        description="Manual attendance overrides and the latest movement across the team."
      >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ActionForm action={assignManualAttendanceAction} className="space-y-4 rounded-[2rem] border bg-card/90 p-6 shadow-soft">
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Manual Attendance</p>
              <h3 className="mt-1 text-2xl font-semibold">Quick override</h3>
            </div>
            <Input name="userId" placeholder="Paste employee id" required />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="date" required type="date" />
              <Input name="checkInAt" required type="time" />
              <Input name="checkOutAt" type="time" />
            </div>
            <Textarea name="note" placeholder="Optional note" />
            <SubmitButton className="w-full">Save manual attendance</SubmitButton>
          </>
        </ActionForm>

        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Recent Attendance</p>
              <h3 className="mt-1 text-2xl font-semibold">Latest employee movement</h3>
            </div>
            <Badge tone="info">{attendanceRecords.length} entries</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {attendanceRecords.slice(0, 8).map((record) => (
              <div key={record.id} className="rounded-[1.5rem] border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{record.user.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(record.date)}</p>
                  </div>
                  <Badge tone={record.late ? "warning" : "success"}>{record.late ? "Late" : "Present"}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Check-in {record.checkInAt ? formatTime(record.checkInAt) : "N/A"} • Check-out{" "}
                  {record.checkOutAt ? formatTime(record.checkOutAt) : "Pending"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
      </MinimizableSection>

      <MinimizableSection title="Monthly Summary" description="Recent attendance trend and pending leave volume.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Monthly Summary</p>
            <h3 className="mt-1 text-2xl font-semibold">Recent attendance trend</h3>
          </div>
          <Badge tone="warning">{leaveRequests.filter((leave) => leave.status === "PENDING" && !leave.isArchived).length} pending leaves</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {monthlySummary.map((item) => (
            <div key={item.month} className="rounded-[1.5rem] border bg-background/70 p-4">
              <p className="font-medium">{item.month}</p>
              <p className="mt-3 text-3xl font-semibold">{item.present}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.late} late marks recorded</p>
            </div>
          ))}
        </div>
      </Card>
      </MinimizableSection>
    </div>
  );
}

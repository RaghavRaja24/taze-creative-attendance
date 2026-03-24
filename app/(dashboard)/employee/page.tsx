import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requestLeaveAction } from "@/lib/actions";
import { getDashboardMetrics, getFinancialYearLeaveBalances } from "@/lib/attendance";
import { requireUser } from "@/lib/auth";
import { getEmployeeDashboardData } from "@/lib/dashboard-data";
import { LeaveType } from "@prisma/client";

export default async function EmployeeOverviewPage() {
  const session = await requireUser();
  const { user, holidays, currentFinancialYear } = await getEmployeeDashboardData(session.user.id);

  const metrics = getDashboardMetrics({
    attendanceRecords: user.attendanceRecords,
    leaveRequests: user.leaveRequests,
    holidays,
  });
  const leaveBalances = getFinancialYearLeaveBalances({
    leaveRequests: user.leaveRequests,
    holidays,
    financialYear: currentFinancialYear,
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard hint="All recorded present days" label="Present Days" value={metrics.presentDays} />
        <StatCard hint="Approved leave business days" label="Leaves Taken" value={metrics.leaveDays} />
        <StatCard hint={`${leaveBalances.CASUAL.used}/12 booked this FY`} label="Casual Left" value={leaveBalances.CASUAL.remaining} />
        <StatCard hint={`${leaveBalances.SICK.used}/12 booked this FY`} label="Sick Left" value={leaveBalances.SICK.remaining} />
      </section>

      <MinimizableSection title="Workspace Overview" description="Focused employee pages for check-in, history, and calendar.">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Employee Workspace</p>
          <h3 className="mt-1 text-3xl font-semibold">Use focused pages for check-in, history, and calendar</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/employee/check-in" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="font-semibold">Check-In Page</p>
              <p className="mt-2 text-sm text-muted-foreground">Punch in or out quickly and see logged hours.</p>
            </Link>
            <Link href="/employee/history" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="font-semibold">History</p>
              <p className="mt-2 text-sm text-muted-foreground">Review recent attendance and leave request status.</p>
            </Link>
            <Link href="/employee/calendar" className="rounded-[1.5rem] border bg-background/70 p-5 transition hover:bg-secondary/60">
              <p className="font-semibold">Calendar</p>
              <p className="mt-2 text-sm text-muted-foreground">See month-level attendance, holidays, and leave at a glance.</p>
            </Link>
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Leave Balance</p>
          <h3 className="mt-1 text-2xl font-semibold">Financial year {currentFinancialYear}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Casual Leave</p>
              <p className="mt-2 text-2xl font-semibold">{leaveBalances.CASUAL.remaining} days left</p>
              <p className="mt-1 text-sm text-muted-foreground">{leaveBalances.CASUAL.used} booked this FY</p>
            </div>
            <div className="rounded-[1.25rem] border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sick Leave</p>
              <p className="mt-2 text-2xl font-semibold">{leaveBalances.SICK.remaining} days left</p>
              <p className="mt-1 text-sm text-muted-foreground">{leaveBalances.SICK.used} booked this FY</p>
            </div>
          </div>
        </Card>
      </section>
      </MinimizableSection>

      <MinimizableSection title="Leave Request" description="Apply for leave directly from the overview page.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Leave Request</p>
            <h3 className="mt-1 text-2xl font-semibold">Apply for leave</h3>
          </div>
          <Badge tone="info">{holidays.length} holidays configured</Badge>
        </div>
        <ActionForm action={requestLeaveAction} className="mt-5 space-y-4">
          <>
            <Select defaultValue={LeaveType.CASUAL} name="type">
              <option value={LeaveType.CASUAL}>Casual Leave</option>
              <option value={LeaveType.SICK}>Sick Leave</option>
              <option value={LeaveType.PAID}>Paid Leave</option>
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="startDate" required type="date" />
              <Input name="endDate" required type="date" />
            </div>
            <Textarea name="reason" placeholder="Reason for leave" required />
            <SubmitButton className="w-full">Submit request</SubmitButton>
          </>
        </ActionForm>
      </Card>
      </MinimizableSection>
    </div>
  );
}

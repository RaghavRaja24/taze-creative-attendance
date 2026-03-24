import { CheckInHours } from "@/components/dashboard/checkin-hours";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { SubmitButton } from "@/components/ui/submit-button";
import { checkInAction, checkOutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getEmployeeDashboardData } from "@/lib/dashboard-data";
import { getDayKey, todayKey } from "@/lib/time";
import { formatDateTime } from "@/lib/utils";

export default async function EmployeeCheckInPage() {
  const session = await requireUser();
  const { user } = await getEmployeeDashboardData(session.user.id);
  const todayRecord = user.attendanceRecords.find((record) => getDayKey(record.date) === todayKey());

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          hint={todayRecord?.checkInAt ? formatDateTime(todayRecord.checkInAt) : "No check-in yet"}
          label="Check-In"
          value={todayRecord?.checkInAt ? "Done" : "Open"}
        />
        <StatCard
          hint={todayRecord?.checkOutAt ? formatDateTime(todayRecord.checkOutAt) : "Still working or not logged off"}
          label="Check-Out"
          value={todayRecord?.checkOutAt ? "Done" : "Pending"}
        />
        <StatCard
          hint="Live duration for today"
          label="Hours Logged"
          value={<CheckInHours checkInAt={todayRecord?.checkInAt?.toISOString() ?? null} checkOutAt={todayRecord?.checkOutAt?.toISOString() ?? null} />}
        />
      </section>

      <MinimizableSection title="Check-In Station" description="Fast attendance actions and live logged hours.">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-white/75">Daily Check-In</p>
          <h3 className="mt-2 text-4xl font-semibold">Punch in and log off without digging through the dashboard</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/85">
            Use this page as your daily attendance station. The logged-hours card updates from your check-in until you
            log off.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge className="bg-white/20 text-white">Fast access</Badge>
            <Badge className="bg-white/20 text-white">Hours tracked</Badge>
            <Badge className="bg-white/20 text-white">No extra clicks</Badge>
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ActionForm action={checkInAction} className="rounded-[1.5rem] border bg-background/70 p-5">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">Start day</p>
                  <p className="text-sm text-muted-foreground">
                    {todayRecord?.checkInAt ? `Checked in at ${formatDateTime(todayRecord.checkInAt)}` : "Ready to clock in"}
                  </p>
                </div>
                <SubmitButton className="w-full" disabled={Boolean(todayRecord?.checkInAt)} pendingLabel="Checking in...">
                  Check in
                </SubmitButton>
              </div>
            </ActionForm>

            <ActionForm action={checkOutAction} className="rounded-[1.5rem] border bg-background/70 p-5">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">End day</p>
                  <p className="text-sm text-muted-foreground">
                    {todayRecord?.checkOutAt ? `Checked out at ${formatDateTime(todayRecord.checkOutAt)}` : "Log off when your workday is done"}
                  </p>
                </div>
                <SubmitButton
                  className="w-full"
                  disabled={!todayRecord?.checkInAt || Boolean(todayRecord?.checkOutAt)}
                  pendingLabel="Checking out..."
                  variant="secondary"
                >
                  Log off
                </SubmitButton>
              </div>
            </ActionForm>
          </div>

          <div className="mt-6 rounded-[1.5rem] border bg-background/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge tone={todayRecord?.late ? "warning" : "success"}>
                {todayRecord?.late ? "Late Check-In" : "On Time / Pending"}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Logged hours:{" "}
              <span className="font-medium text-foreground">
                <CheckInHours checkInAt={todayRecord?.checkInAt?.toISOString() ?? null} checkOutAt={todayRecord?.checkOutAt?.toISOString() ?? null} />
              </span>
            </p>
          </div>
        </Card>
      </section>
      </MinimizableSection>
    </div>
  );
}

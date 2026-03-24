import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm } from "@/components/forms/action-form";
import { KioskToggle } from "@/components/dashboard/kiosk-toggle";
import { adminCheckInEmployeeAction, adminCheckOutEmployeeAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getDayKey, todayKey } from "@/lib/time";
import { formatDateTime } from "@/lib/utils";
import { CheckInHours } from "@/components/dashboard/checkin-hours";

export default async function AdminTerminalPage() {
  await requireAdmin();
  const { users } = await getAdminDashboardData();
  const today = todayKey();

  const employeeRows = users
    .filter((user) => user.role === "EMPLOYEE")
    .map((user) => {
      const todayRecord = user.attendanceRecords.find((record) => getDayKey(record.date) === today);
      return { user, todayRecord };
    });

  return (
    <div className="space-y-6" data-kiosk-root>
      <section className="flex flex-col gap-4 rounded-[2rem] border bg-card/80 p-5 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Attendance Station</p>
          <h2 className="mt-1 text-2xl font-semibold">Admin quick terminal</h2>
        </div>
        <KioskToggle />
      </section>

      <MinimizableSection title="Quick Terminal Controls" description="Fast admin check-in and log-off tools for employees.">
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-white/65">Admin Quick Terminal</p>
          <h3 className="mt-2 text-4xl font-semibold">Check employees in or log them off from one screen</h3>
          <p className="mt-4 text-sm leading-6 text-white/80">
            This page is built for fast attendance operations when an admin needs to help the team clock in, clock out,
            or confirm who is still active today.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge className="bg-white/15 text-white">Fast check-in</Badge>
            <Badge className="bg-white/15 text-white">Live hours</Badge>
            <Badge className="bg-white/15 text-white">Admin only</Badge>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <ActionForm action={adminCheckInEmployeeAction} className="space-y-4 rounded-[2rem] border bg-card/90 p-6 shadow-soft">
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Check-In Terminal</p>
                <h3 className="mt-1 text-2xl font-semibold">Mark employee check-in</h3>
              </div>
              <Select name="userId" required>
                <option value="">Select employee</option>
                {employeeRows.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
              <SubmitButton className="w-full">Check in employee</SubmitButton>
            </>
          </ActionForm>

          <ActionForm action={adminCheckOutEmployeeAction} className="space-y-4 rounded-[2rem] border bg-card/90 p-6 shadow-soft">
            <>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Log Off Terminal</p>
                <h3 className="mt-1 text-2xl font-semibold">Mark employee check-out</h3>
              </div>
              <Select name="userId" required>
                <option value="">Select employee</option>
                {employeeRows.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
              <SubmitButton className="w-full" variant="secondary">
                Log off employee
              </SubmitButton>
            </>
          </ActionForm>
        </div>
      </section>
      </MinimizableSection>

      <MinimizableSection title="Today’s Team Status" description="Per-employee status cards with one-click actions and logged hours.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Today’s Team Status</p>
            <h3 className="mt-1 text-2xl font-semibold">Who is in, who is out, and hours logged</h3>
          </div>
          <Badge tone="info">{employeeRows.length} employees</Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employeeRows.map(({ user, todayRecord }) => (
            <div key={user.id} className="rounded-[1.5rem] border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge
                  tone={
                    todayRecord?.checkOutAt ? "default" : todayRecord?.checkInAt ? (todayRecord.late ? "warning" : "success") : "danger"
                  }
                >
                  {todayRecord?.checkOutAt ? "Logged Off" : todayRecord?.checkInAt ? "Checked In" : "Not Marked"}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Check-in: {todayRecord?.checkInAt ? formatDateTime(todayRecord.checkInAt) : "-"}</p>
                <p>Check-out: {todayRecord?.checkOutAt ? formatDateTime(todayRecord.checkOutAt) : "-"}</p>
                <p>
                  Hours logged:{" "}
                  <span className="font-medium text-foreground">
                    <CheckInHours
                      checkInAt={todayRecord?.checkInAt?.toISOString() ?? null}
                      checkOutAt={todayRecord?.checkOutAt?.toISOString() ?? null}
                    />
                  </span>
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ActionForm action={adminCheckInEmployeeAction}>
                  <>
                    <input name="userId" type="hidden" value={user.id} />
                    <SubmitButton className="w-full" disabled={Boolean(todayRecord?.checkInAt)} pendingLabel="Checking in...">
                      One-click check in
                    </SubmitButton>
                  </>
                </ActionForm>

                <ActionForm action={adminCheckOutEmployeeAction}>
                  <>
                    <input name="userId" type="hidden" value={user.id} />
                    <SubmitButton
                      className="w-full"
                      disabled={!todayRecord?.checkInAt || Boolean(todayRecord?.checkOutAt)}
                      pendingLabel="Logging off..."
                      variant="secondary"
                    >
                      One-click log off
                    </SubmitButton>
                  </>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </MinimizableSection>
    </div>
  );
}

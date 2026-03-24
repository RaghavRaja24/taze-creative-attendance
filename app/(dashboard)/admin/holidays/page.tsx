import { AttendanceCalendar } from "@/components/dashboard/calendar";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { SubmitButton } from "@/components/ui/submit-button";
import { createHolidayAction, removeHolidayAction } from "@/lib/actions";
import { buildCalendar } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/utils";

export default async function AdminHolidaysPage() {
  await requireAdmin();
  const { users, holidays, currentFinancialYear } = await getAdminDashboardData();
  const financialYearHolidays = holidays.filter((holiday) => holiday.financialYear === currentFinancialYear);
  const calendar = buildCalendar({
    attendanceRecords: users[0]?.attendanceRecords ?? [],
    leaveRequests: users[0]?.leaveRequests ?? [],
    holidays,
  });

  return (
    <div className="space-y-6">
      <MinimizableSection title="Holiday Calendar" description="Manage financial-year holidays and preview their calendar impact.">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Holiday Calendar</p>
          <h3 className="mt-1 text-2xl font-semibold">Add holidays for a financial year</h3>
          <p className="mt-2 text-sm text-muted-foreground">Financial year is calculated automatically from the holiday date.</p>
          <ActionForm action={createHolidayAction} className="mt-5 space-y-4">
            <>
              <Input name="name" placeholder="Holiday name" required />
              <Input name="date" required type="date" />
              <SubmitButton className="w-full">Add holiday</SubmitButton>
            </>
          </ActionForm>
        </Card>

        <AttendanceCalendar label={`${users[0]?.name ?? "Team"} holiday preview`} days={calendar.days} />
      </section>
      </MinimizableSection>

      <MinimizableSection title="Holiday List" description="Current financial-year holiday records.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Financial Year Holidays</p>
            <h3 className="mt-1 text-2xl font-semibold">{currentFinancialYear}</h3>
          </div>
          <Badge tone="info">{financialYearHolidays.length} Holidays</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {financialYearHolidays.map((holiday) => (
            <div key={holiday.id} className="flex items-center justify-between rounded-[1.5rem] border bg-background/70 p-4">
              <div>
                <p className="font-medium">{holiday.name}</p>
                <p className="text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
              </div>
              <ActionForm action={removeHolidayAction}>
                <>
                  <input name="holidayId" type="hidden" value={holiday.id} />
                  <SubmitButton pendingLabel="Removing..." size="sm" variant="destructive" confirmMessage="Remove this holiday from the financial year calendar?">
                    Remove
                  </SubmitButton>
                </>
              </ActionForm>
            </div>
          ))}
        </div>
      </Card>
      </MinimizableSection>
    </div>
  );
}

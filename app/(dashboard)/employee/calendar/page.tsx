import { AttendanceCalendar } from "@/components/dashboard/calendar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { buildCalendar } from "@/lib/attendance";
import { requireUser } from "@/lib/auth";
import { getEmployeeDashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/utils";

export default async function EmployeeCalendarPage() {
  const session = await requireUser();
  const { user, holidays, currentFinancialYear } = await getEmployeeDashboardData(session.user.id);
  const calendar = buildCalendar({
    attendanceRecords: user.attendanceRecords,
    leaveRequests: user.leaveRequests,
    holidays,
  });
  const upcomingHolidays = holidays.slice(0, 6);

  return (
    <div className="space-y-6">
      <MinimizableSection title="Monthly Calendar" description="Switch between month, week, and list views.">
        <AttendanceCalendar label={calendar.label} days={calendar.days} />
      </MinimizableSection>
      <MinimizableSection title="Upcoming Holidays" description="Configured holiday list for the current financial year.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Upcoming Holidays</p>
            <h3 className="mt-1 text-2xl font-semibold">Financial year {currentFinancialYear}</h3>
          </div>
          <Badge tone="info">{upcomingHolidays.length} listed</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingHolidays.map((holiday) => (
            <div key={holiday.id} className="rounded-[1.5rem] border bg-background/70 p-4">
              <p className="font-medium">{holiday.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
              <p className="mt-1 text-xs text-muted-foreground">FY {holiday.financialYear}</p>
            </div>
          ))}
        </div>
      </Card>
      </MinimizableSection>
    </div>
  );
}

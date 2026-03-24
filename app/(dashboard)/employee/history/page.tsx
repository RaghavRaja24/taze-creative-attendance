import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { buildCalendar, getPast30DaySnapshot } from "@/lib/attendance";
import { requireUser } from "@/lib/auth";
import { getEmployeeDashboardData } from "@/lib/dashboard-data";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function EmployeeHistoryPage() {
  const session = await requireUser();
  const { user, holidays } = await getEmployeeDashboardData(session.user.id);
  const timeline = getPast30DaySnapshot({
    attendanceRecords: user.attendanceRecords,
    leaveRequests: user.leaveRequests,
    holidays,
  });
  const activeLeaveRequests = user.leaveRequests.filter((leave) => !leave.isArchived);

  return (
    <div className="space-y-6">
      <MinimizableSection title="Attendance History" description="Recent working days and recorded check-in/check-out history.">
      <Card className="rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Attendance History</p>
            <h3 className="mt-1 text-2xl font-semibold">Recent working days</h3>
          </div>
          <Badge tone="info">Last 30 days</Badge>
        </div>
        <div className="mt-5 overflow-hidden rounded-[1.5rem] border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-secondary/70 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeline.map((day) => (
                <tr key={day.key}>
                  <td className="px-4 py-3">{formatDate(day.date)}</td>
                  <td className="px-4 py-3">{day.status}</td>
                  <td className="px-4 py-3">{day.checkInAt ? formatDateTime(day.checkInAt) : "-"}</td>
                  <td className="px-4 py-3">{day.checkOutAt ? formatDateTime(day.checkOutAt) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </MinimizableSection>

      <MinimizableSection title="Leave Status" description="Track active leave requests and review outcomes.">
      <Card className="rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Leave Status</p>
        <h3 className="mt-1 text-2xl font-semibold">Track requests</h3>
        <div className="mt-5 space-y-4">
          {activeLeaveRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            activeLeaveRequests.map((leave) => (
              <div key={leave.id} className="rounded-[1.5rem] border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{leave.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                    </p>
                  </div>
                  <Badge tone={leave.status === "APPROVED" ? "success" : leave.status === "REJECTED" ? "danger" : "warning"}>
                    {leave.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm">{leave.reason}</p>
                {leave.reviewNote ? <p className="mt-2 text-xs text-muted-foreground">{leave.reviewNote}</p> : null}
              </div>
            ))
          )}
        </div>
      </Card>
      </MinimizableSection>
    </div>
  );
}

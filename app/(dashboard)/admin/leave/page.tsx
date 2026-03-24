import { LeaveStatus, LeaveType } from "@prisma/client";

import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { archiveLeaveRequestAction, assignLeaveByAdminAction, reviewLeaveAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { getFinancialYearLabel } from "@/lib/time";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function AdminLeavePage() {
  await requireAdmin();
  const { users, leaveRequests } = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <MinimizableSection title="Leave Queue" description="Approve, archive, and assign leave from one focused page.">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Leave Workflow</p>
              <h3 className="mt-1 text-2xl font-semibold">Approve, archive, or review requests</h3>
            </div>
            <Badge tone="warning">{leaveRequests.filter((leave) => leave.status === LeaveStatus.PENDING && !leave.isArchived).length} Pending</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {leaveRequests.map((leave) => (
              <div key={leave.id} className="rounded-[1.75rem] border bg-background/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{leave.user.name}</p>
                      <Badge tone={leave.isArchived ? "default" : leave.status === LeaveStatus.APPROVED ? "success" : leave.status === LeaveStatus.REJECTED ? "danger" : "warning"}>
                        {leave.isArchived ? "ARCHIVED" : leave.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {leave.type} • {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                    </p>
                    <p className="mt-3 text-sm">{leave.reason}</p>
                    {leave.reviewedBy ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Reviewed by {leave.reviewedBy.name} on {formatDateTime(leave.reviewedAt ?? leave.updatedAt)}
                      </p>
                    ) : null}
                    {leave.isArchived && leave.archivedAt ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Archived by {leave.archivedBy?.name ?? "Admin"} on {formatDateTime(leave.archivedAt)}
                        {leave.archiveReason ? ` • ${leave.archiveReason}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">FY {getFinancialYearLabel(leave.startDate)}</p>
                  </div>

                  <div className="w-full max-w-md space-y-3">
                    {leave.status === LeaveStatus.PENDING && !leave.isArchived ? (
                      <ActionForm action={reviewLeaveAction} className="space-y-3">
                        <>
                          <input name="leaveId" type="hidden" value={leave.id} />
                          <Textarea name="reviewNote" placeholder="Optional review note" />
                          <div className="flex gap-2">
                            <Button className="flex-1" name="decision" type="submit" value={LeaveStatus.APPROVED}>
                              Approve
                            </Button>
                            <Button className="flex-1" name="decision" type="submit" value={LeaveStatus.REJECTED} variant="outline">
                              Reject
                            </Button>
                          </div>
                        </>
                      </ActionForm>
                    ) : null}
                    {!leave.isArchived ? (
                      <ActionForm action={archiveLeaveRequestAction} className="space-y-3">
                        <>
                          <input name="leaveId" type="hidden" value={leave.id} />
                          <Textarea name="archiveReason" placeholder="Reason for archiving (optional)" />
                          <SubmitButton
                            className="w-full"
                            pendingLabel="Archiving..."
                            variant="destructive"
                            confirmMessage="Archive this leave request? It will stay in audit history but stop counting in balances."
                          >
                            Archive Leave
                          </SubmitButton>
                        </>
                      </ActionForm>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Admin Assigned Leave</p>
          <h3 className="mt-1 text-2xl font-semibold">Add leave on behalf of employees</h3>
          <ActionForm action={assignLeaveByAdminAction} className="mt-5 space-y-4">
            <>
              <Select name="userId" required>
                <option value="">Select employee</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
              <Select defaultValue={LeaveType.CASUAL} name="type">
                <option value={LeaveType.CASUAL}>Casual Leave</option>
                <option value={LeaveType.SICK}>Sick Leave</option>
                <option value={LeaveType.PAID}>Paid Leave</option>
              </Select>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="startDate" required type="date" />
                <Input name="endDate" required type="date" />
              </div>
              <Textarea name="reason" placeholder="Reason" required />
              <SubmitButton className="w-full">Assign leave</SubmitButton>
            </>
          </ActionForm>
        </Card>
      </section>
      </MinimizableSection>
    </div>
  );
}

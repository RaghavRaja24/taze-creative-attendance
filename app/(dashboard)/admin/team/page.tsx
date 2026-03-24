import { Role } from "@prisma/client";

import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createEmployeeAction, removeEmployeeAction, updateUserRoleAction } from "@/lib/actions";
import { getDashboardMetrics, getFinancialYearLeaveBalances } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";

export default async function AdminTeamPage() {
  await requireAdmin();
  const { users, holidays, currentFinancialYear } = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <MinimizableSection title="Team Management" description="Approve new members and manage roles or access.">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <ActionForm action={createEmployeeAction} className="space-y-4 rounded-[2rem] border bg-card/90 p-6 shadow-soft">
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Add Employee</p>
              <h3 className="mt-1 text-2xl font-semibold">Approve a new team member</h3>
            </div>
            <Input name="name" placeholder="Full name" required />
            <Input name="email" placeholder="name@tazecreative.com" required type="email" />
            <Select defaultValue={Role.EMPLOYEE} name="role">
              <option value={Role.EMPLOYEE}>Employee</option>
              <option value={Role.ADMIN}>Admin</option>
            </Select>
            <SubmitButton className="w-full">Add employee</SubmitButton>
          </>
        </ActionForm>

        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Directory</p>
              <h3 className="mt-1 text-2xl font-semibold">Manage roles and access</h3>
            </div>
            <Badge tone="info">{users.length} Members</Badge>
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.5rem] border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-secondary/70 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
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
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <ActionForm action={updateUserRoleAction} className="flex gap-2">
                          <>
                            <input name="userId" type="hidden" value={user.id} />
                            <Select className="min-w-36" defaultValue={user.role} name="role">
                              <option value={Role.ADMIN}>Admin</option>
                              <option value={Role.EMPLOYEE}>Employee</option>
                            </Select>
                            <SubmitButton pendingLabel="Updating..." size="sm">
                              Update
                            </SubmitButton>
                          </>
                        </ActionForm>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {metrics.presentDays} present, {metrics.leaveDays} leaves
                        <div className="mt-1 text-xs">
                          Casual left: {leaveBalances.CASUAL.remaining} • Sick left: {leaveBalances.SICK.remaining}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ActionForm action={removeEmployeeAction}>
                          <>
                            <input name="userId" type="hidden" value={user.id} />
                            <SubmitButton pendingLabel="Removing..." size="sm" variant="destructive" confirmMessage="Remove this employee and all linked attendance data?">
                              Remove
                            </SubmitButton>
                          </>
                        </ActionForm>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
      </MinimizableSection>
    </div>
  );
}

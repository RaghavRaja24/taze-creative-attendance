import { LeaveType } from "@prisma/client";

import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_LIMITS, getFinancialYearLeaveBalances, getFinancialYearsFromLeaves } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { resetLeaveBalanceAction } from "@/lib/actions";
import { getFinancialYearLabel } from "@/lib/time";

export default async function AdminBalancesPage() {
  await requireAdmin();
  const { users, leaveRequests, holidays, currentFinancialYear } = await getAdminDashboardData();
  const financialYears = getFinancialYearsFromLeaves(leaveRequests, currentFinancialYear);

  return (
    <div className="space-y-6">
      <MinimizableSection title="Leave Balances" description="Visual balance tracking and reset controls across financial years.">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Leave Balance</p>
              <h3 className="mt-1 text-2xl font-semibold">Current financial year usage</h3>
            </div>
            <Badge tone="info">FY {currentFinancialYear}</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {users.map((user) => {
              const leaveBalances = getFinancialYearLeaveBalances({
                leaveRequests: user.leaveRequests,
                holidays,
                financialYear: currentFinancialYear,
              });

              const casualPercent = (leaveBalances.CASUAL.used / LEAVE_LIMITS.CASUAL) * 100;
              const sickPercent = (leaveBalances.SICK.used / LEAVE_LIMITS.SICK) * 100;

              return (
                <div key={user.id} className="rounded-[1.75rem] border bg-background/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>

                      <div className="mt-4 space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span>Casual Leave</span>
                            <span>{leaveBalances.CASUAL.used}/{LEAVE_LIMITS.CASUAL} used</span>
                          </div>
                          <div className="h-3 rounded-full bg-secondary">
                            <div className="h-3 rounded-full bg-orange-500" style={{ width: `${Math.min(casualPercent, 100)}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{leaveBalances.CASUAL.remaining} day(s) remaining</p>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span>Sick Leave</span>
                            <span>{leaveBalances.SICK.used}/{LEAVE_LIMITS.SICK} used</span>
                          </div>
                          <div className="h-3 rounded-full bg-secondary">
                            <div className="h-3 rounded-full bg-sky-500" style={{ width: `${Math.min(sickPercent, 100)}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{leaveBalances.SICK.remaining} day(s) remaining</p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-sm">
                      <ActionForm action={resetLeaveBalanceAction} className="space-y-3 rounded-[1.5rem] border p-4">
                        <>
                          <input name="userId" type="hidden" value={user.id} />
                          <input name="financialYear" type="hidden" value={currentFinancialYear} />
                          <p className="text-sm font-semibold">Reset current FY balance</p>
                          <Select defaultValue={LeaveType.CASUAL} name="leaveType">
                            <option value={LeaveType.CASUAL}>Casual Leave</option>
                            <option value={LeaveType.SICK}>Sick Leave</option>
                          </Select>
                          <Textarea name="archiveReason" placeholder="Reason for reset archive (optional)" />
                          <SubmitButton
                            className="w-full"
                            pendingLabel="Resetting..."
                            variant="destructive"
                            confirmMessage="Reset this leave balance? Matching leave requests will be archived, not deleted."
                          >
                            Reset leave usage
                          </SubmitButton>
                        </>
                      </ActionForm>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Per Financial Year History</p>
          <h3 className="mt-1 text-2xl font-semibold">Usage and reset controls</h3>
          <div className="mt-5 space-y-5">
            {financialYears.map((financialYear) => (
              <div key={financialYear} className="rounded-[1.75rem] border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">FY {financialYear}</p>
                  <Badge tone={financialYear === currentFinancialYear ? "info" : "default"}>
                    {financialYear === currentFinancialYear ? "Current" : "History"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {users.map((user) => {
                    const balances = getFinancialYearLeaveBalances({
                      leaveRequests: user.leaveRequests,
                      holidays,
                      financialYear,
                    });
                    const yearLeaves = user.leaveRequests.filter((leave) => getFinancialYearLabel(leave.startDate) === financialYear && !leave.isArchived);

                    return (
                      <div key={`${financialYear}-${user.id}`} className="rounded-[1.25rem] border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {yearLeaves.length} request(s) • Casual used {balances.CASUAL.used} • Sick used {balances.SICK.used}
                            </p>
                          </div>
                          <ActionForm action={resetLeaveBalanceAction} className="flex gap-2">
                            <>
                              <input name="userId" type="hidden" value={user.id} />
                              <input name="financialYear" type="hidden" value={financialYear} />
                              <Select className="min-w-36" defaultValue={LeaveType.CASUAL} name="leaveType">
                                <option value={LeaveType.CASUAL}>Casual</option>
                                <option value={LeaveType.SICK}>Sick</option>
                              </Select>
                              <SubmitButton
                                pendingLabel="Resetting..."
                                size="sm"
                                variant="destructive"
                                confirmMessage="Reset this leave balance for the selected financial year? Matching leave requests will be archived."
                              >
                                Reset
                              </SubmitButton>
                            </>
                          </ActionForm>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
      </MinimizableSection>
    </div>
  );
}

import Link from "next/link";
import { format } from "date-fns";

import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MinimizableSection } from "@/components/ui/minimizable-section";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { generatePayslipAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminPayslipData } from "@/lib/dashboard-data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPayslipsPage() {
  await requireAdmin();
  const { users, payslips } = await getAdminPayslipData();

  const totalNet = payslips.reduce((sum, payslip) => sum + payslip.netPay, 0);
  const currentMonthValue = format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      <MinimizableSection title="Payslips" description="Generate attendance-based payslips, add deductions, and download them.">
        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Card className="rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Payroll Generator</p>
            <h3 className="mt-1 text-2xl font-semibold">Build a monthly payslip from attendance</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Payable days are calculated from working days with a recorded check-in in the selected month. Add manual
              deductions line by line, then regenerate any month whenever salary inputs change.
            </p>

            <ActionForm action={generatePayslipAction} className="mt-6 space-y-4">
              <>
                <Select name="userId" required>
                  <option value="">Select team member</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </Select>
                <Input defaultValue={currentMonthValue} name="month" required type="month" />
                <Input min="0" name="baseSalary" placeholder="Monthly base salary (INR)" required step="0.01" type="number" />
                <Textarea
                  name="deductions"
                  placeholder={`Late mark penalty,500\nAdvance recovery,1200,Recovered from March salary`}
                  rows={5}
                />
                <Textarea name="notes" placeholder="Optional payroll note shown on the payslip" rows={3} />
                <SubmitButton className="w-full">Generate payslip</SubmitButton>
              </>
            </ActionForm>

            <div className="mt-5 rounded-[1.5rem] border bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Deduction format</p>
              <p className="mt-2">One deduction per line: <span className="font-mono text-xs">Label,Amount</span></p>
              <p className="mt-1">Optional third value: <span className="font-mono text-xs">Label,Amount,Note</span></p>
            </div>
          </Card>

          <Card className="rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Generated Payslips</p>
                <h3 className="mt-1 text-2xl font-semibold">Review and download</h3>
              </div>
              <Badge tone="info">{payslips.length} slips</Badge>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total Net Pay</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalNet)}</p>
              </div>
              <div className="rounded-[1.25rem] border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest Month</p>
                <p className="mt-2 text-2xl font-semibold">{payslips[0]?.monthLabel ?? "-"}</p>
              </div>
              <div className="rounded-[1.25rem] border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Attendance Rule</p>
                <p className="mt-2 text-2xl font-semibold">Logged Days</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {payslips.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed bg-background/50 p-6 text-sm text-muted-foreground">
                  No payslips yet. Generate the first one from the form on the left.
                </div>
              ) : null}

              {payslips.map((payslip) => (
                <div key={payslip.id} className="rounded-[1.75rem] border bg-background/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{payslip.user.name}</p>
                        <Badge tone="success">{payslip.monthLabel}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{payslip.user.email}</p>
                      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>Base salary: <span className="font-medium text-foreground">{formatCurrency(payslip.baseSalary)}</span></p>
                        <p>Gross earnings: <span className="font-medium text-foreground">{formatCurrency(payslip.grossEarnings)}</span></p>
                        <p>Scheduled days: <span className="font-medium text-foreground">{payslip.scheduledWorkingDays}</span></p>
                        <p>Payable days: <span className="font-medium text-foreground">{payslip.payableDays}</span></p>
                        <p>Total deductions: <span className="font-medium text-foreground">{formatCurrency(payslip.totalDeductions)}</span></p>
                        <p>Net pay: <span className="font-medium text-foreground">{formatCurrency(payslip.netPay)}</span></p>
                      </div>
                      {payslip.notes ? <p className="mt-3 text-sm">{payslip.notes}</p> : null}
                      {payslip.deductions.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Deductions</p>
                          {payslip.deductions.map((deduction) => (
                            <div key={deduction.id} className="flex items-start justify-between gap-3 rounded-xl bg-card/70 px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium">{deduction.label}</p>
                                {deduction.note ? <p className="text-muted-foreground">{deduction.note}</p> : null}
                              </div>
                              <span className="font-medium">{formatCurrency(deduction.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-4 text-xs text-muted-foreground">
                        Generated {formatDate(payslip.createdAt)}{payslip.generatedBy ? ` by ${payslip.generatedBy.name}` : ""}
                      </p>
                    </div>

                    <div className="flex w-full max-w-xs flex-col gap-3">
                      <Link
                        className={cn(
                          "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90",
                        )}
                        href={`/api/export/payslip/${payslip.id}`}
                      >
                        Download Payslip
                      </Link>
                    </div>
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

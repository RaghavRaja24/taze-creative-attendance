import type { AttendanceRecord, Holiday } from "@prisma/client";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

import { getDayKey, isWorkingDay } from "@/lib/time";

export type ParsedDeduction = {
  label: string;
  amount: number;
  note?: string;
};

export function parsePayslipMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  return new Date(`${value}-01T00:00:00.000Z`);
}

export function getPayslipMonthLabel(monthStart: Date) {
  return format(monthStart, "MMMM yyyy");
}

export function getMonthRange(monthStart: Date) {
  return {
    start: startOfMonth(monthStart),
    end: endOfMonth(monthStart),
  };
}

export function countScheduledWorkingDays(monthStart: Date, holidays: Holiday[]) {
  const holidayKeys = new Set(holidays.map((holiday) => getDayKey(holiday.date)));
  const { start, end } = getMonthRange(monthStart);

  return eachDayOfInterval({ start, end }).filter((day) => isWorkingDay(day) && !holidayKeys.has(getDayKey(day))).length;
}

export function countPayableDays(monthStart: Date, attendanceRecords: AttendanceRecord[], holidays: Holiday[]) {
  const { start, end } = getMonthRange(monthStart);
  const holidayKeys = new Set(holidays.map((holiday) => getDayKey(holiday.date)));

  return attendanceRecords.filter((record) => {
    if (!record.checkInAt) {
      return false;
    }

    if (record.date < start || record.date > end) {
      return false;
    }

    if (!isWorkingDay(record.date)) {
      return false;
    }

    return !holidayKeys.has(getDayKey(record.date));
  }).length;
}

export function parseDeductionsInput(value: string) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const deductions: ParsedDeduction[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((part) => part.trim());
    const [label, amountRaw, ...noteParts] = parts;

    if (!label || !amountRaw) {
      throw new Error(`Invalid deduction line "${line}". Use "Label,Amount" or "Label,Amount,Note".`);
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(`Invalid deduction amount in "${line}".`);
    }

    deductions.push({
      label,
      amount: roundCurrency(amount),
      note: noteParts.join(", ") || undefined,
    });
  }

  return deductions;
}

export function sumDeductionAmounts(deductions: ParsedDeduction[]) {
  return roundCurrency(deductions.reduce((sum, deduction) => sum + deduction.amount, 0));
}

export function calculateGrossFromAttendance(baseSalary: number, scheduledWorkingDays: number, payableDays: number) {
  if (scheduledWorkingDays <= 0) {
    return roundCurrency(baseSalary);
  }

  return roundCurrency((baseSalary / scheduledWorkingDays) * payableDays);
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

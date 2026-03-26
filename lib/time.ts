import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";
export const EXPECTED_WORK_HOURS = 9;
export const SHIFT_START_LABEL = "12:00 PM";
export const SHIFT_END_LABEL = "9:00 PM";
export const WORKING_DAYS_LABEL = "Monday to Saturday";

export function getDayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function dayKeyToDate(dayKey: string) {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

export function todayKey() {
  return getDayKey(new Date());
}

export function isWorkingDay(date: Date) {
  const local = new Date(
    date.toLocaleString("en-US", {
      timeZone: TIMEZONE,
    }),
  );

  return local.getDay() !== 0;
}

export function getFinancialYearLabel(date: Date) {
  const local = new Date(
    date.toLocaleString("en-US", {
      timeZone: TIMEZONE,
    }),
  );
  const year = local.getMonth() >= 3 ? local.getFullYear() : local.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

export function isSameFinancialYear(start: Date, end: Date) {
  return getFinancialYearLabel(start) === getFinancialYearLabel(end);
}

export function getLateThreshold() {
  const raw = process.env.LATE_MARK_AFTER ?? "12:00";
  const [hours, minutes] = raw.split(":").map(Number);
  return { hours, minutes };
}

export function isLateCheckIn(date: Date) {
  const { hours, minutes } = getLateThreshold();
  const local = new Date(
    date.toLocaleString("en-US", {
      timeZone: TIMEZONE,
    }),
  );

  return local.getHours() > hours || (local.getHours() === hours && local.getMinutes() > minutes);
}

export function getMonthGrid(baseDate: Date) {
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  return eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });
}

export function getMonthLabel(baseDate: Date) {
  return format(baseDate, "MMMM yyyy");
}

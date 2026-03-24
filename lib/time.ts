import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

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
  return !isWeekend(date);
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
  const raw = process.env.LATE_MARK_AFTER ?? "09:45";
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

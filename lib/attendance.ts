import { LeaveStatus, LeaveType, type AttendanceRecord, type Holiday, type LeaveRequest } from "@prisma/client";
import { eachDayOfInterval, endOfMonth, isAfter, isBefore, startOfMonth, subDays } from "date-fns";

import { dayKeyToDate, getDayKey, getFinancialYearLabel, getMonthGrid, getMonthLabel, isWorkingDay, todayKey } from "@/lib/time";

type CalendarDayStatus = "PRESENT" | "LATE" | "LEAVE" | "HOLIDAY" | "ABSENT" | "WEEKEND" | "FUTURE";

type AttendanceWithLeaveInput = {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays?: Holiday[];
};

const LIMITED_LEAVE_TYPES = [LeaveType.CASUAL, LeaveType.SICK] as const;

export const LEAVE_LIMITS: Record<(typeof LIMITED_LEAVE_TYPES)[number], number> = {
  [LeaveType.CASUAL]: 12,
  [LeaveType.SICK]: 12,
};

export function getDashboardMetrics({ attendanceRecords, leaveRequests, holidays = [] }: AttendanceWithLeaveInput) {
  const approvedLeaves = leaveRequests.filter((leave) => leave.status === LeaveStatus.APPROVED && !leave.isArchived);
  const presentDays = attendanceRecords.length;
  const lateDays = attendanceRecords.filter((record) => record.late).length;

  return {
    presentDays,
    lateDays,
    holidayDays: holidays.length,
    leaveDays: approvedLeaves.reduce(
      (sum, leave) => sum + getBusinessDaysInRange(leave.startDate, leave.endDate, holidays),
      0,
    ),
  };
}

export function getMonthlyAttendanceSummary(records: AttendanceRecord[]) {
  const counts = new Map<string, { present: number; late: number }>();

  for (const record of records) {
    const monthKey = getDayKey(record.date).slice(0, 7);
    const entry = counts.get(monthKey) ?? { present: 0, late: 0 };
    entry.present += 1;
    if (record.late) {
      entry.late += 1;
    }
    counts.set(monthKey, entry);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      ...value,
    }));
}

export function buildCalendar({
  attendanceRecords,
  leaveRequests,
  holidays = [],
  month = new Date(),
}: AttendanceWithLeaveInput & { month?: Date }) {
  const attendanceMap = new Map(attendanceRecords.map((record) => [getDayKey(record.date), record]));
  const approvedLeaves = leaveRequests.filter((leave) => leave.status === LeaveStatus.APPROVED);
  const visibleLeaves = leaveRequests.filter((leave) => !leave.isArchived);
  const holidayMap = new Map(holidays.map((holiday) => [getDayKey(holiday.date), holiday]));
  const days = getMonthGrid(month);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const today = todayKey();

  return {
    label: getMonthLabel(month),
    days: days.map((day) => {
      const key = getDayKey(day);
      const attendance = attendanceMap.get(key);
      const leave = approvedLeaves.find((item) => isWithinRange(day, item.startDate, item.endDate));
      const holiday = holidayMap.get(key);
      const inCurrentMonth = !isBefore(day, monthStart) && !isAfter(day, monthEnd);

      let status: CalendarDayStatus = "ABSENT";
      if (!inCurrentMonth) {
        status = "FUTURE";
      } else if (!isWorkingDay(day)) {
        status = "WEEKEND";
      } else if (key > today) {
        status = "FUTURE";
      } else if (holiday) {
        status = "HOLIDAY";
      } else if (leave) {
        status = "LEAVE";
      } else if (attendance) {
        status = attendance.late ? "LATE" : "PRESENT";
      }

      return {
        key,
        date: day,
        status,
        inCurrentMonth,
        leaveType: leave?.type,
        holidayName: holiday?.name,
      };
    }),
  };
}

export function getBusinessDaysInRange(start: Date, end: Date, holidays: Holiday[] = []) {
  const holidayKeys = new Set(holidays.map((holiday) => getDayKey(holiday.date)));
  return eachDayOfInterval({ start, end }).filter((day) => isWorkingDay(day) && !holidayKeys.has(getDayKey(day))).length;
}

export function getPast30DaySnapshot({
  attendanceRecords,
  leaveRequests,
  holidays = [],
}: AttendanceWithLeaveInput) {
  const today = dayKeyToDate(todayKey());
  const start = subDays(today, 29);
  const approvedLeaves = leaveRequests.filter((leave) => leave.status === LeaveStatus.APPROVED);
  const visibleApprovedLeaves = approvedLeaves.filter((leave) => !leave.isArchived);
  const holidayMap = new Map(holidays.map((holiday) => [getDayKey(holiday.date), holiday]));

  return eachDayOfInterval({ start, end: today })
    .filter((day) => isWorkingDay(day))
    .map((day) => {
      const key = getDayKey(day);
      const attendance = attendanceRecords.find((record) => getDayKey(record.date) === key);
      const leave = visibleApprovedLeaves.find((item) => isWithinRange(day, item.startDate, item.endDate));
      const holiday = holidayMap.get(key);

      return {
        key,
        date: day,
        status: attendance
          ? attendance.late
            ? "Late"
            : "Present"
          : holiday
            ? `Holiday: ${holiday.name}`
            : leave
              ? formatLeaveType(leave.type)
              : "Absent",
        checkInAt: attendance?.checkInAt ?? null,
        checkOutAt: attendance?.checkOutAt ?? null,
      };
    });
}

export function isHoliday(date: Date, holidays: Holiday[]) {
  const key = getDayKey(date);
  return holidays.some((holiday) => getDayKey(holiday.date) === key);
}

export function getFinancialYearLeaveBalances({
  leaveRequests,
  holidays = [],
  financialYear,
}: {
  leaveRequests: LeaveRequest[];
  holidays?: Holiday[];
  financialYear: string;
}) {
  const balances = {
    [LeaveType.CASUAL]: {
      limit: LEAVE_LIMITS[LeaveType.CASUAL],
      used: 0,
      remaining: LEAVE_LIMITS[LeaveType.CASUAL],
    },
    [LeaveType.SICK]: {
      limit: LEAVE_LIMITS[LeaveType.SICK],
      used: 0,
      remaining: LEAVE_LIMITS[LeaveType.SICK],
    },
  };

  for (const leave of leaveRequests) {
    if (leave.status === LeaveStatus.REJECTED || leave.isArchived) {
      continue;
    }

    if (!isLimitedLeaveType(leave.type)) {
      continue;
    }

    const leaveFinancialYear = getFinancialYearLabel(leave.startDate);
    if (leaveFinancialYear !== financialYear) {
      continue;
    }

    const days = getBusinessDaysInRange(leave.startDate, leave.endDate, holidays);
    balances[leave.type].used += days;
  }

  balances[LeaveType.CASUAL].remaining = Math.max(0, balances[LeaveType.CASUAL].limit - balances[LeaveType.CASUAL].used);
  balances[LeaveType.SICK].remaining = Math.max(0, balances[LeaveType.SICK].limit - balances[LeaveType.SICK].used);

  return balances;
}

export function getFinancialYearsFromLeaves(leaveRequests: LeaveRequest[], fallbackFinancialYear: string) {
  const years = new Set<string>([fallbackFinancialYear]);

  for (const leave of leaveRequests) {
    years.add(getFinancialYearLabel(leave.startDate));
  }

  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export function getRequestedLeaveDays(type: LeaveType, start: Date, end: Date, holidays: Holiday[]) {
  return getBusinessDaysInRange(start, end, holidays);
}

export function isLimitedLeaveType(type: LeaveType): type is (typeof LIMITED_LEAVE_TYPES)[number] {
  return LIMITED_LEAVE_TYPES.includes(type as (typeof LIMITED_LEAVE_TYPES)[number]);
}

export function isOverlappingLeave(leaveRequests: LeaveRequest[], start: Date, end: Date, excludeId?: string) {
  return leaveRequests.some((leave) => {
    if (excludeId && leave.id === excludeId) {
      return false;
    }

    if (leave.status === LeaveStatus.REJECTED || leave.isArchived) {
      return false;
    }

    return leave.startDate <= end && leave.endDate >= start;
  });
}

function isWithinRange(date: Date, start: Date, end: Date) {
  const key = getDayKey(date);
  return key >= getDayKey(start) && key <= getDayKey(end);
}

function formatLeaveType(type: LeaveType) {
  if (type === LeaveType.CASUAL) return "Casual Leave";
  if (type === LeaveType.SICK) return "Sick Leave";
  return "Paid Leave";
}

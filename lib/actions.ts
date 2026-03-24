"use server";

import { LeaveStatus, LeaveType, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { requireAdmin, requireUser } from "@/lib/auth";
import {
  getFinancialYearLeaveBalances,
  getRequestedLeaveDays,
  isHoliday,
  isLimitedLeaveType,
  isOverlappingLeave,
} from "@/lib/attendance";
import { sendLeaveApplicationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { dayKeyToDate, getFinancialYearLabel, isLateCheckIn, isSameFinancialYear, isWorkingDay, todayKey } from "@/lib/time";
import { formatDate } from "@/lib/utils";

export async function checkInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const today = dayKeyToDate(todayKey());
  const holidays = await prisma.holiday.findMany();

  if (!isWorkingDay(today) || isHoliday(today, holidays)) {
    return { status: "error", message: "Attendance can only be marked on working days." };
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
  });

  if (existing?.checkInAt) {
    return { status: "error", message: "You have already checked in today." };
  }

  const now = new Date();
  await prisma.attendanceRecord.upsert({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
    update: {
      checkInAt: now,
      late: isLateCheckIn(now),
    },
    create: {
      userId: session.user.id,
      date: today,
      checkInAt: now,
      late: isLateCheckIn(now),
    },
  });

  revalidatePath("/employee");
  revalidatePath("/admin");

  return { status: "success", message: "Check-in recorded successfully." };
}

export async function checkOutAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const today = dayKeyToDate(todayKey());

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
  });

  if (!record?.checkInAt) {
    return { status: "error", message: "Check-in is required before check-out." };
  }

  if (record.checkOutAt) {
    return { status: "error", message: "You have already checked out today." };
  }

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutAt: new Date(),
    },
  });

  revalidatePath("/employee");
  revalidatePath("/admin");

  return { status: "success", message: "Check-out recorded successfully." };
}

export async function requestLeaveAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUser();
  const type = formData.get("type")?.toString() as LeaveType | undefined;
  const startDate = formData.get("startDate")?.toString();
  const endDate = formData.get("endDate")?.toString();
  const reason = formData.get("reason")?.toString().trim();

  if (!type || !startDate || !endDate || !reason) {
    return { status: "error", message: "Please complete all leave request fields." };
  }

  const start = dayKeyToDate(startDate);
  const end = dayKeyToDate(endDate);
  if (start > end) {
    return { status: "error", message: "End date must be on or after start date." };
  }

  const existingLeaves = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id },
  });
  const holidays = await prisma.holiday.findMany();

  if (isOverlappingLeave(existingLeaves, start, end)) {
    return { status: "error", message: "This leave overlaps with an existing request." };
  }

  if (isLimitedLeaveType(type) && !isSameFinancialYear(start, end)) {
    return { status: "error", message: "Please split casual or sick leave across financial years." };
  }

  if (isLimitedLeaveType(type)) {
    const limitedType = type;
    const financialYear = getFinancialYearLabel(start);
    const balances = getFinancialYearLeaveBalances({
      leaveRequests: existingLeaves,
      holidays,
      financialYear,
    });
    const requestedDays = getRequestedLeaveDays(limitedType, start, end, holidays);

    if (requestedDays > balances[limitedType].remaining) {
      return {
        status: "error",
        message: `${limitedType === LeaveType.CASUAL ? "Casual" : "Sick"} leave exceeds the ${balances[limitedType].limit}-day financial year limit. Remaining: ${balances[limitedType].remaining} day(s).`,
      };
    }
  }

  await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      type,
      startDate: start,
      endDate: end,
      reason,
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      role: Role.ADMIN,
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  await sendLeaveApplicationEmail({
    applicantName: session.user.name ?? "Team Member",
    applicantEmail: session.user.email ?? "",
    leaveType: type,
    startDate: formatDate(start),
    endDate: formatDate(end),
    reason,
    recipients: admins.map((admin) => admin.email),
  });

  revalidatePath("/employee");
  revalidatePath("/admin");

  return { status: "success", message: "Leave request submitted." };
}

export async function createEmployeeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const role = formData.get("role")?.toString() as Role | undefined;

  if (!name || !email || !role) {
    return { status: "error", message: "Name, email, and role are required." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "That email is already approved in the system." };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      isActive: true,
    },
  });

  revalidatePath("/admin");
  return { status: "success", message: "Employee added and approved for Google sign-in." };
}

export async function updateUserRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const role = formData.get("role")?.toString() as Role | undefined;

  if (!userId || !role) {
    return { status: "error", message: "Missing user or role." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin");
  return { status: "success", message: "Role updated successfully." };
}

export async function removeEmployeeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();

  if (!userId) {
    return { status: "error", message: "Missing user id." };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
  return { status: "success", message: "Employee removed." };
}

export async function reviewLeaveAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const leaveId = formData.get("leaveId")?.toString();
  const decision = formData.get("decision")?.toString();
  const reviewNote = formData.get("reviewNote")?.toString().trim() || null;

  if (decision !== LeaveStatus.APPROVED && decision !== LeaveStatus.REJECTED) {
    return { status: "error", message: "Invalid leave review request." };
  }

  if (!leaveId) {
    return { status: "error", message: "Invalid leave review request." };
  }

  if (decision === LeaveStatus.APPROVED) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });
    if (!leave) {
      return { status: "error", message: "Leave request not found." };
    }
    if (leave.isArchived) {
      return { status: "error", message: "Archived leave requests cannot be approved." };
    }

    if (isLimitedLeaveType(leave.type)) {
      const limitedType = leave.type;
      if (!isSameFinancialYear(leave.startDate, leave.endDate)) {
        return { status: "error", message: "Please split casual or sick leave across financial years." };
      }

      const [existingLeaves, holidays] = await Promise.all([
        prisma.leaveRequest.findMany({
          where: { userId: leave.userId },
        }),
        prisma.holiday.findMany(),
      ]);

      const financialYear = getFinancialYearLabel(leave.startDate);
      const balances = getFinancialYearLeaveBalances({
        leaveRequests: existingLeaves.filter((item) => item.id !== leave.id),
        holidays,
        financialYear,
      });
      const requestedDays = getRequestedLeaveDays(limitedType, leave.startDate, leave.endDate, holidays);

      if (requestedDays > balances[limitedType].remaining) {
        return {
          status: "error",
          message: `${limitedType === LeaveType.CASUAL ? "Casual" : "Sick"} leave approval exceeds the ${balances[limitedType].limit}-day financial year limit. Remaining: ${balances[limitedType].remaining} day(s).`,
        };
      }
    }
  }

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status: decision,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");

  return { status: "success", message: `Leave ${decision.toLowerCase()} successfully.` };
}

export async function archiveLeaveRequestAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const leaveId = formData.get("leaveId")?.toString();
  const archiveReason = formData.get("archiveReason")?.toString().trim() || "Archived by admin";

  if (!leaveId) {
    return { status: "error", message: "Missing leave request id." };
  }

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedById: session.user.id,
      archiveReason,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return { status: "success", message: "Leave request archived." };
}

export async function assignManualAttendanceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const date = formData.get("date")?.toString();
  const checkIn = formData.get("checkInAt")?.toString();
  const checkOut = formData.get("checkOutAt")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!userId || !date || !checkIn) {
    return { status: "error", message: "Employee, date, and check-in are required." };
  }

  const attendanceDate = dayKeyToDate(date);
  const checkInAt = new Date(`${date}T${checkIn}:00+05:30`);
  const checkOutAt = checkOut ? new Date(`${date}T${checkOut}:00+05:30`) : null;

  await prisma.attendanceRecord.upsert({
    where: {
      userId_date: {
        userId,
        date: attendanceDate,
      },
    },
    update: {
      checkInAt,
      checkOutAt,
      note,
      isManual: true,
      late: isLateCheckIn(checkInAt),
    },
    create: {
      userId,
      date: attendanceDate,
      checkInAt,
      checkOutAt,
      note,
      isManual: true,
      late: isLateCheckIn(checkInAt),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return { status: "success", message: "Attendance updated manually." };
}

export async function adminCheckInEmployeeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();

  if (!userId) {
    return { status: "error", message: "Please select an employee." };
  }

  const today = dayKeyToDate(todayKey());
  const holidays = await prisma.holiday.findMany();

  if (!isWorkingDay(today) || isHoliday(today, holidays)) {
    return { status: "error", message: "Quick check-in is only available on working days." };
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing?.checkInAt) {
    return { status: "error", message: "That employee is already checked in today." };
  }

  const now = new Date();
  await prisma.attendanceRecord.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      checkInAt: now,
      late: isLateCheckIn(now),
      isManual: true,
      note: "Admin quick terminal check-in",
    },
    create: {
      userId,
      date: today,
      checkInAt: now,
      late: isLateCheckIn(now),
      isManual: true,
      note: "Admin quick terminal check-in",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/terminal");
  revalidatePath("/employee");
  return { status: "success", message: "Employee checked in." };
}

export async function adminCheckOutEmployeeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();

  if (!userId) {
    return { status: "error", message: "Please select an employee." };
  }

  const today = dayKeyToDate(todayKey());
  const record = await prisma.attendanceRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!record?.checkInAt) {
    return { status: "error", message: "That employee has not checked in today." };
  }

  if (record.checkOutAt) {
    return { status: "error", message: "That employee is already checked out today." };
  }

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOutAt: new Date(),
      isManual: true,
      note: record.note ?? "Admin quick terminal log off",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/terminal");
  revalidatePath("/employee");
  return { status: "success", message: "Employee logged off." };
}

export async function assignLeaveByAdminAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const type = formData.get("type")?.toString() as LeaveType | undefined;
  const startDate = formData.get("startDate")?.toString();
  const endDate = formData.get("endDate")?.toString();
  const reason = formData.get("reason")?.toString().trim();

  if (!userId || !type || !startDate || !endDate || !reason) {
    return { status: "error", message: "All leave assignment fields are required." };
  }

  const start = dayKeyToDate(startDate);
  const end = dayKeyToDate(endDate);
  const existingLeaves = await prisma.leaveRequest.findMany({
    where: { userId },
  });
  const holidays = await prisma.holiday.findMany();

  if (isOverlappingLeave(existingLeaves, start, end)) {
    return { status: "error", message: "This leave overlaps with an existing request." };
  }

  if (isLimitedLeaveType(type) && !isSameFinancialYear(start, end)) {
    return { status: "error", message: "Please split casual or sick leave across financial years." };
  }

  if (isLimitedLeaveType(type)) {
    const limitedType = type;
    const financialYear = getFinancialYearLabel(start);
    const balances = getFinancialYearLeaveBalances({
      leaveRequests: existingLeaves,
      holidays,
      financialYear,
    });
    const requestedDays = getRequestedLeaveDays(limitedType, start, end, holidays);

    if (requestedDays > balances[limitedType].remaining) {
      return {
        status: "error",
        message: `${limitedType === LeaveType.CASUAL ? "Casual" : "Sick"} leave exceeds the ${balances[limitedType].limit}-day financial year limit. Remaining: ${balances[limitedType].remaining} day(s).`,
      };
    }
  }

  await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      startDate: start,
      endDate: end,
      reason,
      status: LeaveStatus.APPROVED,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: "Assigned by admin.",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return { status: "success", message: "Leave assigned successfully." };
}

export async function resetLeaveBalanceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const leaveType = formData.get("leaveType")?.toString() as LeaveType | undefined;
  const financialYear = formData.get("financialYear")?.toString();
  const archiveReason =
    formData.get("archiveReason")?.toString().trim() ||
    `Archived during ${leaveType?.toLowerCase()} leave reset for ${financialYear}`;

  if (!userId || !leaveType || !financialYear) {
    return { status: "error", message: "User, leave type, and financial year are required." };
  }

  if (!isLimitedLeaveType(leaveType)) {
    return { status: "error", message: "Only casual and sick leave balances can be reset." };
  }

  const matchingLeaves = await prisma.leaveRequest.findMany({
    where: {
      userId,
      type: leaveType,
    },
    select: {
      id: true,
      startDate: true,
    },
  });

  const leaveIds = matchingLeaves
    .filter((leave) => getFinancialYearLabel(leave.startDate) === financialYear)
    .map((leave) => leave.id);

  if (leaveIds.length === 0) {
    return { status: "error", message: "No matching leave records found for that reset." };
  }

  await prisma.leaveRequest.updateMany({
    where: {
      id: {
        in: leaveIds,
      },
    },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedById: session.user.id,
      archiveReason,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return {
    status: "success",
    message: `${leaveType === LeaveType.CASUAL ? "Casual" : "Sick"} leave reset for ${financialYear}. Archived ${leaveIds.length} request(s).`,
  };
}

export async function createHolidayAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const name = formData.get("name")?.toString().trim();
  const dateValue = formData.get("date")?.toString();

  if (!name || !dateValue) {
    return { status: "error", message: "Holiday name and date are required." };
  }

  const date = dayKeyToDate(dateValue);
  const existing = await prisma.holiday.findUnique({
    where: { date },
  });

  if (existing) {
    return { status: "error", message: "A holiday already exists on this date." };
  }

  await prisma.holiday.create({
    data: {
      name,
      date,
      financialYear: getFinancialYearLabel(date),
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return { status: "success", message: "Holiday added for the financial year." };
}

export async function removeHolidayAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const holidayId = formData.get("holidayId")?.toString();

  if (!holidayId) {
    return { status: "error", message: "Missing holiday id." };
  }

  await prisma.holiday.delete({
    where: { id: holidayId },
  });

  revalidatePath("/admin");
  revalidatePath("/employee");
  return { status: "success", message: "Holiday removed." };
}

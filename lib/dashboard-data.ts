import { prisma } from "@/lib/prisma";
import { getFinancialYearLabel } from "@/lib/time";

export async function getAdminDashboardData() {
  const [users, attendanceRecords, leaveRequests, holidays] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        attendanceRecords: {
          orderBy: { date: "desc" },
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      include: { user: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 40,
    }),
    prisma.leaveRequest.findMany({
      include: { user: true, reviewedBy: true, archivedBy: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.holiday.findMany({
      orderBy: [{ date: "asc" }],
    }),
  ]);

  const currentFinancialYear = getFinancialYearLabel(new Date());

  return {
    users,
    attendanceRecords,
    leaveRequests,
    holidays,
    currentFinancialYear,
  };
}

export async function getEmployeeDashboardData(userId: string) {
  const [user, holidays] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        attendanceRecords: {
          orderBy: { date: "desc" },
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.holiday.findMany({
      orderBy: { date: "asc" },
    }),
  ]);

  return {
    user,
    holidays,
    currentFinancialYear: getFinancialYearLabel(new Date()),
  };
}

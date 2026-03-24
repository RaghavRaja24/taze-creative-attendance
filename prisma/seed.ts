import { LeaveStatus, LeaveType, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const employees = [
  { name: "Raghav Arora", email: "raghav@tazecreative.com", role: Role.ADMIN },
  { name: "Aisha Khan", email: "aisha@tazecreative.com", role: Role.ADMIN },
  { name: "Neha Sharma", email: "neha@tazecreative.com", role: Role.EMPLOYEE },
  { name: "Arjun Mehta", email: "arjun@tazecreative.com", role: Role.EMPLOYEE },
  { name: "Simran Gill", email: "simran@tazecreative.com", role: Role.EMPLOYEE },
  { name: "Kabir Sethi", email: "kabir@tazecreative.com", role: Role.EMPLOYEE },
  { name: "Ira Thomas", email: "ira@tazecreative.com", role: Role.EMPLOYEE },
];

const makeDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const makeDateTime = (value: string) => new Date(`${value}Z`);

async function main() {
  await prisma.holiday.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();

  const createdUsers = [];

  for (const employee of employees) {
    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: employee.name,
        role: employee.role,
        isActive: true,
      },
      create: employee,
    });

    createdUsers.push(user);
  }

  const [admin, secondAdmin, neha, arjun, simran, kabir, ira] = createdUsers;

  const records = [
    { userId: admin.id, date: "2026-03-18", checkInAt: "2026-03-18T09:08:00.000", checkOutAt: "2026-03-18T18:21:00.000", late: false },
    { userId: secondAdmin.id, date: "2026-03-18", checkInAt: "2026-03-18T09:12:00.000", checkOutAt: "2026-03-18T18:10:00.000", late: false },
    { userId: neha.id, date: "2026-03-18", checkInAt: "2026-03-18T09:51:00.000", checkOutAt: "2026-03-18T18:42:00.000", late: true },
    { userId: arjun.id, date: "2026-03-18", checkInAt: "2026-03-18T09:30:00.000", checkOutAt: "2026-03-18T18:02:00.000", late: false },
    { userId: simran.id, date: "2026-03-18", checkInAt: "2026-03-18T09:17:00.000", checkOutAt: "2026-03-18T18:27:00.000", late: false },
    { userId: kabir.id, date: "2026-03-18", checkInAt: "2026-03-18T10:08:00.000", checkOutAt: "2026-03-18T18:55:00.000", late: true },
    { userId: ira.id, date: "2026-03-18", checkInAt: "2026-03-18T09:24:00.000", checkOutAt: "2026-03-18T18:19:00.000", late: false },
    { userId: admin.id, date: "2026-03-19", checkInAt: "2026-03-19T09:06:00.000", checkOutAt: "2026-03-19T18:11:00.000", late: false },
    { userId: secondAdmin.id, date: "2026-03-19", checkInAt: "2026-03-19T09:18:00.000", checkOutAt: "2026-03-19T18:08:00.000", late: false },
    { userId: neha.id, date: "2026-03-19", checkInAt: "2026-03-19T09:42:00.000", checkOutAt: "2026-03-19T18:22:00.000", late: false },
    { userId: arjun.id, date: "2026-03-19", checkInAt: "2026-03-19T09:11:00.000", checkOutAt: "2026-03-19T17:59:00.000", late: false },
    { userId: kabir.id, date: "2026-03-19", checkInAt: "2026-03-19T09:58:00.000", checkOutAt: "2026-03-19T18:17:00.000", late: true },
    { userId: ira.id, date: "2026-03-19", checkInAt: "2026-03-19T09:21:00.000", checkOutAt: "2026-03-19T18:06:00.000", late: false },
  ];

  for (const record of records) {
    await prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId: record.userId,
          date: makeDate(record.date),
        },
      },
      update: {
        checkInAt: makeDateTime(record.checkInAt),
        checkOutAt: makeDateTime(record.checkOutAt),
        late: record.late,
      },
      create: {
        userId: record.userId,
        date: makeDate(record.date),
        checkInAt: makeDateTime(record.checkInAt),
        checkOutAt: makeDateTime(record.checkOutAt),
        late: record.late,
      },
    });
  }

  const leaves = [
    {
      userId: simran.id,
      type: LeaveType.CASUAL,
      startDate: makeDate("2026-03-19"),
      endDate: makeDate("2026-03-20"),
      reason: "Client shoot travel with family buffer day.",
      status: LeaveStatus.APPROVED,
      reviewedById: admin.id,
      reviewedAt: new Date("2026-03-17T12:00:00.000Z"),
      reviewNote: "Approved and synced with project timeline.",
    },
    {
      userId: arjun.id,
      type: LeaveType.SICK,
      startDate: makeDate("2026-03-24"),
      endDate: makeDate("2026-03-25"),
      reason: "Recovering from seasonal fever.",
      status: LeaveStatus.PENDING,
    },
    {
      userId: neha.id,
      type: LeaveType.PAID,
      startDate: makeDate("2026-03-28"),
      endDate: makeDate("2026-03-30"),
      reason: "Family function out of town.",
      status: LeaveStatus.APPROVED,
      reviewedById: secondAdmin.id,
      reviewedAt: new Date("2026-03-20T11:10:00.000Z"),
      reviewNote: "Approved with campaign handoff in place.",
    },
  ];

  for (const leave of leaves) {
    await prisma.leaveRequest.create({
      data: leave,
    });
  }

  const holidays = [
    { name: "Maharashtra Day", date: makeDate("2026-05-01"), financialYear: "2026-2027", createdById: admin.id },
    { name: "Independence Day", date: makeDate("2026-08-15"), financialYear: "2026-2027", createdById: admin.id },
    { name: "Diwali Holiday", date: makeDate("2026-11-09"), financialYear: "2026-2027", createdById: secondAdmin.id },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({
      data: holiday,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

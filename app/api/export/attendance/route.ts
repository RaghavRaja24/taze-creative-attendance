import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const records = await prisma.attendanceRecord.findMany({
    include: { user: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const header = ["Employee Name", "Email", "Date", "Check In", "Check Out", "Late", "Manual Note"];
  const rows = records.map((record) =>
    [
      record.user.name,
      record.user.email,
      record.date.toISOString().slice(0, 10),
      record.checkInAt?.toISOString() ?? "",
      record.checkOutAt?.toISOString() ?? "",
      record.late ? "Yes" : "No",
      record.note ?? "",
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="taze-creative-attendance.csv"',
    },
  });
}

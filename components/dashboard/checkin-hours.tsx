"use client";

import { useEffect, useState } from "react";

type CheckInHoursProps = {
  checkInAt?: string | null;
  checkOutAt?: string | null;
};

function formatDuration(start: Date, end: Date) {
  const diff = Math.max(0, end.getTime() - start.getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function CheckInHours({ checkInAt, checkOutAt }: CheckInHoursProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!checkInAt || checkOutAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [checkInAt, checkOutAt]);

  if (!checkInAt) {
    return <span>0h 00m</span>;
  }

  const start = new Date(checkInAt);
  const end = checkOutAt ? new Date(checkOutAt) : now;

  return <span>{formatDuration(start, end)}</span>;
}

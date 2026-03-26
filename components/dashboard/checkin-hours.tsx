"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type CheckInHoursProps = {
  checkInAt?: string | null;
  checkOutAt?: string | null;
};

type HoursTargetIndicatorProps = CheckInHoursProps & {
  targetHours?: number;
  className?: string;
};

function getDurationMinutes(start: Date, end: Date) {
  const diff = Math.max(0, end.getTime() - start.getTime());
  return Math.floor(diff / 60000);
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function formatDuration(start: Date, end: Date) {
  return formatMinutes(getDurationMinutes(start, end));
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

export function HoursTargetIndicator({
  checkInAt,
  checkOutAt,
  targetHours = 9,
  className,
}: HoursTargetIndicatorProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!checkInAt || checkOutAt) {
      return;
    }

    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [checkInAt, checkOutAt]);

  const targetMinutes = targetHours * 60;
  const workedMinutes = checkInAt ? getDurationMinutes(new Date(checkInAt), checkOutAt ? new Date(checkOutAt) : now) : 0;
  const deltaMinutes = workedMinutes - targetMinutes;
  const progress = Math.min(100, Math.round((workedMinutes / targetMinutes) * 100));

  let label = "Not started";
  let detail = `${formatMinutes(targetMinutes)} remaining`;
  let toneClasses = "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200";
  let barClasses = "bg-slate-400";

  if (checkInAt) {
    if (deltaMinutes < 0) {
      label = "Hours short";
      detail = `${formatMinutes(Math.abs(deltaMinutes))} remaining`;
      toneClasses = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
      barClasses = "bg-amber-500";
    } else if (deltaMinutes === 0) {
      label = "On target";
      detail = `${formatMinutes(targetMinutes)} completed`;
      toneClasses = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
      barClasses = "bg-emerald-500";
    } else {
      label = "Overtime";
      detail = `${formatMinutes(deltaMinutes)} extra`;
      toneClasses = "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200";
      barClasses = "bg-sky-500";
    }
  }

  return (
    <div className={cn("rounded-[1.25rem] border bg-background/70 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", toneClasses)}>
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{formatMinutes(workedMinutes)} / {formatMinutes(targetMinutes)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] duration-300", barClasses)} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

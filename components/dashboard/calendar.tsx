"use client";

import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarRange, Check, Clock3, Grid2x2, List, PartyPopper, Plane, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CalendarItem = {
  key: string;
  date: Date;
  status: "PRESENT" | "LATE" | "LEAVE" | "HOLIDAY" | "ABSENT" | "WEEKEND" | "FUTURE";
  inCurrentMonth: boolean;
  leaveType?: string;
  holidayName?: string;
};

type AttendanceCalendarProps = {
  label: string;
  days: CalendarItem[];
};

const statusStyles = {
  PRESENT: {
    card: "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
    dot: "bg-emerald-500",
    label: "Present",
  },
  LATE: {
    card: "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
    dot: "bg-amber-500",
    label: "Late",
  },
  LEAVE: {
    card: "border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
    dot: "bg-sky-500",
    label: "Leave",
  },
  HOLIDAY: {
    card: "border-fuchsia-200 bg-fuchsia-50/80 text-fuchsia-900 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-100",
    dot: "bg-fuchsia-500",
    label: "Holiday",
  },
  ABSENT: {
    card: "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100",
    dot: "bg-rose-500",
    label: "Absent",
  },
  WEEKEND: {
    card: "border-border bg-secondary/70 text-muted-foreground",
    dot: "bg-slate-400",
    label: "Weekend",
  },
  FUTURE: {
    card: "border-border bg-background text-muted-foreground",
    dot: "bg-slate-300 dark:bg-slate-600",
    label: "Upcoming",
  },
};

const statusIcons = {
  PRESENT: Check,
  LATE: Clock3,
  LEAVE: Plane,
  HOLIDAY: PartyPopper,
  ABSENT: X,
  WEEKEND: CalendarRange,
  FUTURE: CalendarRange,
};

export function AttendanceCalendar({ label, days }: AttendanceCalendarProps) {
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const today = new Date();

  const currentMonthDays = useMemo(() => days.filter((day) => day.inCurrentMonth), [days]);
  const weekDays = useMemo(() => {
    const todayIndex = currentMonthDays.findIndex((day) => isSameDay(day.date, today));
    if (todayIndex === -1) {
      return currentMonthDays.slice(0, 7);
    }

    const weekStart = Math.floor(todayIndex / 7) * 7;
    return currentMonthDays.slice(weekStart, weekStart + 7);
  }, [currentMonthDays, today]);

  const listDays = useMemo(
    () => currentMonthDays.filter((day) => day.status !== "FUTURE" || day.holidayName || day.leaveType),
    [currentMonthDays],
  );

  const gridDays = view === "month" ? days : weekDays;

  return (
    <Card className="rounded-[2rem] p-5 md:p-6" id="calendar">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Calendar View</p>
          <h3 className="mt-1 text-2xl font-semibold">{label}</h3>
          <p className="mt-2 text-sm text-muted-foreground">Clean month view with attendance, leave, holidays, and weekends.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["PRESENT", "LATE", "LEAVE", "HOLIDAY", "ABSENT"] as const).map((status) => (
            <div key={status} className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs">
              {(() => {
                const Icon = statusIcons[status];
                return <Icon className={cn("h-3.5 w-3.5", status === "ABSENT" ? "text-rose-500" : status === "LATE" ? "text-amber-500" : status === "LEAVE" ? "text-sky-500" : status === "HOLIDAY" ? "text-fuchsia-500" : "text-emerald-500")} />;
              })()}
              {statusStyles[status].label}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => setView("month")} size="sm" type="button" variant={view === "month" ? "default" : "outline"}>
          <Grid2x2 className="mr-2 h-4 w-4" />
          Month
        </Button>
        <Button onClick={() => setView("week")} size="sm" type="button" variant={view === "week" ? "default" : "outline"}>
          <CalendarRange className="mr-2 h-4 w-4" />
          Week
        </Button>
        <Button onClick={() => setView("list")} size="sm" type="button" variant={view === "list" ? "default" : "outline"}>
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
      </div>
      {view !== "list" ? (
        <>
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:gap-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2 md:gap-3">
            {gridDays.map((day) => {
              const Icon = statusIcons[day.status];
              return (
          <div
            key={day.key}
            className={cn(
              "flex min-h-[112px] min-w-0 flex-col overflow-hidden rounded-2xl border p-2.5 text-left md:min-h-[128px] md:p-3",
              statusStyles[day.status].card,
              !day.inCurrentMonth && "opacity-40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-lg font-semibold leading-none">{format(day.date, "d")}</span>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{format(day.date, "EEE")}</p>
              </div>
              <Icon className={cn("mt-1 h-4 w-4 shrink-0", day.status === "ABSENT" ? "text-rose-500" : day.status === "LATE" ? "text-amber-500" : day.status === "LEAVE" ? "text-sky-500" : day.status === "HOLIDAY" ? "text-fuchsia-500" : day.status === "PRESENT" ? "text-emerald-500" : "text-slate-400")} />
            </div>
            <div className="mt-auto min-w-0 space-y-2 overflow-hidden">
              {day.holidayName ? (
                <p className="max-h-8 overflow-hidden break-words text-[11px] font-medium leading-4">{day.holidayName}</p>
              ) : null}
              {!day.holidayName && day.leaveType ? (
                <p className="max-h-8 overflow-hidden break-words text-[11px] font-medium leading-4">{day.leaveType}</p>
              ) : null}
              {day.status !== "FUTURE" ? (
                <div className="inline-flex w-fit items-center gap-1 rounded-full border bg-background/70 px-2 py-1 text-[10px] tracking-[0.12em]">
                  <Icon className="h-3 w-3" />
                  {statusStyles[day.status].label}
                </div>
              ) : null}
            </div>
          </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-3">
          {listDays.map((day) => {
            const Icon = statusIcons[day.status];
            return (
              <div key={day.key} className="flex items-center justify-between rounded-2xl border bg-background/70 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-card">
                    <Icon className={cn("h-4 w-4", day.status === "ABSENT" ? "text-rose-500" : day.status === "LATE" ? "text-amber-500" : day.status === "LEAVE" ? "text-sky-500" : day.status === "HOLIDAY" ? "text-fuchsia-500" : day.status === "PRESENT" ? "text-emerald-500" : "text-slate-400")} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{format(day.date, "EEE, d MMM")}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {day.holidayName ?? day.leaveType ?? statusStyles[day.status].label}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{day.status === "FUTURE" ? "" : statusStyles[day.status].label}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

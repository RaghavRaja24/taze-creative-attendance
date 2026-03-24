import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="rounded-[2rem] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

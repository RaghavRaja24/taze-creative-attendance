"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

type MinimizableSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
};

export function MinimizableSection({
  title,
  description,
  children,
  defaultExpanded = true,
  className,
}: MinimizableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={className}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button onClick={() => setExpanded((value) => !value)} size="sm" type="button" variant="outline">
          {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
          {expanded ? "Minimize" : "Expand"}
        </Button>
      </div>
      {expanded ? children : null}
    </section>
  );
}

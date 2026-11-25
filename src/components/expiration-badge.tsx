"use client";

import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateCZ, getExpirationStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ExpirationBadgeProps {
  label: string;
  date: string | null | undefined;
  compact?: boolean;
  className?: string;
}

export function ExpirationBadge({
  label,
  date,
  compact = false,
  className,
}: ExpirationBadgeProps) {
  const status = getExpirationStatus(date);

  const variant =
    status.severity === "ok"
      ? "ok"
      : status.severity === "warning"
      ? "warning"
      : status.severity === "critical"
      ? "critical"
      : "default";

  const Icon =
    status.severity === "ok"
      ? CheckCircle2
      : status.severity === "warning"
      ? AlertTriangle
      : status.severity === "critical"
      ? ShieldAlert
      : Clock;

  if (compact) {
    return (
      <Badge variant={variant} className={cn("whitespace-nowrap", className)}>
        <Icon className="h-3 w-3" />
        <span>
          {label}: {status.shortLabel}
        </span>
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs",
        className
      )}
    >
      <span className="text-zinc-400 truncate min-w-0">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium text-zinc-200 whitespace-nowrap tabular-nums">
          {date ? formatDateCZ(date) : "—"}
        </span>
        <Badge
          variant={variant}
          className="whitespace-nowrap px-1.5 py-0 text-[10px] leading-4 h-5"
        >
          {status.shortLabel}
        </Badge>
      </div>
    </div>
  );
}

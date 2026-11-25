import type { ServiceCategory } from "@/types/database";

/**
 * Formátuje částku v Kč s mezerami jako oddělovači tisíců (např. `12 450 Kč`).
 */
export function formatCZK(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0 Kč";
  const rounded = Math.round(num);
  const formatted = new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 0,
  })
    .format(rounded)
    .replace(/\u00a0/g, " ");
  return `${formatted} Kč`;
}

/**
 * Formátuje nájezd v km (např. `148 320 km`).
 */
export function formatKm(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0 km";
  const formatted = new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 0,
  })
    .format(Math.round(num))
    .replace(/\u00a0/g, " ");
  return `${formatted} km`;
}

/**
 * Formátuje datum do českého formátu `DD. MM. YYYY`.
 */
export function formatDateCZ(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const parsed = parseIsoDate(dateStr);
  if (!parsed) return "—";
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = parsed.getFullYear();
  return `${dd}. ${mm}. ${yyyy}`;
}

/**
 * Bezpečně parsuje datum ve formátu YYYY-MM-DD bez posunu časové zóny.
 */
export function parseIsoDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(year, month, day);
  }
  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Vrátí dnešní datum ve formátu YYYY-MM-DD (lokální čas).
 */
export function getTodayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type ExpirationSeverity = "ok" | "warning" | "critical" | "unset";

export interface ExpirationStatus {
  daysRemaining: number | null;
  severity: ExpirationSeverity;
  label: string;
  shortLabel: string;
}

/**
 * Vyhodnotí zbývající dny do expirace (STK, dálniční známka, pojištění):
 * - Zelená (`ok`): více než 30 dní
 * - Žlutá/jantarová (`warning`): 8 až 30 dní
 * - Červená (`critical`): 7 dní a méně nebo po termínu
 */
export function getExpirationStatus(dateStr: string | null | undefined): ExpirationStatus {
  if (!dateStr) {
    return {
      daysRemaining: null,
      severity: "unset",
      label: "Nezadáno",
      shortLabel: "Nezadáno",
    };
  }

  const target = parseIsoDate(dateStr);
  if (!target) {
    return {
      daysRemaining: null,
      severity: "unset",
      label: "Neplatné datum",
      shortLabel: "Neplatné",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      daysRemaining: days,
      severity: "critical",
      label: `Propadlé (${absDays} ${pluralDny(absDays)})`,
      shortLabel: `-${absDays} d`,
    };
  }

  if (days === 0) {
    return {
      daysRemaining: 0,
      severity: "critical",
      label: "Končí dnes",
      shortLabel: "Dnes",
    };
  }

  if (days <= 7) {
    return {
      daysRemaining: days,
      severity: "critical",
      label: `Kritické: zbývá ${days} ${pluralDny(days)}`,
      shortLabel: `${days} d`,
    };
  }

  if (days <= 30) {
    return {
      daysRemaining: days,
      severity: "warning",
      label: `Blíží se konec (${days} ${pluralDny(days)})`,
      shortLabel: `${days} d`,
    };
  }

  return {
    daysRemaining: days,
    severity: "ok",
    label: `Platné (${days} ${pluralDny(days)})`,
    shortLabel: `${days} d`,
  };
}

function pluralDny(n: number): string {
  if (n === 1) return "den";
  if (n >= 2 && n <= 4) return "dny";
  return "dní";
}

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  "Pravidelný servis": "#3b82f6",
  "Oprava": "#e11d48",
  "Úpravy / Tuning": "#818cf8",
  "Detailing & Péče": "#10b981",
  "Pneumatiky & Kola": "#64748b",
  "Administrativa / STK / Poplatky": "#71717a",
};

export const CATEGORY_BADGE_CLASSES: Record<ServiceCategory, string> = {
  "Pravidelný servis": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Oprava": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Úpravy / Tuning": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Detailing & Péče": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Pneumatiky & Kola": "bg-slate-500/10 text-slate-300 border-slate-500/20",
  "Administrativa / STK / Poplatky": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

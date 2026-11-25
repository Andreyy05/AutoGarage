"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Camera, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExpirationBadge } from "@/components/expiration-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_COLORS,
  formatCZK,
  formatDateCZ,
  formatKm,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SERVICE_CATEGORIES,
  type ServiceRecord,
  type Vehicle,
} from "@/types/database";

interface DashboardViewProps {
  vehicle: Vehicle;
  records: ServiceRecord[];
  onSelectRecord: (record: ServiceRecord) => void;
  onOpenLog: () => void;
}

export function DashboardView({
  vehicle,
  records,
  onSelectRecord,
  onOpenLog,
}: DashboardViewProps) {
  const [timelineGranularity, setTimelineGranularity] = useState<
    "monthly" | "yearly"
  >("monthly");

  const stats = useMemo(() => {
    const total = records.reduce((s, r) => s + Number(r.total_cost || 0), 0);
    const parts = records.reduce((s, r) => s + Number(r.parts_cost || 0), 0);
    const labor = records.reduce((s, r) => s + Number(r.labor_cost || 0), 0);
    const partsPct = total > 0 ? Math.round((parts / total) * 100) : 0;
    const laborPct = total > 0 ? 100 - partsPct : 0;
    const drivenKm = vehicle.current_mileage - vehicle.initial_mileage;
    const costPerKm =
      drivenKm > 0 && total > 0 ? total / drivenKm : null;

    return { total, parts, labor, partsPct, laborPct, drivenKm, costPerKm };
  }, [records, vehicle.current_mileage, vehicle.initial_mileage]);

  const categoryData = useMemo(() => {
    return SERVICE_CATEGORIES.map((category) => {
      const value = records
        .filter((r) => r.category === category)
        .reduce((s, r) => s + Number(r.total_cost || 0), 0);
      return {
        name: category,
        value,
        color: CATEGORY_COLORS[category],
      };
    })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const timelineData = useMemo(() => {
    const buckets = new Map<
      string,
      { key: string; label: string; parts: number; labor: number }
    >();

    const sorted = [...records].sort((a, b) =>
      a.record_date.localeCompare(b.record_date)
    );

    sorted.forEach((rec) => {
      const key =
        timelineGranularity === "monthly"
          ? rec.record_date.slice(0, 7)
          : rec.record_date.slice(0, 4);

      const label =
        timelineGranularity === "monthly"
          ? `${rec.record_date.slice(5, 7)}/${rec.record_date.slice(2, 4)}`
          : key;

      const current = buckets.get(key) ?? {
        key,
        label,
        parts: 0,
        labor: 0,
      };
      current.parts += Number(rec.parts_cost || 0);
      current.labor += Number(rec.labor_cost || 0);
      buckets.set(key, current);
    });

    const list = Array.from(buckets.values());
    return timelineGranularity === "monthly" ? list.slice(-12) : list;
  }, [records, timelineGranularity]);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => b.record_date.localeCompare(a.record_date))
      .slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-4">
      {/* 4-Column Bento KPI Grid (aligns tightly to content without vertical dead space) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 items-start">
        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">
            Celkové investice
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-white tabular-nums">
            {formatCZK(stats.total)}
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-500 tabular-nums">
            Součet všech {records.length} záznamů v knížce
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">Díly vs. Práce</div>
          <div className="mt-1.5 text-lg font-semibold tracking-tight text-white tabular-nums flex items-baseline gap-1.5 flex-wrap">
            <span>{formatCZK(stats.parts)}</span>
            <span className="text-xs font-normal text-zinc-600">/</span>
            <span className="text-zinc-300">{formatCZK(stats.labor)}</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex">
            <div
              className="bg-[#3B82F6] h-full transition-all"
              style={{ width: `${stats.partsPct}%` }}
            />
            <div
              className="bg-[#64748B] h-full transition-all"
              style={{ width: `${stats.laborPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
              Díly {stats.partsPct} %
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
              Práce {stats.laborPct} %
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400">
            Náklady na 1 km
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-white tabular-nums">
            {stats.costPerKm !== null
              ? `${stats.costPerKm.toFixed(2).replace(".", ",")} Kč/km`
              : "—"}
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-500 tabular-nums">
            {stats.drivenKm > 0
              ? `Najeto ${formatKm(stats.drivenKm)} od pořízení`
              : "Vyplňte počáteční a aktuální nájezd"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-zinc-400 mb-2">
            Platnost dokladů
          </div>
          <div className="divide-y divide-white/[0.06]">
            <ExpirationBadge label="STK" date={vehicle.stk_expires_at} />
            <ExpirationBadge
              label="Dálniční známka"
              date={vehicle.vignette_expires_at}
            />
            {vehicle.insurance_expires_at && (
              <ExpirationBadge
                label="Pojištění"
                date={vehicle.insurance_expires_at}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        <Card className="xl:col-span-5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-100">
              Rozpad nákladů podle kategorií
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Podíl jednotlivých typů servisu a úprav
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {categoryData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-zinc-500">
                Zatím nejsou evidovány žádné výdaje.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="72%"
                        outerRadius="88%"
                        paddingAngle={3}
                        stroke="#111113"
                        strokeWidth={2}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatCZK(Number(val))}
                        contentStyle={{
                          backgroundColor: "#111113",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "8px",
                          color: "#fafafa",
                          fontSize: "12px",
                          boxShadow: "none",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Celkem
                    </span>
                    <span className="text-base font-semibold tracking-tight text-white tabular-nums mt-0.5">
                      {formatCZK(stats.total)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                  {categoryData.map((item) => {
                    const pct =
                      stats.total > 0
                        ? Math.round((item.value / stats.total) * 100)
                        : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-zinc-300 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                          <span className="text-zinc-500 text-[11px]">
                            {pct} %
                          </span>
                          <span className="font-medium text-zinc-100">
                            {formatCZK(item.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-100">
                Vývoj výdajů v čase
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Rozdělení nákladů na díly a práci
              </CardDescription>
            </div>
            <Tabs
              value={timelineGranularity}
              onValueChange={(v) =>
                setTimelineGranularity(v as "monthly" | "yearly")
              }
            >
              <TabsList className="h-7 bg-white/[0.04] border border-white/[0.06]">
                <TabsTrigger value="monthly" className="text-[11px] px-2.5 py-0.5">
                  Měsíčně
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-[11px] px-2.5 py-0.5">
                  Ročně
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            {timelineData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
                Přidejte záznamy pro zobrazení časového grafu.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${Math.round(v / 1000)} tis.` : `${v}`
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      formatter={(val, name) => [
                        formatCZK(Number(val)),
                        name === "parts" ? "Díly" : "Práce / služby",
                      ]}
                      contentStyle={{
                        backgroundColor: "#111113",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        color: "#fafafa",
                        fontSize: "12px",
                        boxShadow: "none",
                      }}
                    />
                    <Bar
                      dataKey="parts"
                      name="parts"
                      stackId="cost"
                      fill="#3B82F6"
                      maxBarSize={44}
                      radius={[0, 0, 2, 2]}
                    />
                    <Bar
                      dataKey="labor"
                      name="labor"
                      stackId="cost"
                      fill="#64748B"
                      maxBarSize={44}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Posledních 5 záznamů (Linear issue style) */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-5 py-3.5 border-b border-white/[0.06] flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-100">
              Poslední aktivita
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Posledních 5 záznamů v servisní historii
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenLog}
            className="text-xs h-7 px-2.5"
          >
            Celá servisní knížka
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentRecords.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              Zatím žádné servisní záznamy.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {recentRecords.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-3 hover:bg-[#18181B] transition-colors text-left cursor-pointer group"
                >
                  <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center self-start sm:self-auto rounded border px-2 py-0.5 text-[11px] font-medium shrink-0",
                        CATEGORY_BADGE_CLASSES[rec.category]
                      )}
                    >
                      {rec.category}
                    </span>
                    <span className="font-medium text-sm text-zinc-100 truncate">
                      {rec.title}
                    </span>
                    <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap shrink-0">
                      {formatDateCZ(rec.record_date)} · {formatKm(rec.mileage)}
                    </span>
                    {(rec.photos?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 tabular-nums shrink-0">
                        <Camera className="h-3 w-3" />
                        {rec.photos?.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-zinc-100 tabular-nums whitespace-nowrap">
                      {formatCZK(rec.total_cost)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

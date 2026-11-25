"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  Filter,
  Pencil,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_BADGE_CLASSES,
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

interface ServiceLogViewProps {
  vehicle: Vehicle;
  records: ServiceRecord[];
  onAddRecord: () => void;
  onSelectRecord: (record: ServiceRecord) => void;
  onEditRecord: (record: ServiceRecord) => void;
}

export function ServiceLogView({
  vehicle,
  records,
  onAddRecord,
  onSelectRecord,
  onEditRecord,
}: ServiceLogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => {
      const y = r.record_date?.slice(0, 4);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records
      .filter((r) => {
        if (categoryFilter !== "ALL" && r.category !== categoryFilter) {
          return false;
        }
        if (yearFilter !== "ALL" && !r.record_date.startsWith(yearFilter)) {
          return false;
        }
        if (q) {
          const haystack = [
            r.title,
            r.oem_codes ?? "",
            r.notes ?? "",
            r.category,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.record_date.localeCompare(a.record_date);
        if (dateCmp !== 0) return dateCmp;
        return b.mileage - a.mileage;
      });
  }, [records, searchQuery, categoryFilter, yearFilter]);

  const filteredTotal = filteredRecords.reduce(
    (sum, r) => sum + Number(r.total_cost || 0),
    0
  );

  const hasFilters =
    searchQuery.trim() !== "" ||
    categoryFilter !== "ALL" ||
    yearFilter !== "ALL";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Servisní knížka
          </h1>
          <p className="text-sm text-zinc-400">
            {vehicle.nickname} ({vehicle.make} {vehicle.model}) — chronologická
            historie údržby a úprav
          </p>
        </div>
        <Button onClick={onAddRecord}>
          <Plus className="h-4 w-4" />
          Nový záznam
        </Button>
      </div>

      {/* Filtrování a fulltextové vyhledávání */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Hledat název úkonu, OEM kód nebo poznámku..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Všechny kategorie</SelectItem>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Všechny roky</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      Rok {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pt-1">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <span>
                Zobrazeno{" "}
                <strong className="text-zinc-200">
                  {filteredRecords.length}
                </strong>{" "}
                z {records.length} záznamů
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("ALL");
                    setYearFilter("ALL");
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-200 hover:bg-zinc-700 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  Zrušit filtry
                </button>
              )}
            </div>
            <div>
              Součet výběru:{" "}
              <strong className="text-sky-300">
                {formatCZK(filteredTotal)}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredRecords.length === 0 ? (
        <Card className="border-dashed border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-400">
              <Wrench className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                {records.length === 0
                  ? "Servisní knížka je zatím prázdná"
                  : "Žádné záznamy neodpovídají filtru"}
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                {records.length === 0
                  ? "Přidejte první záznam o výměně oleje, nákupu dílů nebo úpravě."
                  : "Zkuste upravit hledaný výraz nebo zrušit filtry kategorií a roků."}
              </p>
            </div>
            {records.length === 0 && (
              <Button onClick={onAddRecord}>
                <Plus className="h-4 w-4" />
                Přidat první záznam
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop tabulka */}
          <div className="hidden lg:block rounded-2xl border border-zinc-800/90 bg-[#111114] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="py-3.5 px-4">Datum &amp; Nájezd</th>
                    <th className="py-3.5 px-4">Kategorie</th>
                    <th className="py-3.5 px-4">Úkon / položka</th>
                    <th className="py-3.5 px-4 text-right">Díly</th>
                    <th className="py-3.5 px-4 text-right">Práce</th>
                    <th className="py-3.5 px-4 text-right">Celkem</th>
                    <th className="py-3.5 px-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 text-sm">
                  {filteredRecords.map((rec) => {
                    const photoCount = rec.photos?.length ?? 0;
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className="group hover:bg-zinc-900/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-100">
                            {formatDateCZ(rec.record_date)}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {formatKm(rec.mileage)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              CATEGORY_BADGE_CLASSES[rec.category]
                            )}
                          >
                            {rec.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-100 group-hover:text-sky-300 transition-colors truncate">
                              {rec.title}
                            </span>
                            {photoCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300 shrink-0">
                                <Camera className="h-3 w-3 text-sky-400" />
                                {photoCount}
                              </span>
                            )}
                          </div>
                          {rec.oem_codes && (
                            <div className="font-mono text-[11px] text-zinc-500 mt-0.5 truncate">
                              OEM: {rec.oem_codes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap text-zinc-300">
                          {formatCZK(rec.parts_cost)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap text-zinc-300">
                          {formatCZK(rec.labor_cost)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-white">
                          {formatCZK(rec.total_cost)}
                        </td>
                        <td
                          className="py-3.5 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Upravit záznam"
                            onClick={() => onEditRecord(rec)}
                          >
                            <Pencil className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobilní seznam karet */}
          <div className="lg:hidden space-y-3">
            {filteredRecords.map((rec) => {
              const photoCount = rec.photos?.length ?? 0;
              return (
                <Card
                  key={rec.id}
                  onClick={() => onSelectRecord(rec)}
                  className="cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          CATEGORY_BADGE_CLASSES[rec.category]
                        )}
                      >
                        {rec.category}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatDateCZ(rec.record_date)} •{" "}
                        {formatKm(rec.mileage)}
                      </span>
                    </div>

                    <div className="font-semibold text-zinc-100 leading-snug">
                      {rec.title}
                    </div>

                    {rec.oem_codes && (
                      <div className="font-mono text-[11px] text-zinc-500 truncate">
                        OEM: {rec.oem_codes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>Díly: {formatCZK(rec.parts_cost)}</span>
                        <span>•</span>
                        <span>Práce: {formatCZK(rec.labor_cost)}</span>
                        {photoCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-sky-400 ml-1">
                            <Camera className="h-3.5 w-3.5" />
                            {photoCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-white">
                        {formatCZK(rec.total_cost)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

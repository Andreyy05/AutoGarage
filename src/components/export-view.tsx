"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCZK, formatDateCZ, formatKm, getTodayIso } from "@/lib/format";
import type { ServiceRecord, Vehicle } from "@/types/database";

interface ExportViewProps {
  vehicle: Vehicle;
  records: ServiceRecord[];
}

export function ExportView({ vehicle, records }: ExportViewProps) {
  const [showPrices, setShowPrices] = useState(true);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateCmp = a.record_date.localeCompare(b.record_date);
      if (dateCmp !== 0) return dateCmp;
      return a.mileage - b.mileage;
    });
  }, [records]);

  const totals = useMemo(() => {
    const parts = sortedRecords.reduce(
      (s, r) => s + Number(r.parts_cost || 0),
      0
    );
    const labor = sortedRecords.reduce(
      (s, r) => s + Number(r.labor_cost || 0),
      0
    );
    const total = parts + labor;
    return { parts, labor, total };
  }, [sortedRecords]);

  return (
    <div className="space-y-5">
      {/* Ovládací panel (skryje se při tisku) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#111114] p-4 sm:p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Export servisní knížky (PDF)
          </h1>
          <p className="text-sm text-zinc-400">
            Čistý tiskový dokument ve světlém režimu připravený pro předání
            kupujícímu nebo archivaci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Switch
              id="toggle-prices"
              checked={showPrices}
              onCheckedChange={setShowPrices}
            />
            <Label
              htmlFor="toggle-prices"
              className="text-xs normal-case tracking-normal text-zinc-200 cursor-pointer"
            >
              Zobrazit ceny v exportu
            </Label>
          </div>

          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exportovat PDF / Tisknout
          </Button>
        </div>
      </div>

      {/* Tiskový list A4 ve světlém režimu */}
      <div className="mx-auto max-w-[900px] rounded-2xl border border-zinc-300 bg-white text-zinc-900 shadow-xl p-6 sm:p-10 print:border-0 print:shadow-none print:p-0 print:rounded-none">
        {/* Hlavička dokumentu */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-zinc-900 pb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Elektronická servisní knížka • AutoGaráž
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mt-1">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-zinc-600 mt-0.5">
              Rok výroby {vehicle.year}
              {vehicle.license_plate ? ` • SPZ: ${vehicle.license_plate}` : ""}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-zinc-600">
            <div>Datum vyhotovení: {formatDateCZ(getTodayIso())}</div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              Aktuální nájezd: {formatKm(vehicle.current_mileage)}
            </div>
          </div>
        </header>

        {/* Technické specifikace vozidla */}
        <section className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs print-break-inside-avoid">
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              VIN kód
            </div>
            <div className="font-mono font-semibold text-zinc-900 mt-0.5">
              {vehicle.vin || "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              Kód motoru / Specifikace
            </div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              {[vehicle.engine_spec, vehicle.engine_code]
                .filter(Boolean)
                .join(" • ") || "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              Kód laku
            </div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              {vehicle.paint_code || "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              Palivo
            </div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              {vehicle.fuel_type || "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              Platnost STK
            </div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              {vehicle.stk_expires_at
                ? formatDateCZ(vehicle.stk_expires_at)
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px]">
              Počet záznamů
            </div>
            <div className="font-semibold text-zinc-900 mt-0.5">
              {sortedRecords.length}
            </div>
          </div>
        </section>

        {/* Tabulka servisní historie */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 mb-3">
            Chronologický přehled servisních úkonů
          </h3>

          {sortedRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500">
              Pro toto vozidlo nejsou evidovány žádné servisní záznamy.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-y border-zinc-300 bg-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                    <th className="py-2.5 px-2.5">Datum</th>
                    <th className="py-2.5 px-2.5">Nájezd</th>
                    <th className="py-2.5 px-2.5">Kategorie</th>
                    <th className="py-2.5 px-2.5">Popis úkonu</th>
                    {showPrices && (
                      <>
                        <th className="py-2.5 px-2.5 text-right">Díly</th>
                        <th className="py-2.5 px-2.5 text-right">Práce</th>
                        <th className="py-2.5 px-2.5 text-right">Celkem</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {sortedRecords.map((rec) => (
                    <tr key={rec.id} className="print-break-inside-avoid align-top">
                      <td className="py-2.5 px-2.5 whitespace-nowrap font-medium text-zinc-900">
                        {formatDateCZ(rec.record_date)}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-zinc-700">
                        {formatKm(rec.mileage)}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-zinc-700">
                        {rec.category}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <div className="font-semibold text-zinc-900">
                          {rec.title}
                        </div>
                        {rec.oem_codes && (
                          <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                            OEM: {rec.oem_codes}
                          </div>
                        )}
                        {rec.notes && (
                          <div className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                            {rec.notes}
                          </div>
                        )}
                      </td>
                      {showPrices && (
                        <>
                          <td className="py-2.5 px-2.5 text-right whitespace-nowrap text-zinc-700">
                            {formatCZK(rec.parts_cost)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right whitespace-nowrap text-zinc-700">
                            {formatCZK(rec.labor_cost)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right whitespace-nowrap font-semibold text-zinc-950">
                            {formatCZK(rec.total_cost)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Souhrn na konci dokumentu */}
        <footer className="mt-6 pt-4 border-t-2 border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-break-inside-avoid">
          <div className="text-xs text-zinc-600">
            Celkem zaevidovaných úkonů:{" "}
            <strong className="text-zinc-900">{sortedRecords.length}</strong>
          </div>

          {showPrices ? (
            <div className="flex flex-wrap items-center gap-5 text-xs">
              <div>
                <span className="text-zinc-500">Díly celkem: </span>
                <strong className="text-zinc-900">
                  {formatCZK(totals.parts)}
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Práce celkem: </span>
                <strong className="text-zinc-900">
                  {formatCZK(totals.labor)}
                </strong>
              </div>
              <div className="rounded-lg bg-zinc-100 border border-zinc-300 px-3 py-1.5 text-sm">
                <span className="text-zinc-600">Celkové investice: </span>
                <strong className="text-zinc-950">
                  {formatCZK(totals.total)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-zinc-500">
              Ceny jsou v tomto výpisu na přání majitele skryty.
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

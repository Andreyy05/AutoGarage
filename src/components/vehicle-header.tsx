"use client";

import { useState } from "react";
import { Check, Copy, ImagePlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKm } from "@/lib/format";
import type { Vehicle } from "@/types/database";

interface VehicleHeaderProps {
  vehicle: Vehicle;
  onEdit: () => void;
}

export function VehicleHeader({ vehicle, onEdit }: VehicleHeaderProps) {
  const [copiedVin, setCopiedVin] = useState(false);

  async function handleCopyVin() {
    if (!vehicle.vin) return;
    try {
      await navigator.clipboard.writeText(vehicle.vin);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 1800);
    } catch {
      // Fallback ignorován
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111113] overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Kompaktní náhled fotky pouze pokud existuje */}
        {vehicle.cover_photo_url && (
          <div className="relative h-36 sm:h-auto sm:w-52 shrink-0 bg-zinc-950 border-b sm:border-b-0 sm:border-r border-white/[0.07] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vehicle.cover_photo_url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Hlavní obsah hlavičky */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Horní pruh: Název vozu + SPZ + akce */}
          <div className="px-4 sm:px-5 py-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-blue-400">
                  {vehicle.nickname}
                </span>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-400 tabular-nums">
                  {vehicle.year}
                </span>
                {vehicle.license_plate && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wider text-zinc-200 tabular-nums">
                      {vehicle.license_plate}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white mt-1 truncate">
                {vehicle.make} {vehicle.model}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!vehicle.cover_photo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-zinc-400 hover:text-zinc-100 border border-dashed border-white/[0.1] hover:border-white/[0.18] bg-white/[0.02]"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  + Nahrát foto vozu
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Upravit vozidlo
              </Button>
            </div>
          </div>

          {/* Technické specifikace s jemnými dělicími linkami */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-white/[0.07] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] bg-white/[0.015]">
            <SpecCell
              label="Aktuální nájezd"
              value={formatKm(vehicle.current_mileage)}
              highlight
            />
            <SpecCell
              label="Motor"
              value={
                [vehicle.engine_spec, vehicle.engine_code]
                  .filter(Boolean)
                  .join(" · ") || "Nezadáno"
              }
            />
            <SpecCell label="Palivo" value={vehicle.fuel_type || "Nezadáno"} />
            <SpecCell
              label="Kód laku"
              value={vehicle.paint_code || "Nezadáno"}
            />
          </div>

          {/* Spodní lišta: pouze VIN kopírování (bez duplicitních dokladů) */}
          <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 shrink-0">
                VIN
              </span>
              {vehicle.vin ? (
                <button
                  type="button"
                  onClick={handleCopyVin}
                  title="Zkopírovat VIN kód"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-[#09090B] px-2 py-0.5 font-mono text-xs text-zinc-200 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer truncate tabular-nums"
                >
                  <span className="truncate">{vehicle.vin}</span>
                  {copiedVin ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 shrink-0 font-sans text-[11px]">
                      <Check className="h-3 w-3" />
                      Zkopírováno
                    </span>
                  ) : (
                    <Copy className="h-3 w-3 text-zinc-500 shrink-0" />
                  )}
                </button>
              ) : (
                <span className="text-xs text-zinc-500">Nezadáno</span>
              )}
            </div>

            {vehicle.notes && (
              <span className="hidden md:block text-xs text-zinc-500 truncate max-w-md">
                {vehicle.notes}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-4 py-2.5 min-w-0">
      <div className="text-[11px] text-zinc-500 truncate">{label}</div>
      <div
        className={`mt-0.5 text-xs sm:text-sm font-medium truncate tabular-nums ${
          highlight ? "text-white font-semibold" : "text-zinc-200"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

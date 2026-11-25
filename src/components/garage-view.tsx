"use client";

import { CarFront, CheckCircle2, Gauge, Pencil, Plus } from "lucide-react";
import { ExpirationBadge } from "@/components/expiration-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCZK, formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServiceRecord, Vehicle } from "@/types/database";

interface GarageViewProps {
  vehicles: Vehicle[];
  records: ServiceRecord[];
  activeVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export function GarageView({
  vehicles,
  records,
  activeVehicleId,
  onSelectVehicle,
  onAddVehicle,
  onEditVehicle,
}: GarageViewProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Moje garáž
          </h1>
          <p className="text-sm text-zinc-400">
            Spravujte více vozidel, jejich technické kódy a platnost dokladů.
          </p>
        </div>
        <Button onClick={onAddVehicle}>
          <Plus className="h-4 w-4" />
          Přidat vozidlo
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card className="border-dashed border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sky-400">
              <CarFront className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                Zatím nemáte žádné vozidlo
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                Přidejte své první auto a začněte evidovat servisní zásahy,
                díly a expirace STK.
              </p>
            </div>
            <Button onClick={onAddVehicle}>
              <Plus className="h-4 w-4" />
              Přidat první vozidlo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => {
            const isSelected = vehicle.id === activeVehicleId;
            const vehicleRecords = records.filter(
              (r) => r.vehicle_id === vehicle.id
            );
            const totalSpent = vehicleRecords.reduce(
              (sum, r) => sum + Number(r.total_cost || 0),
              0
            );

            return (
              <Card
                key={vehicle.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isSelected
                    ? "border-sky-400/60 ring-1 ring-sky-400/30"
                    : "hover:border-zinc-700"
                )}
              >
                <div className="relative h-40 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-center overflow-hidden">
                  {vehicle.cover_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vehicle.cover_photo_url}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CarFront className="h-12 w-12 text-zinc-700" />
                  )}

                  {vehicle.license_plate && (
                    <span className="absolute left-3 top-3 rounded-md border border-zinc-700 bg-zinc-950/90 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-100">
                      {vehicle.license_plate}
                    </span>
                  )}

                  {isSelected && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/15 px-2.5 py-0.5 text-xs font-medium text-sky-300 backdrop-blur">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Vybrané vozidlo
                    </span>
                  )}
                </div>

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                        {vehicle.nickname} • {vehicle.year}
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[vehicle.engine_spec, vehicle.fuel_type]
                          .filter(Boolean)
                          .join(" • ") || "Specifikace nevyplněny"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Upravit vozidlo"
                      onClick={() => onEditVehicle(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-center">
                    <div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1">
                        <Gauge className="h-3 w-3" />
                        Nájezd
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-zinc-100 mt-0.5">
                        {formatKm(vehicle.current_mileage)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-400">Záznamů</div>
                      <div className="text-xs sm:text-sm font-semibold text-zinc-100 mt-0.5">
                        {vehicleRecords.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-400">Investice</div>
                      <div className="text-xs sm:text-sm font-semibold text-sky-300 mt-0.5">
                        {formatCZK(totalSpent)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <ExpirationBadge
                      label="STK"
                      date={vehicle.stk_expires_at}
                      compact
                    />
                    <ExpirationBadge
                      label="Známka"
                      date={vehicle.vignette_expires_at}
                      compact
                    />
                    {vehicle.insurance_expires_at && (
                      <ExpirationBadge
                        label="Pojištění"
                        date={vehicle.insurance_expires_at}
                        compact
                      />
                    )}
                  </div>

                  <Button
                    variant={isSelected ? "secondary" : "default"}
                    className="w-full"
                    onClick={() => onSelectVehicle(vehicle.id)}
                  >
                    {isSelected
                      ? "Aktuálně zobrazeno"
                      : "Přepnout na toto vozidlo"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

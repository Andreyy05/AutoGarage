"use client";

import { useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FUEL_TYPES, type Vehicle, type VehicleFormValues } from "@/types/database";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSave: (
    values: VehicleFormValues,
    options?: {
      vehicleId?: string;
      coverFile?: File | null;
      removeCover?: boolean;
    }
  ) => Promise<unknown>;
  onDelete?: (vehicleId: string) => Promise<void>;
}

const EMPTY_FORM: VehicleFormValues = {
  nickname: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  license_plate: "",
  initial_mileage: 0,
  current_mileage: 0,
  vin: "",
  engine_code: "",
  paint_code: "",
  fuel_type: "Benzín",
  engine_spec: "",
  stk_expires_at: "",
  vignette_expires_at: "",
  insurance_expires_at: "",
  notes: "",
};

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onSave,
  onDelete,
}: VehicleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Upravit vozidlo" : "Přidat nové vozidlo"}
          </DialogTitle>
          <DialogDescription>
            Základní údaje, technické specifikace a hlídání platnosti STK či
            dálniční známky.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <VehicleFormInner
            key={vehicle?.id ?? "new-vehicle"}
            vehicle={vehicle}
            onOpenChange={onOpenChange}
            onSave={onSave}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function VehicleFormInner({
  vehicle,
  onOpenChange,
  onSave,
  onDelete,
}: Omit<VehicleFormDialogProps, "open">) {
  const [form, setForm] = useState<VehicleFormValues>(() =>
    vehicle
      ? {
          nickname: vehicle.nickname,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          license_plate: vehicle.license_plate ?? "",
          initial_mileage: vehicle.initial_mileage,
          current_mileage: vehicle.current_mileage,
          vin: vehicle.vin ?? "",
          engine_code: vehicle.engine_code ?? "",
          paint_code: vehicle.paint_code ?? "",
          fuel_type: vehicle.fuel_type ?? "Benzín",
          engine_spec: vehicle.engine_spec ?? "",
          stk_expires_at: vehicle.stk_expires_at ?? "",
          vignette_expires_at: vehicle.vignette_expires_at ?? "",
          insurance_expires_at: vehicle.insurance_expires_at ?? "",
          notes: vehicle.notes ?? "",
        }
      : EMPTY_FORM
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    vehicle?.cover_photo_url ?? null
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setRemoveCover(false);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nickname.trim() || !form.make.trim() || !form.model.trim()) {
      setError("Vyplňte prosím přezdívku, značku a model vozidla.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(form, {
        vehicleId: vehicle?.id,
        coverFile,
        removeCover,
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Uložení vozidla se nezdařilo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!vehicle || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(vehicle.id);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Smazání vozidla se nezdařilo."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Úvodní fotografie */}
          <div className="space-y-2">
            <Label>Úvodní fotografie vozidla</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative h-28 w-full sm:w-44 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center shrink-0">
                {coverPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview}
                      alt="Náhled vozidla"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Odstranit fotografii"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setRemoveCover(true);
                      }}
                      className="absolute right-1.5 top-1.5 rounded-full bg-zinc-950/80 p-1 text-zinc-200 hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500">Bez fotky</span>
                )}
              </div>

              <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer">
                <ImagePlus className="h-4 w-4 text-sky-400" />
                <span>{coverPreview ? "Změnit fotku" : "Nahrát fotku"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleCoverSelect}
                />
              </label>
            </div>
          </div>

          {/* Základní údaje */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="veh-nickname">Název / přezdívka auta *</Label>
              <Input
                id="veh-nickname"
                required
                placeholder="Např. Daily RS nebo Víkendovka"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-spz">SPZ / Registrační značka</Label>
              <Input
                id="veh-spz"
                placeholder="Např. 5AL 4829"
                value={form.license_plate}
                onChange={(e) =>
                  setForm({ ...form, license_plate: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-make">Značka *</Label>
              <Input
                id="veh-make"
                required
                placeholder="Např. Škoda"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-model">Model *</Label>
              <Input
                id="veh-model"
                required
                placeholder="Např. Octavia RS Combi"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-year">Rok výroby *</Label>
              <Input
                id="veh-year"
                type="number"
                min={1900}
                max={2100}
                required
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Palivo</Label>
              <Select
                value={form.fuel_type || "Benzín"}
                onValueChange={(val) => setForm({ ...form, fuel_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte palivo" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-init-km">Počáteční nájezd při koupi (km)</Label>
              <Input
                id="veh-init-km"
                type="number"
                min={0}
                value={form.initial_mileage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initial_mileage: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="veh-curr-km">Aktuální nájezd (km)</Label>
              <Input
                id="veh-curr-km"
                type="number"
                min={0}
                value={form.current_mileage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    current_mileage: Math.max(0, Number(e.target.value)),
                  })
                }
              />
            </div>
          </div>

          {/* Technické specifikace */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Technické specifikace
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="veh-vin">VIN kód</Label>
                <Input
                  id="veh-vin"
                  placeholder="17znakový identifikační kód vozidla"
                  className="font-mono uppercase"
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="veh-engine-spec">Objem / výkon</Label>
                <Input
                  id="veh-engine-spec"
                  placeholder="Např. 2.0 TSI / 180 kW"
                  value={form.engine_spec}
                  onChange={(e) =>
                    setForm({ ...form, engine_spec: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="veh-engine-code">Kód motoru</Label>
                <Input
                  id="veh-engine-code"
                  placeholder="Např. DKTB"
                  className="font-mono uppercase"
                  value={form.engine_code}
                  onChange={(e) =>
                    setForm({ ...form, engine_code: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="veh-paint-code">Kód laku</Label>
                <Input
                  id="veh-paint-code"
                  placeholder="Např. LF9R / 1Z1Z (Černá Magic)"
                  value={form.paint_code}
                  onChange={(e) =>
                    setForm({ ...form, paint_code: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Termíny a expirace */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Termíny &amp; Expirace
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="veh-stk">Platnost STK</Label>
                <Input
                  id="veh-stk"
                  type="date"
                  value={form.stk_expires_at}
                  onChange={(e) =>
                    setForm({ ...form, stk_expires_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="veh-vignette">Dálniční známka</Label>
                <Input
                  id="veh-vignette"
                  type="date"
                  value={form.vignette_expires_at}
                  onChange={(e) =>
                    setForm({ ...form, vignette_expires_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="veh-insurance">Pojištění (volitelné)</Label>
                <Input
                  id="veh-insurance"
                  type="date"
                  value={form.insurance_expires_at}
                  onChange={(e) =>
                    setForm({ ...form, insurance_expires_at: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="veh-notes">Poznámky k vozidlu</Label>
            <Textarea
              id="veh-notes"
              placeholder="Např. doporučený olej, rozměry kol, servisní intervaly..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            {vehicle && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Mažu..." : "Potvrdit smazání"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Zrušit
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Smazat vozidlo
                </Button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Ukládám..."
                  : vehicle
                  ? "Uložit změny"
                  : "Přidat vozidlo"}
              </Button>
            </div>
          </div>
        </form>
  );
}

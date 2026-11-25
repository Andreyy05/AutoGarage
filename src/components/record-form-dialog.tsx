"use client";

import { useState } from "react";
import { Camera, Gauge, Trash2, UploadCloud, X } from "lucide-react";
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
import { formatCZK, formatKm, getTodayIso } from "@/lib/format";
import {
  SERVICE_CATEGORIES,
  type RecordPhoto,
  type ServiceCategory,
  type ServiceRecord,
  type ServiceRecordFormValues,
  type Vehicle,
} from "@/types/database";

interface RecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  record?: ServiceRecord | null;
  onSave: (
    values: ServiceRecordFormValues,
    options?: {
      recordId?: string;
      newFiles?: File[];
      removedPhotoIds?: string[];
      updateVehicleMileage?: boolean;
    }
  ) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

export function RecordFormDialog({
  open,
  onOpenChange,
  vehicle,
  record,
  onSave,
  onDelete,
}: RecordFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {record ? "Upravit servisní záznam" : "Nový záznam do servisní knížky"}
          </DialogTitle>
          <DialogDescription>
            {vehicle
              ? `${vehicle.nickname} — ${vehicle.make} ${vehicle.model}`
              : "Vyberte vozidlo"}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RecordFormInner
            key={`${record?.id ?? "new-record"}-${vehicle?.id ?? "none"}`}
            vehicle={vehicle}
            record={record}
            onOpenChange={onOpenChange}
            onSave={onSave}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecordFormInner({
  vehicle,
  record,
  onOpenChange,
  onSave,
  onDelete,
}: Omit<RecordFormDialogProps, "open">) {
  const [title, setTitle] = useState(record?.title ?? "");
  const [category, setCategory] = useState<ServiceCategory>(
    record?.category ?? "Pravidelný servis"
  );
  const [recordDate, setRecordDate] = useState(
    record?.record_date ?? getTodayIso()
  );
  const [mileage, setMileage] = useState(
    record?.mileage ?? vehicle?.current_mileage ?? 0
  );
  const [partsCost, setPartsCost] = useState(record?.parts_cost ?? 0);
  const [laborCost, setLaborCost] = useState(record?.labor_cost ?? 0);
  const [oemCodes, setOemCodes] = useState(record?.oem_codes ?? "");
  const [productUrl, setProductUrl] = useState(record?.product_url ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [updateMileage, setUpdateMileage] = useState(true);

  const [existingPhotos] = useState<RecordPhoto[]>(record?.photos ?? []);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCost = (Number(partsCost) || 0) + (Number(laborCost) || 0);
  const isMileageHigher =
    Boolean(vehicle) && mileage > (vehicle?.current_mileage ?? 0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const added: PendingFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle) return;
    if (!title.trim()) {
      setError("Zadejte prosím název úkonu nebo položky.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          vehicle_id: vehicle.id,
          title: title.trim(),
          category,
          record_date: recordDate,
          mileage: Math.max(0, Number(mileage) || 0),
          parts_cost: Math.max(0, Number(partsCost) || 0),
          labor_cost: Math.max(0, Number(laborCost) || 0),
          oem_codes: oemCodes,
          product_url: productUrl,
          notes,
        },
        {
          recordId: record?.id,
          newFiles: pendingFiles.map((p) => p.file),
          removedPhotoIds,
          updateVehicleMileage: isMileageHigher && updateMileage,
        }
      );
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se uložit záznam."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!record || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(record.id);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se smazat záznam."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="rec-title">Název úkonu / položky *</Label>
            <Input
              id="rec-title"
              required
              placeholder="Např. Výměna motorového oleje a filtrů"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5 sm:col-span-1">
              <Label>Kategorie *</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as ServiceCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-date">Datum *</Label>
              <Input
                id="rec-date"
                type="date"
                required
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-km">Stav tachometru (km) *</Label>
              <Input
                id="rec-km"
                type="number"
                min={0}
                required
                value={mileage}
                onChange={(e) => setMileage(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          {isMileageHigher && vehicle && (
            <label className="flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-200 cursor-pointer">
              <input
                type="checkbox"
                checked={updateMileage}
                onChange={(e) => setUpdateMileage(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-sky-400 rounded cursor-pointer"
              />
              <span>
                <span className="font-semibold inline-flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  Aktualizovat aktuální nájezd vozidla
                </span>{" "}
                z {formatKm(vehicle.current_mileage)} na{" "}
                <strong className="text-white">{formatKm(mileage)}</strong>
              </span>
            </label>
          )}

          {/* Rozdělené náklady */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="rec-parts">Cena za díly (Kč)</Label>
              <Input
                id="rec-parts"
                type="number"
                min={0}
                step="1"
                value={partsCost}
                onChange={(e) =>
                  setPartsCost(Math.max(0, Number(e.target.value)))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-labor">Cena za práci / služby (Kč)</Label>
              <Input
                id="rec-labor"
                type="number"
                min={0}
                step="1"
                value={laborCost}
                onChange={(e) =>
                  setLaborCost(Math.max(0, Number(e.target.value)))
                }
              />
            </div>
            <div className="flex flex-col justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                Celková cena
              </span>
              <span className="text-lg font-bold text-sky-300 mt-0.5">
                {formatCZK(totalCost)}
              </span>
            </div>
          </div>

          {/* Volitelné detaily */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="rec-oem">Čísla dílů / OEM kódy</Label>
              <Input
                id="rec-oem"
                placeholder="Např. 06L115562B, 5Q0129620B"
                className="font-mono text-xs"
                value={oemCodes}
                onChange={(e) => setOemCodes(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-url">Odkaz na produkt / e-shop</Label>
              <Input
                id="rec-url"
                type="url"
                placeholder="https://..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rec-notes">Detailní poznámka</Label>
            <Textarea
              id="rec-notes"
              placeholder="Servisní postup, utahovací momenty, stav starých dílů..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Fotogalerie záznamu */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <Label>Fotogalerie (účtenky, díly, postup)</Label>
              <span className="text-[11px] text-zinc-500">
                Automatická komprese před nahráním
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {existingPhotos
                .filter((p) => !removedPhotoIds.includes(p.id))
                .map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-20 w-20 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950"
                  >
                    {photo.signed_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.signed_url}
                        alt={photo.caption || "Fotografie"}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Odebrat fotografii"
                      onClick={() =>
                        setRemovedPhotoIds((prev) => [...prev, photo.id])
                      }
                      className="absolute right-1 top-1 rounded-full bg-zinc-950/85 p-1 text-zinc-200 hover:bg-rose-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

              {pendingFiles.map((item) => (
                <div
                  key={item.id}
                  className="relative h-20 w-20 rounded-xl border border-sky-500/40 overflow-hidden bg-zinc-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Odebrat fotografii"
                    onClick={() =>
                      setPendingFiles((prev) =>
                        prev.filter((p) => p.id !== item.id)
                      )
                    }
                    className="absolute right-1 top-1 rounded-full bg-zinc-950/85 p-1 text-zinc-200 hover:bg-rose-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <label className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 text-xs text-zinc-400 hover:border-sky-400/60 hover:text-zinc-200 transition-colors cursor-pointer">
                <UploadCloud className="h-5 w-5 text-sky-400" />
                <span>Vybrat fotky</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>

              <label className="sm:hidden flex h-20 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 text-xs text-zinc-400 hover:border-sky-400/60 hover:text-zinc-200 transition-colors cursor-pointer">
                <Camera className="h-5 w-5 text-sky-400" />
                <span>Vyfotit</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            {record && onDelete ? (
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
                  Smazat záznam
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
                  : record
                  ? "Uložit změny"
                  : "Přidat záznam"}
              </Button>
            </div>
          </div>
        </form>
  );
}

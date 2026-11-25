"use client";

import { useState } from "react";
import {
  Calendar,
  ExternalLink,
  Gauge,
  ImageIcon,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoLightbox } from "@/components/photo-lightbox";
import {
  CATEGORY_BADGE_CLASSES,
  formatCZK,
  formatDateCZ,
  formatKm,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServiceRecord } from "@/types/database";

interface RecordDetailDialogProps {
  record: ServiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (record: ServiceRecord) => void;
  onDelete: (recordId: string) => Promise<void>;
}

export function RecordDetailDialog({
  record,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: RecordDetailDialogProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!record) return null;

  const photos = (record.photos ?? []).filter((p) => Boolean(p.signed_url));

  async function handleDelete() {
    if (!record) return;
    setDeleting(true);
    try {
      await onDelete(record.id);
      setConfirmDelete(false);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  CATEGORY_BADGE_CLASSES[record.category]
                )}
              >
                {record.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateCZ(record.record_date)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                <Gauge className="h-3.5 w-3.5" />
                {formatKm(record.mileage)}
              </span>
            </div>
            <DialogTitle className="text-xl">{record.title}</DialogTitle>
            <DialogDescription>
              Detail servisního úkonu a přehled nákladů
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Náklady */}
            <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <div>
                <div className="text-xs text-zinc-400">Díly</div>
                <div className="text-sm sm:text-base font-semibold text-zinc-100 mt-0.5">
                  {formatCZK(record.parts_cost)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Práce / služby</div>
                <div className="text-sm sm:text-base font-semibold text-zinc-100 mt-0.5">
                  {formatCZK(record.labor_cost)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Celkem</div>
                <div className="text-sm sm:text-base font-bold text-sky-300 mt-0.5">
                  {formatCZK(record.total_cost)}
                </div>
              </div>
            </div>

            {/* OEM a Odkaz */}
            {(record.oem_codes || record.product_url) && (
              <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-sm">
                {record.oem_codes && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-zinc-400">
                        Čísla dílů / OEM kódy
                      </div>
                      <div className="font-mono text-xs text-zinc-200 mt-0.5">
                        {record.oem_codes}
                      </div>
                    </div>
                  </div>
                )}
                {record.product_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <ExternalLink className="h-4 w-4 text-sky-400 shrink-0" />
                    <a
                      href={record.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:underline truncate"
                    >
                      {record.product_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Poznámka */}
            {record.notes && (
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Poznámka
                </div>
                <p className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {record.notes}
                </p>
              </div>
            )}

            {/* Fotogalerie */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">
                <ImageIcon className="h-3.5 w-3.5" />
                Fotogalerie ({photos.length})
              </div>
              {photos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-center text-xs text-zinc-500">
                  K tomuto záznamu nebyly přiloženy žádné fotografie.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {photos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-square rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.signed_url!}
                        alt={photo.caption || "Servisní fotografie"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Akce */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? "Mažu..." : "Potvrdit smazání"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Zrušit
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Smazat
                </Button>
              )}

              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit(record);
                }}
              >
                <Pencil className="h-4 w-4" />
                Upravit záznam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PhotoLightbox
        images={photos.map((p) => ({
          id: p.id,
          url: p.signed_url!,
          caption: p.caption,
        }))}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </>
  );
}

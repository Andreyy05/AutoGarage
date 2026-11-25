"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxImage {
  id: string;
  url: string;
  caption?: string | null;
}

interface PhotoLightboxProps {
  images: LightboxImage[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export function PhotoLightbox({
  images,
  activeIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const isOpen = activeIndex !== null && images[activeIndex] !== undefined;

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) {
        onNavigate((activeIndex - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        onNavigate((activeIndex + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, activeIndex, images.length, onClose, onNavigate]);

  if (!isOpen || activeIndex === null) return null;

  const current = images[activeIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm text-zinc-300">
          Fotografie {activeIndex + 1} z {images.length}
          {current.caption ? ` — ${current.caption}` : ""}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavřít náhled"
          className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={() =>
              onNavigate((activeIndex - 1 + images.length) % images.length)
            }
            aria-label="Předchozí fotografie"
            className="absolute left-3 sm:left-6 z-10 rounded-full bg-zinc-900/80 border border-zinc-700 p-2.5 text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || "Servisní fotografie"}
          className="max-h-[82dvh] max-w-full rounded-lg object-contain shadow-2xl"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((activeIndex + 1) % images.length)}
            aria-label="Další fotografie"
            className="absolute right-3 sm:right-6 z-10 rounded-full bg-zinc-900/80 border border-zinc-700 p-2.5 text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

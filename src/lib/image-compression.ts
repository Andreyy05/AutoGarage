/**
 * Klientská komprese obrázku před nahráním do Supabase Storage.
 * Ideální pro rychlé focení účtenek a dílů v garáži z telefonu (iOS Safari).
 */
export async function compressImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const { maxDimension = 1600, quality = 0.82 } = options;

  // Pokud nejde o podporovaný rastrový obrázek v canvasu, vrátíme originál
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await loadImageBitmapOrElement(file);
    const { width, height } = bitmap;

    let targetWidth = width;
    let targetHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        targetWidth = maxDimension;
        targetHeight = Math.round((height / width) * maxDimension);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((width / height) * maxDimension);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap.source, 0, 0, targetWidth, targetHeight);
    if (bitmap.cleanup) bitmap.cleanup();

    const outputType = "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, quality)
    );

    if (!blob) return file;

    // Pokud by byl zkomprimovaný soubor větší než originál, ponecháme originál
    if (blob.size >= file.size && file.type === "image/jpeg") {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

async function loadImageBitmapOrElement(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup?: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return {
        source: bmp,
        width: bmp.width,
        height: bmp.height,
        cleanup: () => bmp.close(),
      };
    } catch {
      // Fallback na HTMLImageElement níže
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

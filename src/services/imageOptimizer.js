// services/imageOptimizer.js
// Automatic image resize + compress before upload
// Targets: mobile performance, reduced storage, faster load

/**
 * Resize + compress an image File/Blob to target dimensions.
 * Returns a compressed Blob.
 *
 * @param {File|Blob} file          - Input image
 * @param {object}    opts
 * @param {number}    opts.maxWidth  - Max width px (default 1200)
 * @param {number}    opts.maxHeight - Max height px (default 1200)
 * @param {number}    opts.quality   - JPEG quality 0-1 (default 0.82)
 * @param {string}    opts.format    - Output MIME type (default 'image/jpeg')
 * @returns {Promise<{blob, dataUrl, width, height, originalSize, newSize, saving}>}
 */
export async function optimizeImage(file, opts = {}) {
  const {
    maxWidth  = 1200,
    maxHeight = 1200,
    quality   = 0.82,
    format    = "image/jpeg",
  } = opts;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => {
        // Calculate target dimensions (maintain aspect ratio)
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        // Draw to canvas
        const canvas    = document.createElement("canvas");
        canvas.width    = width;
        canvas.height   = height;
        const ctx       = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
            const originalSize = file.size;
            const newSize      = blob.size;
            const saving       = Math.round((1 - newSize / originalSize) * 100);

            // Also get dataUrl for preview
            const reader2 = new FileReader();
            reader2.onload = (e2) => resolve({
              blob,
              dataUrl:      e2.target.result,
              width,
              height,
              originalSize,
              newSize,
              saving,
              mimeType:     format,
            });
            reader2.readAsDataURL(blob);
          },
          format,
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes image and returns a File object (same name, .jpg extension).
 */
export async function optimizeImageToFile(file, opts = {}) {
  const result = await optimizeImage(file, opts);
  const name   = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([result.blob], name, { type: result.mimeType });
}

/**
 * Quick check: should this file be optimized?
 * Skip SVGs and tiny files (< 50KB).
 */
export function shouldOptimize(file) {
  if (!file?.type?.startsWith("image/")) return false;
  if (file.type === "image/svg+xml")       return false;
  if (file.size < 50 * 1024)               return false; // < 50KB already small
  return true;
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * One-shot: optimize if needed + return result with size info.
 * Use this as the single entry point in upload handlers.
 *
 * Usage in Admin.jsx handleImageUpload:
 * ────────────────────────────────────
 * import { smartOptimize } from "../services/imageOptimizer";
 *
 * const handleImageUpload = async (e) => {
 *   const file = e.target.files?.[0];
 *   if (!file) return;
 *   const { dataUrl, saving, newSize, originalSize } = await smartOptimize(file);
 *   setForm(p => ({ ...p, image: dataUrl }));
 *   setImagePreview(dataUrl);
 *   if (saving > 0) showToast({ msg: `🖼 Image compressed ${saving}% (${formatBytes(originalSize)} → ${formatBytes(newSize)})`, type: "info" });
 * };
 */
export async function smartOptimize(file, opts = {}) {
  if (!shouldOptimize(file)) {
    // Still return dataUrl for non-optimized files
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror  = rej;
      r.onload   = (e) => res({
        dataUrl:      e.target.result,
        originalSize: file.size,
        newSize:      file.size,
        saving:       0,
        width:        null,
        height:       null,
      });
      r.readAsDataURL(file);
    });
  }
  return optimizeImage(file, {
    maxWidth:  opts.maxWidth  || 1200,
    maxHeight: opts.maxHeight || 1200,
    quality:   opts.quality   || 0.82,
    format:    "image/jpeg",
  });
}

// ─── Preset profiles ──────────────────────────────────────────────
export const PROFILES = {
  examCover:   { maxWidth: 800,  maxHeight: 600,  quality: 0.85 },
  avatar:      { maxWidth: 300,  maxHeight: 300,  quality: 0.88 },
  certificate: { maxWidth: 1400, maxHeight: 1000, quality: 0.90 },
  question:    { maxWidth: 900,  maxHeight: 700,  quality: 0.82 },
  thumbnail:   { maxWidth: 400,  maxHeight: 300,  quality: 0.80 },
};

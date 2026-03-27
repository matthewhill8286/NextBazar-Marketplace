"use client";

import { GripVertical, Loader2, Sparkles, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  url?: string;
  uploading: boolean;
};

type ImageUploadProps = {
  userId: string;
  images: UploadedImage[];
  onChangeAction: (images: UploadedImage[]) => void;
  maxImages?: number;
};

export type { UploadedImage };

export default function ImageUpload({
  userId,
  images,
  onChangeAction,
  maxImages = 15,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const supabase = createClient();

  // Client-side compression: resize to ≤1600px and convert to WebP before upload
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const name = file.name.replace(/\.[^.]+$/, ".webp");
            resolve(
              new File([blob], name, {
                type: "image/webp",
                lastModified: Date.now(),
              }),
            );
          },
          "image/webp",
          0.85,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  }, []);

  const uploadFile = useCallback(
    async (file: File, _tempId: string) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("listings")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("listings").getPublicUrl(data.path);

      return publicUrl;
    },
    [userId, supabase],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;
      const toProcess = fileArray.slice(0, remaining);

      if (toProcess.length === 0) return;

      // Compress all images in parallel (resize + WebP) before preview/upload
      const compressed = await Promise.all(toProcess.map(compressImage));

      // Create preview entries using the compressed files
      const newImages: UploadedImage[] = compressed.map((file) => ({
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
      }));

      const updatedImages = [...images, ...newImages];
      onChangeAction(updatedImages);

      // Upload each compressed file, updating the list after each completes
      let currentImages = updatedImages;
      for (const img of newImages) {
        const url = await uploadFile(img.file, img.id);
        currentImages = currentImages.map((i) =>
          i.id === img.id
            ? { ...i, url: url || undefined, uploading: false }
            : i,
        );
        onChangeAction(currentImages);
      }
    },
    [images, maxImages, onChangeAction, uploadFile, compressImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const removeImage = useCallback(
    (id: string) => {
      const img = images.find((i) => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      onChangeAction(images.filter((i) => i.id !== id));
    },
    [images, onChangeAction],
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400"
        }`}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-900 mb-1">
          {images.length === 0
            ? "Upload Photos"
            : `Add More Photos (${images.length}/${maxImages})`}
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Drag & drop or click to browse. JPG, PNG, WebP — auto-optimised on
          upload.
        </p>
        <div className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          AI will auto-fill details from your photos
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={async (e) => {
            if (e.target.files) await handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Image previews — drag to reorder */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable={!img.uploading}
              onDragStart={(e) => {
                setDragIdx(idx);
                e.dataTransfer.effectAllowed = "move";
                // Use a tiny transparent image so the default ghost is replaced by our CSS
                const ghost = document.createElement("div");
                ghost.style.opacity = "0";
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                requestAnimationFrame(() => ghost.remove());
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragIdx !== null && idx !== overIdx) {
                  setOverIdx(idx);
                }
              }}
              onDragEnd={() => {
                if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
                  const reordered = [...images];
                  const [moved] = reordered.splice(dragIdx, 1);
                  reordered.splice(overIdx, 0, moved);
                  onChangeAction(reordered);
                }
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDrop={(e) => e.preventDefault()}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 group bg-gray-100 cursor-grab active:cursor-grabbing transition-all duration-150 ${
                dragIdx === idx
                  ? "opacity-40 scale-95 border-indigo-400"
                  : overIdx === idx && dragIdx !== null
                    ? "border-indigo-400 ring-2 ring-indigo-200 scale-[1.02]"
                    : "border-gray-200"
              }`}
            >
              <Image
                src={img.preview}
                alt={`Upload ${idx + 1}`}
                fill
                className="object-cover pointer-events-none"
                sizes="150px"
              />

              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {/* Cover badge */}
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}

              {/* Drag handle hint */}
              <div className="absolute top-1.5 left-1.5 p-0.5 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

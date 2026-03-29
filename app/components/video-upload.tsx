"use client";

import { Loader2, Play, Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UploadedVideo = {
  file: File | null;
  previewUrl: string; // object URL for local preview
  url?: string; // public Supabase storage URL
  uploading: boolean;
  progress: number; // 0–100
};

type VideoUploadProps = {
  userId: string;
  video: UploadedVideo | null;
  onChangeAction: (video: UploadedVideo | null) => void;
};

const MAX_SIZE_MB = 200;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];

export default function VideoUpload({
  userId,
  video,
  onChangeAction,
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (
      !ACCEPTED.includes(file.type) &&
      !file.name.match(/\.(mp4|mov|webm)$/i)
    ) {
      alert("Please upload an MP4, MOV, or WebM video.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Video must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const draft: UploadedVideo = {
      file,
      previewUrl,
      uploading: true,
      progress: 0,
    };
    onChangeAction(draft);

    // Simulate early progress pulse while Supabase uploads
    let sim = 0;
    const ticker = setInterval(() => {
      sim = Math.min(sim + Math.random() * 8, 85);
      onChangeAction({ ...draft, progress: Math.round(sim) });
    }, 400);

    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `videos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("listings")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      clearInterval(ticker);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("listings").getPublicUrl(path);
      onChangeAction({
        file,
        previewUrl,
        url: publicUrl,
        uploading: false,
        progress: 100,
      });
    } catch (err) {
      clearInterval(ticker);
      console.error("Video upload failed:", err);
      onChangeAction(null);
      alert("Video upload failed. Please try again.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
    onChangeAction(null);
  }

  // ── State: has a video ───────────────────────────────────────────────────
  if (video) {
    return (
      <div className="relative overflow-hidden bg-[#2C2826] aspect-video">
        {video.uploading ? (
          /* Upload in progress */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <div className="w-48">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${video.progress}%` }}
                />
              </div>
              <p className="text-white/60 text-xs text-center mt-1.5">
                Uploading video… {video.progress}%
              </p>
            </div>
          </div>
        ) : (
          /* Preview */
          // biome-ignore lint/a11y/useMediaCaption: no caption needed
          <video
            src={video.previewUrl}
            className="w-full h-full object-contain"
            controls
            preload="metadata"
          />
        )}

        {/* Remove button */}
        {!video.uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // ── State: empty — drop zone ──────────────────────────────────────────────
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
        dragOver
          ? "border-violet-400 bg-violet-50"
          : "border-[#e8e6e3] bg-white hover:border-[#bbb] hover:bg-[#faf9f7]"
      }`}
    >
      <div className="p-3 bg-violet-100 rounded-full">
        <Video className="w-6 h-6 text-violet-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#666]">
          <span className="text-violet-600">Click to upload</span> or drag &amp;
          drop
        </p>
        <p className="text-xs text-[#bbb] mt-0.5">
          MP4, MOV or WebM · max {MAX_SIZE_MB}MB
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Play className="w-3 h-3" />
        Show buyers what makes your item special
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import VideoUpload from "@/app/components/video-upload";
import type { FormData, UploadedImage, UploadedVideo } from "./post-types";

type Props = {
  formData: Pick<FormData, "title" | "price">;
  images: UploadedImage[];
  video: UploadedVideo | null;
  userId: string | null;
  selectedPackage: "free" | "featured" | "urgent";
  loading: boolean;
  onSetPackage: (pkg: "free" | "featured" | "urgent") => void;
  onSetVideo: (v: UploadedVideo | null) => void;
  onBack: () => void;
  onPublish: () => void;
};

export default function PostStep3({
  formData,
  images,
  video,
  userId,
  selectedPackage,
  loading,
  onSetPackage,
  onSetVideo,
  onBack,
  onPublish,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Boost Your Listing
      </h2>

      {/* Preview summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Preview</h3>
        <div className="flex gap-4">
          {images[0] && (
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              <img
                src={images[0].preview}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{formData.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {formData.price
                ? `€${Number(formData.price).toLocaleString()}`
                : "Contact for price"}
              {" · "}
              {images.length} photo{images.length !== 1 ? "s" : ""}
              {video?.url ? " · 1 video" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Free tier */}
        <button
          type="button"
          onClick={() => onSetPackage("free")}
          className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
            selectedPackage === "free"
              ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-100"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">Free Listing</div>
              <div className="text-sm text-gray-500">
                Standard visibility for 30 days
              </div>
            </div>
            <div className="font-bold text-gray-900">Free</div>
          </div>
        </button>

        {/* Featured tier */}
        <button
          type="button"
          onClick={() => onSetPackage("featured")}
          className={`w-full text-left rounded-xl border-2 p-5 transition-all relative ${
            selectedPackage === "featured"
              ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-100"
              : "border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 hover:border-amber-400"
          }`}
        >
          <div className="absolute -top-2.5 right-4 bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            POPULAR
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">
                Featured Listing
              </div>
              <div className="text-sm text-gray-500">
                Top placement + highlighted badge for 7 days · Up to 5× more
                views
              </div>
            </div>
            <div className="font-bold text-amber-600 ml-4 shrink-0">
              €4.99
            </div>
          </div>
        </button>

        {/* Urgent tier */}
        <button
          type="button"
          onClick={() => onSetPackage("urgent")}
          className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
            selectedPackage === "urgent"
              ? "border-red-400 bg-red-50/50 ring-2 ring-red-100"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">Urgent Badge</div>
              <div className="text-sm text-gray-500">
                Urgent badge + priority in search for 3 days · Up to 3× more
                views
              </div>
            </div>
            <div className="font-bold text-red-600 ml-4 shrink-0">€2.99</div>
          </div>
        </button>
      </div>

      {/* Video Tour — paid tiers only */}
      {selectedPackage !== "free" && userId && (
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                🎬 Video Tour
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Add a short video to showcase your item — included with your
                paid listing
              </p>
            </div>
            <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
              INCLUDED
            </span>
          </div>
          <VideoUpload
            userId={userId}
            video={video}
            onChangeAction={onSetVideo}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={loading}
          className={`flex-1 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
            selectedPackage === "free"
              ? "bg-green-600 text-white hover:bg-green-700"
              : selectedPackage === "featured"
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200"
                : "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selectedPackage === "free" ? (
            "Publish Listing"
          ) : selectedPackage === "featured" ? (
            "Publish & Feature — €4.99"
          ) : (
            "Publish & Boost — €2.99"
          )}
        </button>
      </div>

      {selectedPackage !== "free" && (
        <p className="text-center text-xs text-gray-400">
          Your listing will be published, then pay to activate your promotion.
        </p>
      )}
    </div>
  );
}

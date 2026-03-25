"use client";

import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ImageUpload from "@/app/components/image-upload";
import type {
  Category,
  FormData,
  Subcategory,
  UploadedImage,
} from "./post-types";

type Props = {
  userId: string | null;
  images: UploadedImage[];
  formData: Pick<FormData, "title" | "category_id" | "subcategory_id">;
  categories: Category[];
  visibleSubcategories: Subcategory[];
  aiLoading: boolean;
  aiFilled: boolean;
  onImagesChange: (imgs: UploadedImage[]) => void;
  onAiAutofill: () => void;
  onUpdate: (key: string, value: string) => void;
  onSelectCategory: (id: string) => void;
  onNext: () => void;
};

export default function PostStep1({
  userId,
  images,
  formData,
  categories,
  visibleSubcategories,
  aiLoading,
  aiFilled,
  onImagesChange,
  onAiAutofill,
  onUpdate,
  onSelectCategory,
  onNext,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        What are you selling?
      </h2>

      {/* Image Upload */}
      {userId ? (
        <ImageUpload
          userId={userId}
          images={images}
          onChangeAction={onImagesChange}
        />
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-white">
          <p className="text-gray-500 text-sm">
            <a
              href="/auth/login?redirect=/post"
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign in
            </a>{" "}
            to upload photos
          </p>
        </div>
      )}

      {/* AI Auto-fill button */}
      {images.some((img) => img.url && !img.uploading) && !aiFilled && (
        <button
          type="button"
          onClick={onAiAutofill}
          disabled={aiLoading}
          className="w-full bg-linear-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-indigo-200"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting title &amp; category...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Suggest title &amp; category with AI
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Beta
              </span>
            </>
          )}
        </button>
      )}
      {aiFilled && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-xl border border-green-100">
          <Sparkles className="w-4 h-4" />
          AI suggested a title and category — review and adjust below
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          placeholder="e.g. iPhone 15 Pro Max 256GB Blue"
          value={formData.title}
          onChange={(e) => onUpdate("title", e.target.value)}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Category
        </label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.category_id === cat.id
                  ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div
                className={`w-10 h-10 ${getCategoryConfig(cat.slug).bg} rounded-xl flex items-center justify-center mb-1 mx-auto`}
              >
                <CategoryIcon slug={cat.slug} size={20} />
              </div>
              <div className="text-xs font-medium text-gray-700">
                {cat.name}
              </div>
            </button>
          ))}
        </div>

        {/* Subcategory drill-down */}
        {visibleSubcategories.length > 0 && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <div className="flex flex-wrap gap-2">
              {visibleSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onUpdate("subcategory_id", sub.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    formData.subcategory_id === sub.id
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={
          !formData.title ||
          !formData.category_id ||
          (visibleSubcategories.length > 0 && !formData.subcategory_id)
        }
        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

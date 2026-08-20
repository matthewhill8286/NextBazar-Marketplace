"use client";

import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  maxImages?: number;
  onImagesChangeAction: (imgs: UploadedImage[]) => void;
  onAiAutofillAction: () => void;
  onUpdateAction: (key: string, value: string) => void;
  onSelectCategoryAction: (id: string) => void;
  onNextAction: () => void;
};

export default function PostStep1({
  userId,
  images,
  formData,
  categories,
  visibleSubcategories,
  aiLoading,
  aiFilled,
  maxImages,
  onImagesChangeAction,
  onAiAutofillAction,
  onUpdateAction,
  onSelectCategoryAction,
  onNextAction,
}: Props) {
  const t = useTranslations("post");
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-3xl font-light text-[#1a1a1a] dark:text-[#e8e6e3] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("step1.heading")}
        </h2>
        <p className="text-sm text-[#6b6560] dark:text-[#9a9290]">{t("step1.subheading")}</p>
      </div>

      {/* Image Upload */}
      {userId ? (
        <ImageUpload
          userId={userId}
          images={images}
          onChangeAction={onImagesChangeAction}
          {...(maxImages ? { maxImages } : {})}
        />
      ) : (
        <div className="border-2 border-dashed border-[#e8e6e3] dark:border-[#3a3735] p-8 text-center bg-white dark:bg-[#252220]">
          <p className="text-[#6b6560] dark:text-[#9a9290] text-sm">
            <a
              href="/auth/login?redirect=/post"
              className="text-[#1a1a1a] dark:text-[#e8e6e3] font-medium hover:underline"
            >
              {t("step1.signInPrompt").split(" to ")[0]}
            </a>{" "}
            {t("step1.signInPrompt").split(" to ")[1]}
          </p>
        </div>
      )}

      {/* AI Auto-fill button */}
      {images.some((img) => img.url && !img.uploading) && !aiFilled && (
        <button
          type="button"
          onClick={onAiAutofillAction}
          disabled={aiLoading}
          className="w-full bg-[#8E7A6B] text-white py-3.5 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("step1.detectingTitle")}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              {t("step1.suggestTitleCategory")}
              <span className="text-[9px] bg-white/20 px-2 py-0.5 font-medium uppercase tracking-[0.15em]">
                Beta
              </span>
            </>
          )}
        </button>
      )}
      {aiFilled && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-2.5 border border-emerald-100 dark:border-emerald-800">
          <Sparkles className="w-4 h-4" />
          {t("step1.aiSuggestion")}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] dark:text-[#9a9290] mb-2">
          {t("step1.titleLabel")}
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 border border-[#e8e6e3] dark:border-[#3a3735] bg-white dark:bg-[#252220] text-[#1a1a1a] dark:text-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm"
          placeholder={t("titlePlaceholder")}
          value={formData.title}
          onChange={(e) => onUpdateAction("title", e.target.value)}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] dark:text-[#9a9290] mb-3">
          {t("step1.categoryLabel")}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategoryAction(cat.id)}
              className={`group p-3 border text-center transition-all ${
                formData.category_id === cat.id
                  ? "border-[#8E7A6B] bg-[#faf9f7] dark:bg-[#1e1c1a] ring-1 ring-[#8E7A6B]"
                  : "border-[#e8e6e3] dark:border-[#3a3735] hover:border-[#ccc] bg-white dark:bg-[#252220]"
              }`}
            >
              <div
                className={`w-10 h-10 ${getCategoryConfig(cat.slug).bg} flex items-center justify-center mb-1 mx-auto group-hover:scale-110 transition-transform duration-300`}
              >
                <CategoryIcon slug={cat.slug} size={20} />
              </div>
              <div className="text-xs font-medium text-[#666] dark:text-[#9a9290]">{cat.name}</div>
            </button>
          ))}
        </div>

        {/* Subcategory drill-down */}
        {visibleSubcategories.length > 0 && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] dark:text-[#9a9290] mb-2">
              {t("step1.subcategoryLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {visibleSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onUpdateAction("subcategory_id", sub.id)}
                  className={`px-4 py-2 text-sm font-medium border transition-all ${
                    formData.subcategory_id === sub.id
                      ? "border-[#8E7A6B] bg-[#8E7A6B] text-white"
                      : "border-[#e8e6e3] dark:border-[#3a3735] bg-white dark:bg-[#252220] text-[#666] dark:text-[#9a9290] hover:border-[#ccc]"
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
        onClick={onNextAction}
        disabled={
          !formData.title ||
          !formData.category_id ||
          (visibleSubcategories.length > 0 && !formData.subcategory_id)
        }
        className="w-full bg-[#8E7A6B] text-white py-4 text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center justify-center gap-2.5 disabled:opacity-40"
      >
        {t("step1.continue")} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

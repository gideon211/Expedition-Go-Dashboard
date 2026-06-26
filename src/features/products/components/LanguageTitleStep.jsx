import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "sv", label: "Svenska" },
  { code: "da", label: "Dansk" },
  { code: "no", label: "Norsk" },
  { code: "fi", label: "Suomi" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
];

export default function LanguageTitleStep() {
  const { product, errors, updateProduct, updateNested } = useProductBuilderStore();
  const [showRefCode, setShowRefCode] = useState(!!product.referenceCode);

  const writingLanguage = product.content?.writingLanguage;

  useEffect(() => {
    if (!product.content?.writingLanguage) {
      updateNested("content.writingLanguage", "English");
    }
  }, []);

  const handleLanguageChange = (label) => {
    updateNested("content.writingLanguage", label);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Let's get started</h3>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800">
          Select the language you will use to write your product details
        </label>
        <p className="text-sm text-slate-500 -mt-1">
          We recommend writing in your strongest language.
        </p>
        <Select value={writingLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className={errors.writingLanguage ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem key={lang.code} value={lang.label}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.writingLanguage && <p className="text-xs text-red-500">{errors.writingLanguage}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800">
          What is your product title?
        </label>
        <p className="text-sm text-slate-500 -mt-1">
          A great title will help travelers understand what you are offering them at a glance.
        </p>
        <input
          type="text"
          value={product.title}
          onChange={(e) => updateProduct({ title: e.target.value })}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white shadow-sm transition-all",
            "focus:outline-none",
            errors.title
              ? "border-2 border-red-500"
              : "border border-slate-200 hover:border-slate-300",
          )}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800">
          Product Description
        </label>
        <p className="text-sm text-slate-500 -mt-1">
          Describe your product for travelers.
        </p>
        <textarea
          value={product.description || ""}
          onChange={(e) => updateProduct({ description: e.target.value })}
          rows={4}
          placeholder="Tell travelers about your product..."
          className={cn(
            "w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white shadow-sm transition-all resize-none",
            "focus:outline-none",
            errors.description
              ? "border-2 border-red-500"
              : "border border-slate-200 hover:border-slate-300",
          )}
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowRefCode(!showRefCode)}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {showRefCode ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )}
          Add your product reference code (optional)
        </button>
        {showRefCode && (
          <input
            type="text"
            value={product.referenceCode || ""}
            onChange={(e) => updateProduct({ referenceCode: e.target.value })}
            placeholder="e.g., TOUR-12345"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 shadow-sm transition-all hover:border-slate-300 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

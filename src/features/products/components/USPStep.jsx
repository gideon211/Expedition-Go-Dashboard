import { useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

function inputCls(error) {
  return `w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all ${
    error ? "border-red-400" : "border-slate-200/80 hover:border-slate-300"
  }`;
}

export default function USPStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { content } = product;
  const [inputValue, setInputValue] = useState("");
  const points = content.uniqueSellingPoints || [];

  const addPoint = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (points.length >= 10) return;
    updateNested("content.uniqueSellingPoints", [...points, trimmed]);
    setInputValue("");
  };

  const removePoint = (index) => {
    updateNested("content.uniqueSellingPoints", points.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPoint();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium tracking-tight text-slate-900">
          What sets your activity apart?
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Add points that highlight what makes your activity unique and interesting.
        </p>
      </div>

      {/* Add input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Selling Points <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Only tour with local village visit"
            className={`${inputCls(errors.uniqueSellingPoints)} flex-1`}
          />
          <button
            type="button"
            onClick={addPoint}
            disabled={!inputValue.trim() || points.length >= 10}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>
        {errors.uniqueSellingPoints && (
          <p className="text-xs text-red-500">{errors.uniqueSellingPoints}</p>
        )}
        <p className="text-xs text-slate-400">
          {points.length}/10 points added. Press Enter or click + to add.
        </p>
      </div>

      {/* List */}
      {points.length > 0 && (
        <div className="space-y-2">
          {points.map((point, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 flex-1">{point}</span>
              <button
                type="button"
                onClick={() => removePoint(i)}
                className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Private Activity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-800">
            Is this a private activity?
          </label>
          <div className="relative group">
            <Info size={14} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56 text-center whitespace-normal">
              A private activity means only your group will participate, with no other travelers.
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateNested("content.isPrivateActivity", true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              content.isPrivateActivity
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => updateNested("content.isPrivateActivity", false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !content.isPrivateActivity
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Max Travelers - only show when NOT private activity */}
      {!content.isPrivateActivity && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 mb-2 block">
            Enter the maximum number of travelers who can participate
          </label>
          <input
            type="number"
            min={1}
            value={content.maxTravelers}
            onChange={(e) => updateNested("content.maxTravelers", Number(e.target.value))}
            className={`${inputCls()} max-w-[200px]`}
          />
          <p className="text-xs text-slate-500 mt-2">
            Before you can update your new maximum number here, you'll need to reduce your tiered pricing booking limit under the Schedules & prices tab.
          </p>
        </div>
      )}
    </div>
  );
}

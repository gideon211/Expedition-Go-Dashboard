import { Plus, Trash2, DollarSign, Percent, Tag } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import DatePicker from "@/components/forms/DatePicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "KES", label: "KES (KSh)" },
];

const PRICING_MODELS = [
  { value: "perPerson", label: "Per Person" },
  { value: "perGroup", label: "Per Group" },
  { value: "flatRate", label: "Flat Rate" },
];

const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible - Full refund 24h before" },
  { value: "moderate", label: "Moderate - Full refund 72h before" },
  { value: "strict", label: "Strict - 50% refund 7 days before" },
  { value: "non-refundable", label: "Non-refundable" },
];

export default function ProductPricingStep() {
  const { product, errors, updateProduct, updateNested } = useProductBuilderStore();
  const { pricing } = product;

  const updateTier = (index, field, value) => {
    const newTiers = [...pricing.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    updateNested("pricing.tiers", newTiers);
  };

  const addTier = () => {
    const newTiers = [...pricing.tiers, { name: "", price: "", minAge: 0, maxAge: 99 }];
    updateNested("pricing.tiers", newTiers);
  };

  const removeTier = (index) => {
    const newTiers = pricing.tiers.filter((_, i) => i !== index);
    updateNested("pricing.tiers", newTiers);
  };

  return (
    <div className="space-y-6">
      {/* Base Price & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <DollarSign size={16} className="text-slate-500" />
              Base Price <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              value={pricing.basePrice}
              onChange={(e) => updateNested("pricing.basePrice", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${
                errors.basePrice ? "border-red-500" : "border-slate-200"
              }`}
            />
          </div>
          {errors.basePrice && <p className="mt-1 text-xs text-red-500">{errors.basePrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Currency <span className="text-red-500">*</span>
          </label>
          <Select
            value={pricing.currency}
            onValueChange={(value) => updateNested("pricing.currency", value)}
          >
            <SelectTrigger className={errors.currency ? "border-red-500" : ""}>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Pricing Model</label>
          <Select
            value={pricing.pricingModel}
            onValueChange={(value) => updateNested("pricing.pricingModel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pricing model" />
            </SelectTrigger>
            <SelectContent>
              {PRICING_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Schedule Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Pricing Start Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={pricing.startDate}
            onChange={(value) => updateNested("pricing.startDate", value)}
            placeholder="Select start date"
            className="w-full"
            error={Boolean(errors.pricingStartDate)}
            maxDate={pricing.endDate || undefined}
          />
          {errors.pricingStartDate && <p className="mt-1 text-xs text-red-500">{errors.pricingStartDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Pricing End Date <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={pricing.endDate}
            onChange={(value) => updateNested("pricing.endDate", value)}
            placeholder="Select end date"
            className="w-full"
            error={Boolean(errors.pricingEndDate)}
            minDate={pricing.startDate || undefined}
          />
          {errors.pricingEndDate && <p className="mt-1 text-xs text-red-500">{errors.pricingEndDate}</p>}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        {errors.pricingSchedule && (
          <p className="mb-2 text-xs text-red-500">{errors.pricingSchedule}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2">
              <Tag size={16} className="text-slate-500" />
              Pricing Tiers
            </span>
          </h3>
          <button
            onClick={addTier}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus size={12} />
            Add Tier
          </button>
        </div>

        <div className="space-y-3">
          {pricing.tiers.length === 0 && (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
              <Tag size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">No pricing tiers defined</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Tier" to create a pricing tier</p>
            </div>
          )}
          {pricing.tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="sm:col-span-3">
                <label className="block text-xs text-slate-500 mb-1">Tier Name</label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(index, "name", e.target.value)}
                  placeholder="e.g., Adult"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs text-slate-500 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updateTier(index, "price", e.target.value === "" ? "" : Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Min Age</label>
                <input
                  type="number"
                  value={tier.minAge}
                  onChange={(e) => updateTier(index, "minAge", Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Max Age</label>
                <input
                  type="number"
                  value={tier.maxAge}
                  onChange={(e) => updateTier(index, "maxAge", Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                {pricing.tiers.length > 1 && (
                  <button
                    onClick={() => removeTier(index)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Taxes & Fees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Taxes (%)</label>
          <div className="relative">
            <input
              type="number"
              value={pricing.taxes}
              onChange={(e) => updateNested("pricing.taxes", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0"
              min="0"
              max="100"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Additional Fees</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              value={pricing.fees}
              onChange={(e) => updateNested("pricing.fees", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Commission Rate (%)</label>
          <div className="relative">
            <input
              type="number"
              value={pricing.commissionRate}
              onChange={(e) => updateNested("pricing.commissionRate", Number(e.target.value))}
              placeholder="15"
              min="0"
              max="100"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">Cancellation Policy</label>
        <Select
          value={product.cancellationPolicy}
          onValueChange={(value) => updateProduct({ cancellationPolicy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select cancellation policy" />
          </SelectTrigger>
          <SelectContent>
            {CANCELLATION_POLICIES.map((policy) => (
              <SelectItem key={policy.value} value={policy.value}>{policy.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Refund Rules */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">Additional Refund Rules</label>
        <textarea
          value={product.refundRules}
          onChange={(e) => updateProduct({ refundRules: e.target.value })}
          rows={3}
          placeholder="Any specific refund conditions or exceptions..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

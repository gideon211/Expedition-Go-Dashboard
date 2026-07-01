import { useState } from "react";
import { DollarSign, X, Info } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
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
  { value: "GHS", label: "GHS (GH₵)" },
];

const PRICING_MODELS = [
  { value: "perPerson", label: "Per person" },
  { value: "group", label: "Per vehicle/group" },
  { value: "perBooking", label: "Per booking" },
];

const VEHICLE_TYPES = [
  { value: "boat", label: "Boat" },
  { value: "group", label: "Group" },
  { value: "package", label: "Package" },
  { value: "room", label: "Room/Accommodation" },
  { value: "vehicle", label: "Vehicle" },
];

const AGE_GROUPS = [
  { name: "Infant", defaultMin: 0, defaultMax: 2 },
  { name: "Child", defaultMin: 3, defaultMax: 17 },
  { name: "Youth", defaultMin: 12, defaultMax: 17 },
  { name: "Adult", defaultMin: 18, defaultMax: 64 },
  { name: "Senior", defaultMin: 65, defaultMax: 99 },
];

export default function PricingSchedulesStep() {
  const { product, updateNested } = useProductBuilderStore();
  const { pricing } = product;
  const [modalStep, setModalStep] = useState(null);
  const [tempVehicleType, setTempVehicleType] = useState("");

  const handlePricingModelChange = (model) => {
    // Only show vehicle type modal when switching TO group pricing FROM perPerson
    if (model === "group" && pricing.pricingModel === "perPerson") {
      setModalStep("confirm-switch");
    } else {
      updateNested("pricing.pricingModel", model);
    }
  };

  const confirmSwitchToPerGroup = () => {
    updateNested("pricing.pricingModel", "group");
    setModalStep("vehicle-type");
  };

  const toggleAgeGroup = (groupName) => {
    const updated = pricing.ageGroups.map((ag) =>
      ag.name === groupName ? { ...ag, enabled: !ag.enabled } : ag
    );
    updateNested("pricing.ageGroups", [...updated]);
  };

  const updateAgeGroup = (groupName, field, value) => {
    const updated = pricing.ageGroups.map((ag) =>
      ag.name === groupName ? { ...ag, [field]: Number(value) } : ag
    );
    updateNested("pricing.ageGroups", [...updated]);
  };

  const handleVehicleTypeSelect = () => {
    updateNested("pricing.vehicleType", tempVehicleType);
    setModalStep(null);
  };

  const addPriceEntry = () => {
    const currentPrices = pricing.schedules?.[0]?.prices || [];
    const newPrices = [...currentPrices, { ageGroup: "", retailPrice: 0, commissionRate: 15 }];
    const newSchedules = [...(pricing.schedules || [])];
    if (newSchedules[0]) {
      newSchedules[0] = { ...newSchedules[0], prices: newPrices };
    } else {
      newSchedules.push({ startDate: "", endDate: "", prices: newPrices });
    }
    updateNested("pricing.schedules", newSchedules);
  };

  const updatePriceEntry = (index, field, value) => {
    const currentPrices = pricing.schedules?.[0]?.prices || [];
    const newPrices = [...currentPrices];
    newPrices[index] = { ...newPrices[index], [field]: field === "retailPrice" || field === "commissionRate" ? Number(value) : value };
    const newSchedules = [...(pricing.schedules || [])];
    if (newSchedules[0]) {
      newSchedules[0] = { ...newSchedules[0], prices: newPrices };
    }
    updateNested("pricing.schedules", newSchedules);
  };

  const removePriceEntry = (index) => {
    const currentPrices = pricing.schedules?.[0]?.prices || [];
    const newPrices = currentPrices.filter((_, i) => i !== index);
    const newSchedules = [...(pricing.schedules || [])];
    if (newSchedules[0]) {
      newSchedules[0] = { ...newSchedules[0], prices: newPrices };
    }
    updateNested("pricing.schedules", newSchedules);
  };

  const enabledAgeGroups = pricing.ageGroups.filter((ag) => ag.enabled);
  const commissionRate = pricing.commissionRate || 15;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-medium tracking-tight text-slate-900">
          Let's start with how you price your product
        </h2>
      </div>

      {/* Pricing Model */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-700">How do you price your product?</label>
        <div className="space-y-3">
          {PRICING_MODELS.map((model) => (
            <label
              key={model.value}
              className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                pricing.pricingModel === model.value
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="pricingModel"
                checked={pricing.pricingModel === model.value}
                onChange={() => handlePricingModelChange(model.value)}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-800">{model.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Age Groups */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Define the age groups that can participate</label>
          <div className="relative group">
            <Info size={14} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
              Select which age groups can book your experience and define their age ranges.
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="col-span-4 text-xs font-medium text-slate-500 uppercase">Age Group</div>
            <div className="col-span-3 text-xs font-medium text-slate-500 uppercase text-center">Min age</div>
            <div className="col-span-3 text-xs font-medium text-slate-500 uppercase text-center">Max age</div>
            <div className="col-span-2"></div>
          </div>

          {AGE_GROUPS.map((ag) => {
            const group = pricing.ageGroups.find((g) => g.name === ag.name);
            return (
              <div key={ag.name} className="grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-b-0">
                <div className="col-span-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={group?.enabled || false}
                    onChange={() => toggleAgeGroup(ag.name)}
                    disabled={ag.name === "Adult"}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <span className={`text-sm ${ag.name === "Adult" ? "font-medium text-slate-400" : "text-slate-700"}`}>
                    {ag.name}
                  </span>
                  {ag.name === "Adult" && (
                    <div className="relative group">
                      <Info size={12} className="text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-40 text-center">
                        Adult is required for pricing
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-3 flex justify-center">
                  <input
                    type="number"
                    value={group?.minAge ?? ag.defaultMin}
                    onChange={(e) => updateAgeGroup(ag.name, "minAge", e.target.value)}
                    min="0"
                    disabled={!group?.enabled}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-3 flex justify-center">
                  <input
                    type="number"
                    value={group?.maxAge ?? ag.defaultMax}
                    onChange={(e) => updateAgeGroup(ag.name, "maxAge", e.target.value)}
                    min="0"
                    disabled={!group?.enabled}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="col-span-2"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Max Travelers */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">What is the maximum number of travelers per booking?</label>
          <div className="relative group">
            <Info size={14} className="text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center">
              This limits how many travelers can be booked in a single transaction.
            </div>
          </div>
        </div>
        <Select
          value={String(pricing.maxTravelersPerBooking)}
          onValueChange={(value) => updateNested("pricing.maxTravelersPerBooking", Number(value))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={String(num)}>{num}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Currency</label>
        <Select
          value={pricing.currency}
          onValueChange={(value) => updateNested("pricing.currency", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pricing Schedule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-900">Pricing Schedule</h3>
            <p className="text-sm text-slate-500 mt-1">
              Set prices for each age group.
            </p>
          </div>
          <button
            type="button"
            onClick={addPriceEntry}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            + Add Price
          </button>
        </div>

        {(pricing.schedules[0]?.prices || []).length === 0 ? (
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
            <DollarSign size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No prices added yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Price" to set up your pricing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(pricing.schedules[0]?.prices || []).map((price, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-emerald-700">{index + 1}</span>
                </div>

                <div className="flex-1 grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Age Group</label>
                    <Select
                      value={price.ageGroup}
                      onValueChange={(value) => updatePriceEntry(index, "ageGroup", value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledAgeGroups.map((ag) => (
                          <SelectItem key={ag.name} value={ag.name}>{ag.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Retail Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        {pricing.currency}
                      </span>
                      <input
                        type="number"
                        value={price.retailPrice || ""}
                        onChange={(e) => updatePriceEntry(index, "retailPrice", e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-14 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Commission
                      <span className="relative group ml-1">
                        <Info size={10} className="inline text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-40 text-center">
                          Commission is set by the platform and cannot be changed.
                        </div>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        {pricing.currency}
                      </span>
                      <input
                        type="text"
                        value={price.retailPrice ? `${((price.retailPrice * commissionRate) / 100).toFixed(2)}` : "0.00"}
                        readOnly
                        className="w-full pl-14 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      You Get
                      <span className="relative group ml-1">
                        <Info size={10} className="inline text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-40 text-center">
                          Amount you receive after {commissionRate}% platform commission.
                        </div>
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        {pricing.currency}
                      </span>
                      <input
                        type="text"
                        value={price.retailPrice ? `${(price.retailPrice - (price.retailPrice * commissionRate) / 100).toFixed(2)}` : "0.00"}
                        readOnly
                        className="w-full pl-14 pr-3 py-2 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium bg-emerald-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePriceEntry(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalStep === "confirm-switch" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-900 pr-8">
                You're changing your pricing structure to sell per vehicle/group
              </h3>
              <button onClick={() => setModalStep(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Before you do this, we'll help you:</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Define your group/vehicle
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Update your pricing schedule
              </li>
            </ul>
            <div className="flex justify-between">
              <button
                onClick={() => setModalStep(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitchToPerGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Type Modal */}
      {modalStep === "vehicle-type" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-900 pr-8">
                First, select your vehicle or type of group
              </h3>
              <button onClick={() => setModalStep(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">How do you price your product?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl opacity-50">
                  <input type="radio" disabled className="w-4 h-4" />
                  <span className="text-sm text-slate-600">Per person</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 border-emerald-600 bg-emerald-50 rounded-xl">
                  <input type="radio" checked readOnly className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Per vehicle/group</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl opacity-50">
                  <input type="radio" disabled className="w-4 h-4" />
                  <span className="text-sm text-slate-600">Per booking</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Per vehicle/group</label>
                <Select value={tempVehicleType} onValueChange={setTempVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setModalStep("confirm-switch")}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleVehicleTypeSelect}
                disabled={!tempVehicleType}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

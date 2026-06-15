import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import DatePicker from "@/components/forms/DatePicker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

const SEASONS = [
  { value: "all_year", label: "All Year" },
  { value: "peak", label: "Peak Season Only" },
  { value: "off_peak", label: "Off-Peak Only" },
  { value: "custom", label: "Custom Dates" },
];

export default function ProductScheduleStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { schedule } = product;

  const toggleDay = (day) => {
    const newDays = schedule.operatingDays.includes(day)
      ? schedule.operatingDays.filter((d) => d !== day)
      : [...schedule.operatingDays, day];
    updateNested("schedule.operatingDays", newDays);
  };

  const addTimeSlot = () => {
    const newSlots = [...schedule.timeSlots, { startTime: "09:00", endTime: "12:00" }];
    updateNested("schedule.timeSlots", newSlots);
  };

  const updateTimeSlot = (index, field, value) => {
    const newSlots = schedule.timeSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    updateNested("schedule.timeSlots", newSlots);
  };

  const removeTimeSlot = (index) => {
    const newSlots = schedule.timeSlots.filter((_, i) => i !== index);
    updateNested("schedule.timeSlots", newSlots);
  };

  const addBlackoutDate = () => {
    const newDates = [...schedule.blackoutDates, ""];
    updateNested("schedule.blackoutDates", newDates);
  };

  const updateBlackoutDate = (index, value) => {
    const newDates = schedule.blackoutDates.map((date, i) => (i === index ? value : date));
    updateNested("schedule.blackoutDates", newDates);
  };

  const removeBlackoutDate = (index) => {
    const newDates = schedule.blackoutDates.filter((_, i) => i !== index);
    updateNested("schedule.blackoutDates", newDates);
  };

  return (
    <div className="space-y-6">
      {/* Operating Days */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-3">
          Operating Days <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.value}
              onClick={() => toggleDay(day.value)}
              className={`flex-1 min-w-[3rem] py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                schedule.operatingDays.includes(day.value)
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
        {errors.operatingDays && <p className="mt-1 text-xs text-red-500">{errors.operatingDays}</p>}
      </div>

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              Time Slots
            </span>
          </h3>
          <button
            onClick={addTimeSlot}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus size={12} />
            Add Slot
          </button>
        </div>

        <div className="space-y-3">
          {schedule.timeSlots.length === 0 && (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
              <Clock size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">No time slots defined</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Slot" to create a time slot</p>
            </div>
          )}
          {schedule.timeSlots.map((slot, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm text-slate-500 w-8">{index + 1}.</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(index, "startTime", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(index, "endTime", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              {schedule.timeSlots.length > 1 && (
                <button
                  onClick={() => removeTimeSlot(index)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Availability */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-2">
          <span className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            Seasonal Availability
          </span>
        </label>
        <Select
          value={schedule.seasonalAvailability}
          onValueChange={(value) => updateNested("schedule.seasonalAvailability", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((season) => (
              <SelectItem key={season.value} value={season.value}>{season.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capacity & Cutoff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Capacity Per Slot</label>
          <input
            type="number"
            value={schedule.capacityPerSlot}
            onChange={(e) => updateNested("schedule.capacityPerSlot", Number(e.target.value))}
            min="1"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Booking Cutoff (Hours Before)</label>
          <input
            type="number"
            value={schedule.bookingCutoffHours}
            onChange={(e) => updateNested("schedule.bookingCutoffHours", Number(e.target.value))}
            min="0"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Blackout Dates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              Blackout Dates
            </span>
          </h3>
          <button
            onClick={addBlackoutDate}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus size={12} />
            Add Date
          </button>
        </div>

        <div className="space-y-2">
          {schedule.blackoutDates.map((date, index) => (
            <div key={index} className="flex items-center gap-2">
              <DatePicker
                value={date}
                onChange={(value) => updateBlackoutDate(index, value)}
                placeholder="Select blackout date"
                className="flex-1 min-w-0"
              />
              <button
                onClick={() => removeBlackoutDate(index)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {schedule.blackoutDates.length === 0 && (
            <p className="text-sm text-slate-400 italic">No blackout dates set</p>
          )}
        </div>
      </div>
    </div>
  );
}

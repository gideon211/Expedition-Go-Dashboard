import { useState } from "react";
import { Clock, Plus, X, Pencil, GripVertical } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

function ItineraryBuilder({ items, onChange, error }) {
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDay, setShowDay] = useState(false);

  const resetForm = () => {
    setDay("");
    setStartTime("");
    setEndTime("");
    setTitle("");
    setDescription("");
    setEditingIndex(null);
  };

  const formatTimeDisplay = (start, end) => {
    if (!start) return "";
    const format12Hour = (time24) => {
      const [hours, minutes] = time24.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    };
    if (!end) return format12Hour(start);
    return `${format12Hour(start)} - ${format12Hour(end)}`;
  };

  const saveItem = () => {
    if (!title.trim() && !description.trim()) return;
    if (!startTime.trim()) return;
    
    const timeStr = formatTimeDisplay(startTime, endTime);
    const newItem = { 
      day: day.trim(), 
      time: timeStr,
      startTime: startTime,
      endTime: endTime,
      title: title.trim(), 
      description: description.trim() 
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = newItem;
      onChange(updated);
    } else {
      onChange([...items, newItem]);
    }
    resetForm();
  };

  const startEdit = (index) => {
    const item = items[index];
    setDay(item.day || "");
    setStartTime(item.startTime || "");
    setEndTime(item.endTime || "");
    setTitle(item.title || "");
    setDescription(item.description || "");
    setShowDay(!!item.day);
    setEditingIndex(index);
  };

  const removeItem = (index) => {
    if (editingIndex === index) resetForm();
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveItem();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-slate-900">Full Itinerary</h3>
        <p className="text-sm text-slate-500 mt-1">
          Add time, title, and description for each itinerary stop.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {items.length === 0 && (
        <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No itinerary stops added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your first stop below to build your itinerary</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical size={12} />
                </button>
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-emerald-700">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {(item.day || item.time) && (
                      <div className="flex items-center gap-2 mb-1">
                        {item.day && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                            {item.day}
                          </span>
                        )}
                        {item.time && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={10} />
                            {item.time}
                          </span>
                        )}
                      </div>
                    )}
                    {item.title && (
                      <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-700">
            {editingIndex !== null ? `Editing Stop ${editingIndex + 1}` : "Add New Stop"}
          </h4>
          {editingIndex !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel editing
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Morning Game Drive"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Day (Optional)</label>
              {!showDay && (
                <button
                  type="button"
                  onClick={() => setShowDay(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Add day
                </button>
              )}
            </div>
            {showDay && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Day 1"
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => { setShowDay(false); setDay(""); }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Start Time *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime || undefined}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Describe what happens at this stop..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveItem}
            disabled={!startTime.trim() || (!title.trim() && !description.trim())}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {editingIndex !== null ? (
              <>
                <Pencil size={16} />
                Save Changes
              </>
            ) : (
              <>
                <Plus size={16} />
                Add Itinerary Stop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function HighlightsBuilder({ highlights, onChange, error }) {
  const [newHighlight, setNewHighlight] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const addHighlight = () => {
    const trimmed = newHighlight.trim();
    if (trimmed && !highlights.includes(trimmed)) {
      onChange([...highlights, trimmed]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (index) => {
    onChange(highlights.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(highlights[index]);
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      const updated = [...highlights];
      updated[editingIndex] = editValue.trim();
      onChange(updated);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const moveHighlight = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= highlights.length) return;
    const updated = [...highlights];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHighlight();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-slate-900">Tour Highlights</h3>
        <p className="text-sm text-slate-500 mt-1">
          Add the key selling points of your tour that make it unique.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {highlights.length > 0 && highlights.some(h => h.trim()) && (
        <div className="space-y-2">
          {highlights.filter(h => h.trim()).map((highlight, index) => (
            <div
              key={index}
              className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveHighlight(index, index - 1)}
                  disabled={index === 0}
                  className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30"
                >
                  <GripVertical size={12} />
                </button>
              </div>

              {editingIndex === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-emerald-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              ) : (
                <span className="flex-1 text-sm text-slate-700">{highlight}</span>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingIndex === index ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {highlights.length === 0 && (
        <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <p className="text-sm font-medium text-slate-600">No highlights added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add highlights to showcase what makes your tour special</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newHighlight}
          onChange={(e) => setNewHighlight(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Visit local markets and cultural sites"
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        <button
          type="button"
          onClick={addHighlight}
          disabled={!newHighlight.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      <p className="text-xs text-slate-400">Press Enter to add quickly</p>
    </div>
  );
}

export default function TourDetailsStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { content } = product;

  return (
    <div className="space-y-8">
      <ItineraryBuilder
        items={content.itinerary || []}
        onChange={(items) => updateNested("content.itinerary", items)}
        error={errors.itinerary}
      />

      <div className="border-t border-slate-200 pt-8">
        <HighlightsBuilder
          highlights={content.highlights || []}
          onChange={(items) => updateNested("content.highlights", items)}
          error={errors.highlights}
        />
      </div>
    </div>
  );
}

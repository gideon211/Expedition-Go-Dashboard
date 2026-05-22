import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X, Search, Check } from "lucide-react";

export default function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  max,
  error,
  required,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = useCallback(
    (optValue) => {
      const next = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : max && value.length >= max
          ? value
          : [...value, optValue];
      onChange(next);
    },
    [value, onChange, max],
  );

  const remove = useCallback(
    (optValue) => {
      onChange(value.filter((v) => v !== optValue));
    },
    [value, onChange],
  );

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-[#1e293b] mb-2">
          {label}
          {required && <span className="text-[#dc3545] ml-0.5">*</span>}
          {max && value.length >= max && (
            <span className="text-xs text-amber-600 ml-2">Max {max} selected</span>
          )}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] ${
          error ? "border-[#dc3545]" : "border-[#eaeaea]"
        }`}
      >
        <span className={value.length === 0 ? "text-[#9e9e9e]" : "text-[#1e293b]"}>
          {value.length > 0 ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-[#64748b] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {error && <p className="mt-1 text-xs text-[#dc3545]">{error}</p>}

      {/* Chips */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            if (!opt) return null;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#044b3b]/10 text-[#044b3b] text-xs font-medium rounded-full"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  className="hover:text-[#dc3545] transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          {max && value.length >= max && (
            <span className="text-xs text-[#64748b] self-center">(max reached)</span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#eaeaea] rounded-lg shadow-lg max-h-72 flex flex-col">
          {/* Search */}
          <div className="relative border-b border-[#eaeaea]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"
            />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none bg-transparent"
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#64748b]">
                No options found
              </p>
            ) : (
              filtered.map((opt) => {
                const selected = value.includes(opt.value);
                const atMax = max && value.length >= max && !selected;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={atMax}
                    onClick={() => toggle(opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                      atMax
                        ? "text-[#9e9e9e] cursor-not-allowed"
                        : selected
                          ? "bg-[#044b3b]/5 text-[#044b3b]"
                          : "text-[#1e293b] hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${
                        selected
                          ? "bg-[#044b3b] border-[#044b3b] text-white"
                          : "border-[#cbd5e1]"
                      }`}
                    >
                      {selected && <Check size={11} />}
                    </span>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

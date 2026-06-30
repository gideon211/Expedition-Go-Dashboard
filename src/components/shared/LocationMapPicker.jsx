import { useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, MapPin, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import config from "@/config";

const defaultCenter = { lng: -0.187, lat: 5.6037 };
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function normalizeResult(raw) {
  return {
    formatted: raw.formatted || "",
    city: raw.city || "",
    country: raw.country || "",
    region: raw.region || "",
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
  };
}

export default function LocationMapPicker({ onSelect, initialLat, initialLng, label, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [lat, setLat] = useState(initialLat ?? null);
  const [lng, setLng] = useState(initialLng ?? null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const apiBaseRef = useRef(config.api.baseURL);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const { lng: initLng, lat: initLat } = defaultCenter;

    const center = initialLat && initialLng ? [initialLng, initialLat] : [initLng, initLat];
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLE,
      center,
      zoom: initialLat && initialLng ? 15 : 6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => setMapReady(true));
    map.on("error", () => setMapError(true));

    map.on("click", async (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;
      setLat(clickLat);
      setLng(clickLng);
      updateMarker(map, clickLng, clickLat);

      try {
        const res = await fetch(`${apiBaseRef.current}/locations/reverse?lat=${clickLat}&lng=${clickLng}`);
        const body = await res.json();
        const data = body?.data?.results?.[0];
        if (data) {
          setQuery(data.formatted);
          onSelectRef.current?.(normalizeResult(data));
        }
      } catch {
        onSelectRef.current?.({ formatted: `${clickLat.toFixed(4)}, ${clickLng.toFixed(4)}`, city: "", country: "", region: "", latitude: clickLat, longitude: clickLng });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateMarker(map, markerLng, markerLat) {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (markerLat != null && markerLng != null) {
      const el = document.createElement("div");
      el.className = "maplibregl-marker";
      el.innerHTML = `<svg width="28" height="36" viewBox="0 0 28 36" fill="none"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0zm0 19a5 5 0 110-10 5 5 0 010 10z" fill="#044b3b"/><circle cx="14" cy="14" r="3" fill="#fff"/></svg>`;
      el.style.cursor = "pointer";
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([markerLng, markerLat])
        .addTo(map);
    }
  }

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (lat != null && lng != null) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    }
    updateMarker(mapRef.current, lng, lat);
  }, [lat, lng, mapReady]);

  const doSearch = useRef((value) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const url = `${apiBaseRef.current}/locations/search?q=${encodeURIComponent(value)}&limit=5`;
    return fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
        return res.json();
      })
      .then(body => {
        setResults((body?.data?.results || []).map(normalizeResult));
        setSearchError(null);
      });
  }).current;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSearchError(null);
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        await doSearch(value);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(err.message);
          setResults([]);
        }
      }
      setLoading(false);
    }, 400);
  };

  const handleRetry = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchError(null);
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await doSearch(query);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSearchError(err.message);
          setResults([]);
        }
      }
      setLoading(false);
    }, 400);
  };

  const handleSelect = (result) => {
    const outLat = result.latitude;
    const outLng = result.longitude;
    setLat(outLat);
    setLng(outLng);
    setQuery(result.formatted);
    setResults([]);
    onSelect?.(result);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-2">
          <span className="flex items-center gap-2">
            <MapPin size={16} className="text-[#64748b]" />
            {label || "Search Location"}
          </span>
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={placeholder || "Search for a location..."}
            className="w-full pl-9 pr-10 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-[#044b3b]" />
            </div>
          )}
        </div>
        {searchError && (
          <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-sm">
            <AlertTriangle size={14} className="text-[#dc2626] shrink-0" />
            <span className="text-[#dc2626] text-xs flex-1">Could not search locations. Backend may be offline.</span>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#fee2e2] rounded transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}
        {results.length > 0 && (
          <ul className="mt-1 bg-white border border-[#eaeaea] rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 relative">
            {results.map((r, i) => (
              <li
                key={i}
                onClick={() => handleSelect(r)}
                className="px-4 py-2.5 text-sm text-[#1e293b] hover:bg-[#f8fafc] cursor-pointer border-b border-[#eaeaea] last:border-0"
              >
                {r.formatted}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-[#eaeaea] relative">
        <div ref={mapContainerRef} className="w-full h-[280px]" />
        {!mapReady && !mapError && (
          <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center gap-2 text-sm text-[#64748b]">
            <Loader2 size={16} className="animate-spin text-[#044b3b]" />
            Loading map...
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 bg-[#fef2f2] flex flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertTriangle size={24} className="text-[#dc2626]" />
            <p className="text-sm font-medium text-[#dc2626]">Could not load map tiles</p>
            <p className="text-xs text-[#b91c1c]">Check your internet connection and try again.</p>
          </div>
        )}
        <div className="px-3 py-2 text-xs text-[#64748b] bg-[#f8fafc] border-t border-[#eaeaea]">
          Click on the map to set a location
        </div>
      </div>

      {lat && lng && (
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span>Lat: {lat.toFixed(6)}</span>
          <span>Lng: {lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}

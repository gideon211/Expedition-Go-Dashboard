import { useState, useRef, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Search, MapPin } from "lucide-react";

const containerStyle = { width: "100%", height: "280px" };
const defaultCenter = { lat: 5.6037, lng: -0.187 };

async function fetchNominatim(query, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((r) => ({
    formatted: r.display_name || "",
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || "",
    country: r.address?.country || "",
    region: r.address?.state || r.address?.region || r.address?.district || "",
    latitude: r.lat ? Number(r.lat) : null,
    longitude: r.lon ? Number(r.lon) : null,
    source: "nominatim",
  }));
}

async function reverseNominatim(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Nominatim reverse HTTP " + res.status);
  return res.json();
}

function extractAddressComponents(components) {
  let city = "", country = "", region = "";
  for (const comp of components) {
    if (comp.types.includes("locality") || comp.types.includes("postal_town")) city = comp.long_name;
    if (comp.types.includes("country")) country = comp.long_name;
    if (comp.types.includes("administrative_area_level_1")) region = comp.long_name;
  }
  return { city, country, region };
}

export default function LocationMapPicker({ onSelect, initialLat, initialLng, label, placeholder, apiKey }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [lat, setLat] = useState(initialLat ?? null);
  const [lng, setLng] = useState(initialLng ?? null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const { isLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: ["places"],
  });

  const center = lat && lng ? { lat, lng } : defaultCenter;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        if (isLoaded && window.google?.maps?.places) {
          const service = new window.google.maps.places.AutocompleteService();
          service.getPlacePredictions({ input: value }, (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              setResults(predictions.map((p) => ({ formatted: p.description, placeId: p.place_id, source: "google" })));
            } else {
              setResults([]);
            }
            setLoading(false);
          });
        } else {
          setResults(await fetchNominatim(value, controller.signal));
          setLoading(false);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setResults([]);
        }
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = useCallback(async (result) => {
    let outLat, outLng, formatted, city, country, region;
    if (result.source === "google" && isLoaded) {
      const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
      placesService.getDetails({ placeId: result.placeId }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          outLat = place.geometry.location.lat();
          outLng = place.geometry.location.lng();
          formatted = place.formatted_address || result.formatted;
          const comps = extractAddressComponents(place.address_components);
          city = comps.city; country = comps.country; region = comps.region;
          setLat(outLat); setLng(outLng); setQuery(formatted); setResults([]);
          onSelect?.({ formatted, city, country, region, latitude: outLat, longitude: outLng });
        }
      });
    } else {
      formatted = result.formatted;
      outLat = result.latitude; outLng = result.longitude;
      city = result.city; country = result.country; region = result.region;
      setLat(outLat); setLng(outLng); setQuery(formatted); setResults([]);
      onSelect?.({ formatted, city, country, region, latitude: outLat, longitude: outLng });
    }
  }, [isLoaded, onSelect]);

  const handleMapClick = useCallback(async (e) => {
    const clickLat = e.latLng.lat();
    const clickLng = e.latLng.lng();
    setLat(clickLat); setLng(clickLng);
    if (isLoaded && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: clickLat, lng: clickLng } }, (res, status) => {
        if (status === "OK" && res[0]) {
          const place = res[0];
          const comps = extractAddressComponents(place.address_components);
          setQuery(place.formatted_address);
          onSelect?.({ formatted: place.formatted_address, ...comps, latitude: clickLat, longitude: clickLng });
        }
      });
    } else {
      try {
        const data = await reverseNominatim(clickLat, clickLng);
        if (data) {
          const addr = data.address || {};
          const formatted = data.display_name || "";
          setQuery(formatted);
          onSelect?.({
            formatted,
            city: addr.city || addr.town || addr.village || "",
            country: addr.country || "",
            region: addr.state || "",
            latitude: clickLat, longitude: clickLng,
          });
        }
      } catch { /* ignore reverse geocode failures */ }
    }
  }, [isLoaded, onSelect]);

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
              <div className="w-4 h-4 border-2 border-[#044b3b] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
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

      {mapLoadError ? (
        <div className="h-48 bg-[#f8fafc] rounded-lg border border-[#eaeaea] flex items-center justify-center text-sm text-[#64748b]">
          Map unavailable — using text search
        </div>
      ) : isLoaded ? (
        <div className="rounded-lg overflow-hidden border border-[#eaeaea]">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={lat && lng ? 15 : 6} onClick={handleMapClick}>
            {lat && lng && <Marker position={{ lat, lng }} />}
          </GoogleMap>
          <div className="px-3 py-2 text-xs text-[#64748b] bg-[#f8fafc] border-t border-[#eaeaea]">
            Click on the map to set a location
          </div>
        </div>
      ) : (
        <div className="h-48 bg-[#f8fafc] rounded-lg border border-[#eaeaea] flex items-center justify-center gap-2 text-sm text-[#64748b]">
          <div className="w-4 h-4 border-2 border-[#044b3b] border-t-transparent rounded-full animate-spin" />
          Loading map...
        </div>
      )}

      {lat && lng && (
        <div className="flex items-center gap-4 text-xs text-[#64748b]">
          <span>Lat: {lat.toFixed(6)}</span>
          <span>Lng: {lng.toFixed(6)}</span>
        </div>
      )}
      {error && <p className="text-xs text-[#dc3545]">{error}</p>}
    </div>
  );
}

const TIME_PATTERN = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)(?:\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?))?\s*[|]\s*/i;

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const timeMatch = trimmed.match(TIME_PATTERN);
  if (timeMatch) {
    const time = timeMatch[1].trim();
    const rest = trimmed.slice(timeMatch[0].length).trim();
    const colonIdx = rest.indexOf(": ");
    if (colonIdx > 0) {
      return {
        time,
        title: rest.slice(0, colonIdx).trim(),
        description: rest.slice(colonIdx + 2).trim(),
      };
    }
    return { time, title: rest, description: "" };
  }

  const colonIdx = trimmed.indexOf(": ");
  if (colonIdx > 0 && colonIdx < 60) {
    return {
      title: trimmed.slice(0, colonIdx).trim(),
      description: trimmed.slice(colonIdx + 2).trim(),
    };
  }

  return { description: trimmed };
}

export function normalizeItinerary(itinerary) {
  if (!itinerary) return [];

  if (Array.isArray(itinerary)) {
    if (itinerary.length === 0) return [];
    if (typeof itinerary[0] === "object" && itinerary[0] !== null) {
      return itinerary;
    }
    return itinerary
      .filter((item) => item && String(item).trim())
      .map((item) => ({ description: String(item).trim() }));
  }

  if (typeof itinerary === "string" && itinerary.trim()) {
    return itinerary
      .split("\n")
      .map(parseLine)
      .filter(Boolean);
  }

  return [];
}

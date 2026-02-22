export const fmtDT = (v) => (v ? new Date(v).toLocaleString() : "-");
export const fmtDateInput = (d) => (d ? String(d).slice(0, 10) : "");

export const toDayBounds = (fromDate, toDate) => {
  const f = fromDate ? `${fromDate}T00:00:00.000Z` : "";
  const t = toDate ? `${toDate}T23:59:59.999Z` : "";
  return { fromDate: f, toDate: t };
};

export const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// FREE reverse geocode (OpenStreetMap)
export const reverseGeocodeOSM = async ({ lat, lng }) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await res.json();

  const a = json?.address || {};
  const parts = [a.road, a.neighbourhood, a.suburb, a.city || a.town || a.village, a.state].filter(Boolean);

  const short = parts.slice(0, 3).join(", ");
  const full = json?.display_name || short || "";
  return { short, full };
};

export const getOsmEmbedUrl = (lat, lng) => {
  const delta = 0.005;
  const left = lng - delta;
  const right = lng + delta;
  const bottom = lat - delta;
  const top = lat + delta;

  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${lat},${lng}`;
};

export const getOsmOpenUrl = (lat, lng) => {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
};

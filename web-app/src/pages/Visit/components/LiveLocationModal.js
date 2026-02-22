import React, { useEffect, useRef, useState } from "react";
import { FiExternalLink, FiMapPin, FiPause, FiRefreshCw } from "react-icons/fi";
import VModal from "./VModal";
import { getOsmEmbedUrl, getOsmOpenUrl, reverseGeocodeOSM, safeNum } from "../visit.utils";

const LiveLocationModal = ({ open, onClose, title, onConfirm, withNotes = false }) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  const [place, setPlace] = useState("");
  const [placeFull, setPlaceFull] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle"); // idle | locating | live | stopped

  const watchIdRef = useRef(null);
  const lastGeoRef = useRef({ key: "", ts: 0 });

  const stopWatch = () => {
    if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setStatus("stopped");
  };

  const tryReverseGeocode = async (la, ln) => {
    const key = `${la.toFixed(5)},${ln.toFixed(5)}`;
    const now = Date.now();
    const should = lastGeoRef.current.key !== key || now - lastGeoRef.current.ts > 15_000;
    if (!should) return;

    lastGeoRef.current = { key, ts: now };
    setPlaceLoading(true);
    try {
      const r = await reverseGeocodeOSM({ lat: la, lng: ln });
      setPlace(r.short || "");
      setPlaceFull(r.full || r.short || "");
    } catch (e) {
      console.error(e);
    } finally {
      setPlaceLoading(false);
    }
  };

  const startLive = () => {
    setErr("");

    if (!navigator.geolocation) {
      setErr("Geolocation not supported on this device/browser.");
      setStatus("stopped");
      return;
    }

    setStatus("locating");
    stopWatch();
    setStatus("locating");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const la = pos?.coords?.latitude;
        const ln = pos?.coords?.longitude;
        const acc = pos?.coords?.accuracy;

        if (Number.isFinite(la) && Number.isFinite(ln)) {
          setLat(String(la));
          setLng(String(ln));
          setAccuracy(Number.isFinite(acc) ? acc : null);
          setStatus("live");
          tryReverseGeocode(la, ln);
        }
      },
      (e) => {
        console.error(e);
        const msg =
          e?.code === 1
            ? "Location permission denied. Please allow location access."
            : e?.code === 2
            ? "Location unavailable. Try turning on GPS."
            : "Location request timed out. Tap Refresh.";
        setErr(msg);
        setStatus("stopped");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setErr("");
    setLat("");
    setLng("");
    setAccuracy(null);

    setPlace("");
    setPlaceFull("");
    setPlaceLoading(false);

    setNotes("");
    setStatus("idle");
    lastGeoRef.current = { key: "", ts: 0 };

    startLive();

    return () => {
      if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const laNum = safeNum(lat);
  const lnNum = safeNum(lng);

  const badge =
    status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

  const submit = async () => {
    setErr("");
    try {
      setSaving(true);

      if (laNum == null || lnNum == null) {
        setErr("Location not ready yet. Please wait or tap Refresh.");
        return;
      }

      const payload = { latitude: laNum, longitude: lnNum };
      if (withNotes) payload.notes = notes || null;

      await onConfirm(payload);

      stopWatch();
      onClose?.();
    } catch (e2) {
      console.error(e2);
      setErr(e2?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VModal
      open={open}
      title={title}
      subtitle="Auto-capturing live location from device"
      onClose={() => {
        stopWatch();
        onClose?.();
      }}
      footer={
        <div className="v-footer">
          <button className="v-btn-secondary" type="button" onClick={() => { stopWatch(); onClose?.(); }} disabled={saving}>
            Cancel
          </button>

          <button className="v-btn-secondary" type="button" onClick={startLive} disabled={saving}>
            <FiRefreshCw style={{ marginRight: 8 }} />
            Refresh
          </button>

          <button className="v-btn-secondary" type="button" onClick={stopWatch} disabled={saving}>
            <FiPause style={{ marginRight: 8 }} />
            Stop
          </button>

          <button className="v-btn-primary" type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      }
    >
      {err ? <div className="v-alert-error">{err}</div> : null}

      <div className="v-loc-card">
        <div className="v-loc-head">
          <div className="v-loc-title">
            <FiMapPin style={{ marginRight: 8 }} />
            Live Location
          </div>

          <div className="v-loc-meta">
            <span className={`v-badge ${status === "live" ? "v-badge-ok" : ""}`}>{badge}</span>
            {accuracy != null ? <span className="v-badge">± {Math.round(accuracy)} m</span> : null}
          </div>
        </div>

        <div className="v-grid-2" style={{ marginTop: 12 }}>
          <div>
            <label className="v-label">Latitude</label>
            <input className="v-input" value={lat} readOnly placeholder="Getting latitude..." />
          </div>

          <div>
            <label className="v-label">Longitude</label>
            <input className="v-input" value={lng} readOnly placeholder="Getting longitude..." />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="v-label">
              Area / Road {placeLoading ? <span style={{ opacity: 0.6 }}>(detecting…)</span> : null}
            </label>
            <input
              className="v-input"
              value={place || ""}
              readOnly
              placeholder="Detecting area/road name..."
              title={placeFull || ""}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="v-map-head">
              <div className="v-map-title">Map Preview</div>

              {laNum != null && lnNum != null ? (
                <button
                  type="button"
                  className="v-btn-secondary v-btn-sm"
                  onClick={() => window.open(getOsmOpenUrl(laNum, lnNum), "_blank", "noopener,noreferrer")}
                >
                  <FiExternalLink style={{ marginRight: 8 }} />
                  Open
                </button>
              ) : null}
            </div>

            <div className="v-map-wrap">
              {laNum != null && lnNum != null ? (
                <iframe className="v-map-iframe" title="visit-map" src={getOsmEmbedUrl(laNum, lnNum)} loading="lazy" />
              ) : (
                <div className="v-map-skeleton">Waiting for coordinates…</div>
              )}
            </div>
          </div>

          {withNotes ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="v-label">Notes</label>
              <input
                className="v-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          ) : null}

          <div style={{ gridColumn: "1 / -1" }} className="v-hint">
            Tip: In production you must use <b>HTTPS</b> for location permission on most browsers.
          </div>
        </div>
      </div>
    </VModal>
  );
};

export default LiveLocationModal;

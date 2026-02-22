import React, { useEffect, useRef, useState } from "react";
import { FiExternalLink, FiMapPin, FiPause, FiRefreshCw } from "react-icons/fi";
import AttendanceModal from "./AttendanceModal";
import { getOsmEmbedUrl, getOsmOpenUrl, reverseGeocodeOSM, safeNum } from "../attendance.utils";

const PunchModal = ({ open, mode, onClose, onConfirm }) => {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  const [place, setPlace] = useState("");
  const [placeFull, setPlaceFull] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | locating | live | stopped
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  const startLiveLocation = () => {
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

    setLat("");
    setLng("");
    setAccuracy(null);
    setPlace("");
    setPlaceFull("");
    setPlaceLoading(false);

    setSaving(false);
    setErr("");
    setStatus("idle");
    lastGeoRef.current = { key: "", ts: 0 };

    startLiveLocation();

    return () => {
      if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setErr("");
    try {
      setSaving(true);

      const la = safeNum(lat);
      const ln = safeNum(lng);

      if (la == null || ln == null) {
        setErr("Location not ready yet. Please wait or tap Refresh.");
        return;
      }

      await onConfirm({ latitude: la, longitude: ln });

      stopWatch();
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const laNum = safeNum(lat);
  const lnNum = safeNum(lng);

  const badge =
    status === "locating" ? "Locating…" : status === "live" ? "Live" : status === "stopped" ? "Stopped" : "Idle";

  return (
    <AttendanceModal
      open={open}
      title={mode === "IN" ? "Punch In" : "Punch Out"}
      subtitle="Live location will be captured automatically"
      onClose={() => {
        stopWatch();
        onClose();
      }}
      footer={
        <div className="att-modal-actions">
          <button
            className="att-btn-secondary"
            type="button"
            onClick={() => {
              stopWatch();
              onClose();
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <button className="att-btn-secondary" type="button" onClick={startLiveLocation} disabled={saving}>
            <FiRefreshCw style={{ marginRight: 8 }} />
            Refresh
          </button>

          <button className="att-btn-secondary" type="button" onClick={stopWatch} disabled={saving}>
            <FiPause style={{ marginRight: 8 }} />
            Stop
          </button>

          <button className="att-btn-primary" type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      }
    >
      {err ? <div className="att-alert-error">{err}</div> : null}

      <div className="att-loc-card">
        <div className="att-loc-head">
          <div className="att-loc-title">
            <FiMapPin style={{ marginRight: 8 }} />
            Live Location
          </div>

          <div className="att-loc-meta">
            <span className={`att-badge ${status === "live" ? "ok" : ""}`}>{badge}</span>
            {accuracy != null ? <span className="att-badge">± {Math.round(accuracy)} m</span> : null}
          </div>
        </div>

        <div className="att-grid-2" style={{ marginTop: 12 }}>
          <div>
            <label className="att-label">Latitude</label>
            <input className="att-input" value={lat} readOnly placeholder="Getting latitude..." />
          </div>

          <div>
            <label className="att-label">Longitude</label>
            <input className="att-input" value={lng} readOnly placeholder="Getting longitude..." />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="att-label">
              Area / Road {placeLoading ? <span style={{ opacity: 0.6 }}>(detecting…)</span> : null}
            </label>
            <input
              className="att-input"
              value={place || ""}
              readOnly
              placeholder="Detecting area/road name..."
              title={placeFull || ""}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="att-map-head">
              <div className="att-map-title">Map Preview</div>

              {laNum != null && lnNum != null ? (
                <button
                  type="button"
                  className="att-btn-secondary"
                  onClick={() => window.open(getOsmOpenUrl(laNum, lnNum), "_blank", "noopener,noreferrer")}
                  title="Open in OpenStreetMap"
                >
                  <FiExternalLink style={{ marginRight: 8 }} />
                  Open
                </button>
              ) : null}
            </div>

            <div className="att-map-wrap">
              {laNum != null && lnNum != null ? (
                <iframe className="att-map-iframe" title="map" src={getOsmEmbedUrl(laNum, lnNum)} loading="lazy" />
              ) : (
                <div className="att-map-skeleton">Waiting for coordinates…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AttendanceModal>
  );
};

export default PunchModal;

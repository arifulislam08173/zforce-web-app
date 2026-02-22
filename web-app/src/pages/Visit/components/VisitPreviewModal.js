import React, { useEffect, useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import VModal from "./VModal";
import StatusBadge from "./StatusBadge";
import { fmtDT, getOsmEmbedUrl, getOsmOpenUrl, reverseGeocodeOSM, safeNum } from "../visit.utils";

const VisitPreviewModal = ({ open, onClose, visit, userName, customer }) => {
  const [inAddr, setInAddr] = useState("");
  const [outAddr, setOutAddr] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(false);

  useEffect(() => {
    if (!open || !visit) return;

    const inLat = safeNum(visit.checkInLat);
    const inLng = safeNum(visit.checkInLng);
    const outLat = safeNum(visit.checkOutLat);
    const outLng = safeNum(visit.checkOutLng);

    let cancelled = false;

    const run = async () => {
      setLoadingAddr(true);
      try {
        setInAddr("");
        setOutAddr("");

        if (inLat != null && inLng != null) {
          const r = await reverseGeocodeOSM({ lat: inLat, lng: inLng });
          if (!cancelled) setInAddr(r.full || r.short || "");
        }
        if (outLat != null && outLng != null) {
          const r = await reverseGeocodeOSM({ lat: outLat, lng: outLng });
          if (!cancelled) setOutAddr(r.full || r.short || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingAddr(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, visit]);

  if (!open || !visit) return null;

  const inLat = safeNum(visit.checkInLat);
  const inLng = safeNum(visit.checkInLng);
  const outLat = safeNum(visit.checkOutLat);
  const outLng = safeNum(visit.checkOutLng);

  return (
    <VModal
      open={open}
      title="Visit Preview"
      subtitle={visit?.id}
      onClose={onClose}
      footer={
        <div className="v-footer">
          <button className="v-btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="v-preview-grid">
        <div className="v-preview-card">
          <div className="v-preview-title">Basic</div>
          <div className="v-preview-muted">
            <b>User:</b> {userName || visit.userId || "-"}
          </div>
          <div className="v-preview-muted">
            <b>Customer:</b> {customer?.name || visit.customerId || "-"}{" "}
            {customer?.phone ? <span className="v-muted">({customer.phone})</span> : null}
          </div>
          <div className="v-preview-muted">
            <b>Status:</b> <StatusBadge status={visit.status} />
          </div>
          <div className="v-preview-muted">
            <b>Planned:</b> {fmtDT(visit.plannedAt)}
          </div>
        </div>

        <div className="v-preview-card">
          <div className="v-preview-title">Check In</div>
          <div className="v-preview-muted">
            <b>Time:</b> {fmtDT(visit.checkInAt)}
          </div>
          <div className="v-preview-muted">
            <b>GPS:</b> {inLat != null && inLng != null ? `${inLat}, ${inLng}` : "-"}
          </div>
          <div className="v-preview-muted">
            <b>Place:</b> {loadingAddr && inLat != null ? "Detecting..." : inAddr || "-"}
          </div>

          <div className="v-map-head">
            <div className="v-map-title">Map</div>
            {inLat != null && inLng != null ? (
              <button
                type="button"
                className="v-btn-secondary v-btn-sm"
                onClick={() => window.open(getOsmOpenUrl(inLat, inLng), "_blank", "noopener,noreferrer")}
              >
                <FiExternalLink style={{ marginRight: 8 }} />
                Open
              </button>
            ) : null}
          </div>

          <div className="v-map-wrap">
            {inLat != null && inLng != null ? (
              <iframe className="v-map-iframe" title="checkin-map" src={getOsmEmbedUrl(inLat, inLng)} loading="lazy" />
            ) : (
              <div className="v-map-skeleton">No check-in location</div>
            )}
          </div>
        </div>

        <div className="v-preview-card">
          <div className="v-preview-title">Check Out</div>
          <div className="v-preview-muted">
            <b>Time:</b> {fmtDT(visit.checkOutAt)}
          </div>
          <div className="v-preview-muted">
            <b>GPS:</b> {outLat != null && outLng != null ? `${outLat}, ${outLng}` : "-"}
          </div>
          <div className="v-preview-muted">
            <b>Place:</b> {loadingAddr && outLat != null ? "Detecting..." : outAddr || "-"}
          </div>

          <div className="v-map-head">
            <div className="v-map-title">Map</div>
            {outLat != null && outLng != null ? (
              <button
                type="button"
                className="v-btn-secondary v-btn-sm"
                onClick={() => window.open(getOsmOpenUrl(outLat, outLng), "_blank", "noopener,noreferrer")}
              >
                <FiExternalLink style={{ marginRight: 8 }} />
                Open
              </button>
            ) : null}
          </div>

          <div className="v-map-wrap">
            {outLat != null && outLng != null ? (
              <iframe className="v-map-iframe" title="checkout-map" src={getOsmEmbedUrl(outLat, outLng)} loading="lazy" />
            ) : (
              <div className="v-map-skeleton">No check-out location</div>
            )}
          </div>
        </div>

        {visit?.notes ? (
          <div className="v-preview-card" style={{ gridColumn: "1 / -1" }}>
            <div className="v-preview-title">Notes</div>
            <div className="v-preview-muted" style={{ fontWeight: 600, opacity: 0.9 }}>
              {visit.notes}
            </div>
          </div>
        ) : null}
      </div>
    </VModal>
  );
};

export default VisitPreviewModal;

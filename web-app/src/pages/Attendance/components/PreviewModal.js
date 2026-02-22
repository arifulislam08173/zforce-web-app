import React from "react";
import { FiExternalLink } from "react-icons/fi";
import AttendanceModal from "./AttendanceModal";
import { formatDate, formatDT, getOsmEmbedUrl, getOsmOpenUrl, safeNum } from "../attendance.utils";

const PreviewModal = ({ open, row, userName, onClose }) => {
  if (!open || !row) return null;

  const inLat = safeNum(row.lat);
  const inLng = safeNum(row.lng);
  const outLat = safeNum(row.outLat);
  const outLng = safeNum(row.outLng);

  const inTime = row.punchIn || row.checkIn || row.inTime;
  const outTime = row.punchOut || row.checkOut || row.outTime;
  const date = row.date || row.attendanceDate || row.createdAt;

  return (
    <AttendanceModal
      open={open}
      title="Attendance Preview"
      subtitle="Punch in/out time + location"
      onClose={onClose}
      footer={
        <div className="att-modal-actions">
          <button className="att-btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="att-preview-grid">
        <div className="att-preview-card">
          <div className="att-preview-title">User</div>
          <div className="att-preview-value">
            <b>{userName || "-"}</b>
          </div>
          <div className="att-preview-muted">User ID: {row.userId || "-"}</div>
          <div className="att-preview-muted">Date: {formatDate(date)}</div>
        </div>

        <div className="att-preview-card">
          <div className="att-preview-title">Punch In</div>
          <div className="att-preview-muted">Time: {formatDT(inTime)}</div>
          <div className="att-preview-muted">
            Lat/Lng: {inLat != null ? inLat : "-"}, {inLng != null ? inLng : "-"}
          </div>

          <div className="att-map-head" style={{ marginTop: 10 }}>
            <div className="att-map-title">Punch In Map</div>
            {inLat != null && inLng != null ? (
              <button
                type="button"
                className="att-btn-secondary"
                onClick={() => window.open(getOsmOpenUrl(inLat, inLng), "_blank", "noopener,noreferrer")}
              >
                <FiExternalLink style={{ marginRight: 8 }} />
                Open
              </button>
            ) : null}
          </div>

          <div className="att-map-wrap">
            {inLat != null && inLng != null ? (
              <iframe className="att-map-iframe" title="punch-in-map" src={getOsmEmbedUrl(inLat, inLng)} loading="lazy" />
            ) : (
              <div className="att-map-skeleton">No punch-in location saved</div>
            )}
          </div>
        </div>

        <div className="att-preview-card">
          <div className="att-preview-title">Punch Out</div>
          <div className="att-preview-muted">Time: {formatDT(outTime)}</div>
          <div className="att-preview-muted">
            Lat/Lng: {outLat != null ? outLat : "-"}, {outLng != null ? outLng : "-"}
          </div>

          <div className="att-map-head" style={{ marginTop: 10 }}>
            <div className="att-map-title">Punch Out Map</div>
            {outLat != null && outLng != null ? (
              <button
                type="button"
                className="att-btn-secondary"
                onClick={() => window.open(getOsmOpenUrl(outLat, outLng), "_blank", "noopener,noreferrer")}
              >
                <FiExternalLink style={{ marginRight: 8 }} />
                Open
              </button>
            ) : null}
          </div>

          <div className="att-map-wrap">
            {outLat != null && outLng != null ? (
              <iframe className="att-map-iframe" title="punch-out-map" src={getOsmEmbedUrl(outLat, outLng)} loading="lazy" />
            ) : (
              <div className="att-map-skeleton">No punch-out location saved</div>
            )}
          </div>
        </div>
      </div>
    </AttendanceModal>
  );
};

export default PreviewModal;

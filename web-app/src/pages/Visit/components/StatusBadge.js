import React from "react";

const StatusBadge = ({ status }) => {
  const s = String(status || "PLANNED").toUpperCase();
  const cls =
    s === "COMPLETED"
      ? "v-badge v-badge-completed"
      : s === "MISSED"
      ? "v-badge v-badge-missed"
      : s === "IN_PROGRESS"
      ? "v-badge v-badge-progress"
      : "v-badge v-badge-planned";

  return <span className={cls}>{s}</span>;
};

export default StatusBadge;

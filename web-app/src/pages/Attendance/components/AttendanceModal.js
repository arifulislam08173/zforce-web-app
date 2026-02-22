import React from "react";
import { FiX } from "react-icons/fi";

const AttendanceModal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="att-modal-overlay" onMouseDown={onClose}>
      <div className="att-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="att-modal-header">
          <div>
            <div className="att-modal-title">{title}</div>
            {subtitle ? <div className="att-modal-subtitle">{subtitle}</div> : null}
          </div>

          <button className="att-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className="att-modal-body">{children}</div>

        {footer ? <div className="att-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default AttendanceModal;

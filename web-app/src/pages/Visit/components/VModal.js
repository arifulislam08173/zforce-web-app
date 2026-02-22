import React from "react";
import { FiX } from "react-icons/fi";

const VModal = ({ open, title, subtitle, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="v-modal-overlay" onMouseDown={onClose}>
      <div className="v-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="v-modal-header">
          <div>
            <div className="v-modal-title">{title}</div>
            {subtitle ? <div className="v-modal-subtitle">{subtitle}</div> : null}
          </div>

          <button className="v-icon-btn" type="button" onClick={onClose} title="Close">
            <FiX size={18} />
          </button>
        </div>

        <div style={{ marginTop: 12 }}>{children}</div>

        {footer ? <div className="v-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default VModal;

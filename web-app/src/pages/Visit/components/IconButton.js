import React from "react";

const IconButton = ({ title, onClick, variant = "default", children, disabled }) => {
  return (
    <button
      type="button"
      className={`v-icon-btn ${variant}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default IconButton;

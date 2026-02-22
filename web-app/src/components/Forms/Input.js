import React from 'react';

const Input = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div style={{ marginBottom: '10px' }}>
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
    />
  </div>
);

export default Input;

import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', placeholder, value, onChange, name, error, icon: Icon, ...rest }) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={`input-wrapper ${error ? 'error' : ''}`}>
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          className="input-field"
          {...rest}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};

export default Input;

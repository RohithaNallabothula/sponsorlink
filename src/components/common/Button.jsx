import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, type = 'button', disabled = false, icon: Icon, className = '', ...rest }) => {
  return (
    <button 
      className={`btn btn-${variant} ${className}`} 
      onClick={onClick} 
      type={type} 
      disabled={disabled}
      {...rest}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default Button;

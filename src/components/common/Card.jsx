import React from 'react';
import './Card.css';

const Card = ({ children, title, subtitle, footer, className = '', hover = true }) => {
  return (
    <div className={`card glass ${hover ? 'card-hover' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;

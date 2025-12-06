import React from 'react';
import './AnimatedButton.css';

const AnimatedButton = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={`animated-wave-btn ${variant === 'secondary' ? 'secondary' : ''}`}>
      <span className="btn-text">{children}</span>
    </button>
  );
};

export default AnimatedButton;

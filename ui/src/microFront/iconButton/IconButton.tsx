import React from 'react';
import './IconButton.css';

export interface IconButtonProps {
  src: string;
  alt?: string;
  onClick: () => void;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  src,
  alt = '',
  onClick,
  className = '',
}) => (
  <button className={`icon-button ${className}`} onClick={onClick}>
    <img src={src} alt={alt} className="icon-button__img" />
  </button>
);

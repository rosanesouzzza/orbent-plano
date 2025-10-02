import React from 'react';

export const AIPlannerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
    <path d="M5 2 L6 6" />
    <path d="M18 6 L19 2" />
    <path d="M18 18 L19 22" />
    <path d="M5 22 L6 18" />
  </svg>
);

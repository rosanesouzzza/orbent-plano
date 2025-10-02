import React from 'react';

export const WordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4zm6 0v6h6"
      clipRule="evenodd"
    />
    <path d="M8.75 11.5a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5zM10 11.25a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 01.75-.75zM12.75 11.5a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />

  </svg>
);

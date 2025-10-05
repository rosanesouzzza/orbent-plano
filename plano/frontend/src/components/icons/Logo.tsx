// Em: src/components/icons/Logo.tsx
import React from 'react';

interface LogoProps {
  isCollapsed?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ isCollapsed, className }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <svg className="w-8 h-8 flex-shrink-0 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM8.707 8.707a1 1 0 00-1.414 1.414L10.586 12l-3.293 3.293a1 1 0 101.414 1.414L12 13.414l3.293 3.293a1 1 0 001.414-1.414L13.414 12l3.293-3.293a1 1 0 00-1.414-1.414L12 10.586 8.707 8.707z"/>
    </svg>
    {!isCollapsed && (
      <span className="font-bold text-xl tracking-tight text-white whitespace-nowrap">
        Orbent Plan
      </span>
    )}
  </div>
);

import React from 'react';

export const Logo: React.FC<{ className?: string, isCollapsed?: boolean }> = ({ className, isCollapsed = false }) => (
    <div className={`flex items-center font-bold ${className}`}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3 flex-shrink-0">
            <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#2563eb"/>
                </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" stroke="url(#logoGrad)" strokeWidth="3" />
            <circle cx="16" cy="16" r="8" fill="url(#logoGrad)" />
        </svg>
        <span className={`text-white text-2xl tracking-tight whitespace-nowrap font-sans ${isCollapsed ? 'hidden' : 'inline-block'}`}>Orbent</span>
    </div>
);
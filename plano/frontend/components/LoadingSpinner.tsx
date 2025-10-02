import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string; isFullScreen?: boolean }> = ({ text = "Carregando...", isFullScreen = false }) => {
    const containerClasses = isFullScreen
        ? "fixed inset-0 flex flex-col items-center justify-center bg-base-100/80 backdrop-blur-sm z-[100]"
        : "flex items-center justify-center p-4";
    
    return (
        <div className={containerClasses}>
            <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 rounded-full animate-pulse bg-primary"></div>
                <div className="w-6 h-6 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-6 h-6 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="mt-4 text-lg font-semibold text-secondary">{text}</span>
        </div>
    );
};
import React, { useState, useRef, useEffect } from 'react';
import { ExportIcon } from './icons/ExportIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

export interface ExportOption {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface ExportSection {
  title: string;
  options: ExportOption[];
}

interface ExportMenuProps {
  isExporting: boolean;
  sections: ExportSection[];
}

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Exportando..." }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
        <span className="text-secondary text-sm font-semibold">{text}</span>
    </div>
);

export const ExportMenu: React.FC<ExportMenuProps> = ({ isExporting, sections }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (onClick: () => void) => {
    setIsOpen(false);
    onClick();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="bg-white border border-neutral-300 text-secondary px-3 py-1.5 rounded-lg font-semibold hover:bg-neutral-50 transition-colors flex items-center shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar"
      >
        {isExporting ? <LoadingSpinner /> : (
          <>
            <ExportIcon className="w-5 h-5 mr-2" />
            Exportar
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-40 animate-fade-in">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {sections.map((section, sectionIndex) => (
              <div key={section.title}>
                {sectionIndex > 0 && <div className="border-t my-1 border-border-color"></div>}
                <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">{section.title}</div>
                {section.options.map((option) => (
                  <a
                    key={option.label}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleOptionClick(option.onClick); }}
                    className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    role="menuitem"
                  >
                    {option.icon} {option.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
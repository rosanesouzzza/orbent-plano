// Em src/components/Header.tsx
import React, { useRef, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';

// Definimos aqui as informações que o Header precisa receber
interface HeaderProps {
  title?: string;
  className?: string;
  // Adicionaremos as props de busca depois, se necessário
}

export const Header: React.FC<HeaderProps> = ({ title, className }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Efeito para focar na busca ao pressionar "/"
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className={`bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0 border-b border-border-color ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <h1 className="text-2xl font-bold text-secondary truncate">
            {title || "Orbent Action Plan"}
          </h1>
          <div role="search" className="flex-shrink-0">
              <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                      ref={searchInputRef}
                      type="search"
                      // value={} // Desabilitado por enquanto
                      // onChange={} // Desabilitado por enquanto
                      placeholder="Buscar (Pressione /)"
                      className="block w-full bg-white border border-neutral-300 rounded-lg py-2 pl-10 pr-4 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
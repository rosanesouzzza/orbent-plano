import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={`w-full bg-base-100 py-4 mt-auto ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Orbent. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};
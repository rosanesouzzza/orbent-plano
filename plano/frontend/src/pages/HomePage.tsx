import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-secondary">Bem-vindo ao Orbent Action Plan</h1>
        <p className="text-neutral-600">
          Utilize o menu lateral para navegar entre o dashboard, os planos de ação e os relatórios.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-secondary">Planos em destaque</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Assim que você selecionar um plano pelo menu, os detalhes aparecerão aqui.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-secondary">Relatórios recentes</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Gere relatórios personalizados e acompanhe os resultados das ações implementadas.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

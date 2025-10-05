// Em: C:\orbent-dev\plano\frontend\src\App.tsx

import React, { useState } from 'react';

// Importações dos componentes visuais
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Importações das suas páginas funcionais
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';

// Um tipo simples para ajudar na navegação
type View = 'home' | 'dashboard' | 'reports' | 'ai-planner' | 'global-report';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Função simples para renderizar a página correta
  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'reports':
        return <ReportsPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    // ESTRUTURA PRINCIPAL DO LAYOUT
    <div className="flex h-screen bg-neutral-100"> {/* Fundo cinza claro */}
      
      {/* BARRA LATERAL */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        // ---- Props que ainda precisamos implementar a lógica ----
        currentView={'dashboard'} 
        setCurrentView={() => {}}
        currentPlan={null}
        onHome={() => setCurrentView('home')}
        onNavigate={(view: any) => setCurrentView(view)}
        onOpenCreatePlanModal={() => alert('Abrir modal de criação')}
        className="print:hidden" // Esconde a sidebar ao imprimir
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* CABEÇALHO */}
        <Header 
          title="Meus Planos de Ação" 
          className="print:hidden" // Esconde o cabeçalho ao imprimir
        />

        {/* CONTEÚDO DA PÁGINA (com scroll) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderMainContent()}
        </main>
        
        {/* RODAPÉ (opcional, pode remover se não quiser) */}
        <Footer className="print:hidden" />

      </div>
    </div>
  );
}

export default App;
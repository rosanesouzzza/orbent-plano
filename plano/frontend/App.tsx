// Em: C:\orbent-dev\plano\frontend\src\App.tsx

import React, { useState } from 'react';

// CORREÇÃO APLICADA AQUI: Apontamos para o arquivo .tsx dentro da pasta
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Nossas páginas que já funcionam
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  // Simples controle de qual página mostrar. Vamos começar com a HomePage.
  const [currentView, setCurrentView] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderMainContent = () => {
    if (currentView === 'dashboard') {
      return <DashboardPage />;
    }
    if (currentView === 'reports') {
      return <ReportsPage />;
    }
    // Por padrão, mostra a Home
    return <HomePage />;
  };

  return (
    <div className="flex h-screen bg-base-100">
      {/* Ainda precisaremos passar as propriedades corretas aqui depois,
        mas por enquanto o importante é fazer o layout aparecer.
      */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentPlan={null}
        onHome={() => setCurrentView('home')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigate={setCurrentView}
        onOpenCreatePlanModal={() => alert('Abrir modal de criação')}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Orbent Action Plan"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {renderMainContent()}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
import React from 'react';
import { Plan, PlanView, NavItem } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { PlanIcon } from './icons/PlanIcon';
import { ReportIcon } from './icons/ReportIcon';
import { HomeIcon } from './icons/HomeIcon';
import { Logo } from './icons/Logo';
import { ChevronsLeftIcon } from './icons/ChevronsLeftIcon';
import { AIPlannerIcon } from './icons/AIPlannerIcon';
import { AddIcon } from './icons/AddIcon';

interface SidebarProps {
  currentView: PlanView;
  setCurrentView: (view: PlanView) => void;
  currentPlan: Plan | null;
  onHome: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onNavigate: (view: PlanView) => void;
  onOpenCreatePlanModal: () => void;
}

// Plan-specific navigation items
const planNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'plan', label: 'Plano de Ação', icon: PlanIcon },
    { id: 'report', label: 'Relatórios', icon: ReportIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    currentPlan, 
    onHome, 
    isCollapsed,
    onToggleCollapse,
    className,
    onNavigate,
    onOpenCreatePlanModal,
}) => {
  const isHomeActive = !currentPlan && currentView === 'dashboard';
  const navMenuId = "sidebar-nav-menu";

  return (
    <aside className={`bg-neutral-900 text-white flex flex-col flex-shrink-0 h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} ${className}`}>
      <button 
        onClick={() => onNavigate('dashboard')}
        className={`h-16 w-full flex items-center border-b border-white/10 transition-colors duration-300 hover:bg-white/5 ${isCollapsed ? 'justify-center' : 'px-6'}`}
        aria-label="Voltar para Meus Planos"
      >
        <Logo isCollapsed={isCollapsed} />
      </button>
      
      <div className={`px-3 pt-4 pb-2`}>
        <button
            onClick={onOpenCreatePlanModal}
            className={`w-full flex items-center text-sm font-semibold rounded-lg transition-colors duration-200 bg-primary text-white hover:bg-primary-hover shadow-md ${isCollapsed ? 'justify-center p-2.5' : 'px-4 py-2.5'}`}
        >
            <AddIcon className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline-block'}`}>Criar Novo Plano</span>
        </button>
      </div>


      {currentPlan && (
        <div className={`px-4 py-2 border-b border-white/10 animate-fade-in overflow-hidden ${isCollapsed ? 'h-0 p-0 border-none' : 'h-auto'}`}>
          <p className="text-xs text-neutral-400 mb-1">PROJETO ATUAL</p>
          <h2 className="font-bold text-base truncate" title={currentPlan.planName}>
            <span className="font-mono text-sm">[{currentPlan.planCode}]</span> {currentPlan.planName}
          </h2>
          <p className="text-sm text-neutral-300 truncate" title={currentPlan.clientName}>{currentPlan.clientName}</p>
        </div>
      )}

      <nav id={navMenuId} className="flex-1 px-3 py-4 space-y-1">
        {/* Global Nav */}
        <button
          onClick={() => onNavigate('dashboard')}
          aria-label="Início"
          aria-current={isHomeActive ? 'page' : undefined}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${
            isHomeActive
              ? 'bg-white/10 text-white'
              : 'text-neutral-300 hover:bg-white/10'
          }`}
        >
          <HomeIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline-block'}`}>Início</span>
        </button>
        <button
          onClick={() => onNavigate('ai-planner')}
          aria-label="AI Planner"
          aria-current={currentView === 'ai-planner' ? 'page' : undefined}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${
            currentView === 'ai-planner'
              ? 'bg-white/10 text-white'
              : 'text-neutral-300 hover:bg-white/10'
          }`}
        >
          <AIPlannerIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline-block'}`}>AI Planner</span>
        </button>
        <button
          onClick={() => onNavigate('global-report')}
          aria-label="Relatórios Globais"
          aria-current={currentView === 'global-report' ? 'page' : undefined}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${
            currentView === 'global-report'
              ? 'bg-white/10 text-white'
              : 'text-neutral-300 hover:bg-white/10'
          }`}
        >
          <ReportIcon className="w-5 h-5 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline-block'}`}>Relatórios Globais</span>
        </button>

        {/* Plan-Specific Nav */}
        {currentPlan && (
          <div className="pt-2 mt-2 space-y-1 border-t border-white/10">
            {planNavItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline-block'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 mt-auto">
        <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Minimizar menu lateral'}
            aria-expanded={!isCollapsed}
            aria-controls={navMenuId}
        >
            <ChevronsLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
};
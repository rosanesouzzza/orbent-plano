import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plan, PlanReason, ActionItem, ActionStatus, PlanStatus, NewPlanData } from '../types';
import { Modal } from './Modal';
import { AddIcon } from './icons/AddIcon';
import { CreatePlanForm } from './CreatePlanForm';
import { DeleteIcon } from './icons/DeleteIcon';
import { CancelIcon } from './icons/CancelIcon';
import { PlanIcon } from './icons/PlanIcon';
import { parseAsUTC, safeFormatDate } from '../utils/dateUtils';
import { getDisplayStatus } from '../utils/styleUtils';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ListIcon } from './icons/ListIcon';
import { CardIcon } from './icons/CardIcon';

interface User {
    id: number;
    name: string;
    email: string;
}

interface HomeDashboardProps {
  plans: Plan[];
  isOperating: boolean;
  currentUser: User | null;
  onSelectPlan: (planId: number) => void;
  onDeletePlan: (planId: number) => void;
  onCancelPlan: (planId: number) => void;
}

type PlanOverallStatus = 'Concluído' | 'Atrasado' | 'Em Andamento' | 'Cancelado';

const getPlanStatus = (plan: Plan): PlanOverallStatus => {
    if (plan.status === PlanStatus.CANCELADO) return 'Cancelado';
    if (plan.status === PlanStatus.CONCLUIDO || plan.conclusionDate) return 'Concluído';
    if (plan.actionItems.length === 0) return 'Em Andamento';
    
    const isOverdue = plan.actionItems.some(item => getDisplayStatus(item).label === 'Em Atraso');

    if (isOverdue) return 'Atrasado';

    const allCompleted = plan.actionItems.every(item => item.status === ActionStatus.CONCLUIDO);
    if (allCompleted) return 'Concluído';
    
    return 'Em Andamento';
};

const PlanStatusBadge: React.FC<{ status: PlanOverallStatus }> = ({ status }) => {
    const statusClasses: Record<PlanOverallStatus, string> = {
        'Concluído': 'bg-success/10 text-success',
        'Atrasado': 'bg-error/10 text-error',
        'Em Andamento': 'bg-primary/10 text-primary-text',
        'Cancelado': 'bg-neutral-200 text-neutral-800',
    };
    return (
        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${statusClasses[status]}`}>
            {status}
        </span>
    );
};

const PlanCard: React.FC<{ plan: Plan; onSelect: () => void; onCancel: () => void; onDelete: () => void; isOperating: boolean; }> = ({ plan, onSelect, onCancel, onDelete, isOperating }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const status = getPlanStatus(plan);
    const totalActions = plan.actionItems.length;
    const completedActions = plan.actionItems.filter(a => a.status === ActionStatus.CONCLUIDO).length;
    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    
    return (
        <div className="bg-white rounded-xl shadow-card border border-border-color hover:shadow-card-hover transition-shadow duration-300 flex flex-col">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-neutral-500 mb-1 block">[{plan.planCode}]</span>
                    <PlanStatusBadge status={status} />
                </div>
                <h3 className="font-bold text-secondary text-lg leading-tight mt-1">{plan.planName}</h3>
                <p className="text-sm text-neutral-500">{plan.clientName}</p>
                
                <div className="mt-4 flex items-center gap-4">
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-neutral-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-primary" strokeWidth="3" fill="none" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-secondary">{progress}%</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-secondary">{completedActions} de {totalActions} ações concluídas</p>
                        <p className="text-xs text-neutral-500 mt-1">Criado em: <span className="font-semibold">{safeFormatDate(plan.emissionDate)}</span></p>
                    </div>
                </div>
            </div>
            <div className="border-t border-border-color px-5 py-3 flex justify-between items-center bg-neutral-50/40">
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isOperating} className="p-1.5 text-neutral-500 hover:text-secondary rounded-md hover:bg-neutral-200 disabled:opacity-50">
                       <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute left-0 bottom-full mb-2 w-40 bg-white rounded-md shadow-lg border border-border-color z-10 animate-fade-in">
                            <ul className="py-1 text-sm text-neutral-700">
                                {status !== 'Cancelado' && status !== 'Concluído' && (
                                     <li><button onClick={onCancel} className="w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center"><CancelIcon className="w-4 h-4 mr-2"/>Cancelar</button></li>
                                )}
                                <li><button onClick={onDelete} className="w-full text-left px-4 py-2 text-error hover:bg-neutral-100 flex items-center"><DeleteIcon className="w-4 h-4 mr-2"/>Excluir</button></li>
                            </ul>
                        </div>
                    )}
                </div>
                <button onClick={onSelect} disabled={isOperating} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:bg-neutral-400 disabled:cursor-not-allowed">
                    Abrir Plano
                </button>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-xl shadow-card border border-border-color flex items-center">
        <div className="p-3 rounded-full bg-primary/10 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-3xl font-bold text-secondary">{value}</p>
        </div>
    </div>
);

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ plans, isOperating, currentUser, onSelectPlan, onDeletePlan, onCancelPlan }) => {
    const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'canceled'>('ongoing');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    const globalKpis = useMemo(() => {
        const activePlans = plans.filter(p => getPlanStatus(p) === 'Em Andamento' || getPlanStatus(p) === 'Atrasado');
        const overdueActionsCount = activePlans.reduce((acc, plan) => {
            return acc + plan.actionItems.filter(item => getDisplayStatus(item).label === 'Em Atraso').length;
        }, 0);

        const totalProgress = activePlans.reduce((acc, plan) => {
             const totalActions = plan.actionItems.length;
             if (totalActions === 0) return acc;
             const completedActions = plan.actionItems.filter(a => a.status === ActionStatus.CONCLUIDO).length;
             return acc + (completedActions / totalActions) * 100;
        }, 0);
        const overallProgress = activePlans.length > 0 ? Math.round(totalProgress / activePlans.length) : 0;
        
        return {
            activePlans: activePlans.length,
            overdueActions: overdueActionsCount,
            progress: `${overallProgress}%`
        }
    }, [plans]);

    const filteredPlans = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return plans.filter(plan => {
            const status = getPlanStatus(plan);
            let tabMatch = false;
            switch (activeTab) {
                case 'ongoing':
                    tabMatch = status === 'Em Andamento' || status === 'Atrasado';
                    break;
                case 'completed':
                    tabMatch = status === 'Concluído';
                    break;
                case 'canceled':
                    tabMatch = status === 'Cancelado';
                    break;
                default:
                    tabMatch = true;
            }
            if (!tabMatch) return false;

            if (!lowercasedQuery) return true;
            return plan.planName.toLowerCase().includes(lowercasedQuery) || plan.clientName.toLowerCase().includes(lowercasedQuery);
        });
    }, [plans, activeTab, searchQuery]);
    
    const TabButton: React.FC<{tabName: typeof activeTab, label: string}> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabName
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral-500 hover:bg-neutral-200 hover:text-secondary'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                     <h1 className="text-3xl font-bold text-secondary">Olá, {currentUser?.name.split(' ')[0]}!</h1>
                     <p className="text-lg text-neutral-500">Gerencie todos os seus projetos em um só lugar.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <KpiCard title="Planos Ativos" value={globalKpis.activePlans} icon={<CheckCircleIcon className="w-6 h-6 text-primary" />} />
                <KpiCard title="Ações Atrasadas" value={globalKpis.overdueActions} icon={<AlertTriangleIcon className="w-6 h-6 text-error" />} />
                <KpiCard title="Progresso Geral" value={globalKpis.progress} icon={<TrendingUpIcon className="w-6 h-6 text-success" />} />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="inline-flex items-center bg-neutral-100 rounded-lg p-1 space-x-1">
                    <TabButton tabName="ongoing" label="Em Andamento" />
                    <TabButton tabName="completed" label="Concluídos" />
                    <TabButton tabName="canceled" label="Cancelados" />
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative w-full sm:max-w-xs">
                        <input 
                            type="search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nome ou cliente..."
                            className="block w-full bg-white border border-neutral-300 rounded-lg py-2 px-4 text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                     <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode('card')} title="Visualização em Cartões" className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-neutral-500 hover:bg-neutral-200'}`}><CardIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('table')} title="Visualização em Tabela" className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-neutral-500 hover:bg-neutral-200'}`}><ListIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>

            {filteredPlans.length > 0 ? (
                viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPlans.map(plan => (
                            <PlanCard 
                                key={plan.id} 
                                plan={plan}
                                isOperating={isOperating}
                                onSelect={() => onSelectPlan(plan.id)}
                                onCancel={() => {
                                    if (window.confirm(`Tem certeza que deseja cancelar o plano "${plan.planName}"?`)) {
                                        onCancelPlan(plan.id);
                                    }
                                }}
                                onDelete={() => {
                                    if (window.confirm(`Tem certeza que deseja EXCLUIR o plano "${plan.planName}"? Esta ação não pode ser desfeita.`)) {
                                        onDeletePlan(plan.id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-card border border-border-color overflow-x-auto">
                        <table className="w-full text-sm text-left text-neutral-500">
                            <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                                <tr>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Nome do Plano</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Progresso</th>
                                    <th className="px-4 py-3">Ações</th>
                                    <th className="px-4 py-3">Criado em</th>
                                    <th className="px-4 py-3"><span className="sr-only">Menu</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlans.map(plan => {
                                    const status = getPlanStatus(plan);
                                    const totalActions = plan.actionItems.length;
                                    const completedActions = plan.actionItems.filter(a => a.status === ActionStatus.CONCLUIDO).length;
                                    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
                                    return (
                                        <tr key={plan.id} className="bg-white border-b border-border-color hover:bg-neutral-50">
                                            <td className="px-4 py-4"><PlanStatusBadge status={status} /></td>
                                            <td className="px-4 py-4 font-semibold text-secondary">{plan.planName}</td>
                                            <td className="px-4 py-4">{plan.clientName}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-neutral-200 rounded-full h-2">
                                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <span className="font-semibold">{progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{completedActions}/{totalActions}</td>
                                            <td className="px-4 py-4">{safeFormatDate(plan.emissionDate)}</td>
                                            <td className="px-4 py-4">
                                                <button onClick={() => onSelectPlan(plan.id)} className="font-semibold text-primary hover:underline">Abrir</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                 <div className="text-center py-16 bg-white rounded-xl shadow-card border border-dashed border-neutral-300">
                    <PlanIcon className="mx-auto h-12 w-12 text-neutral-300" />
                    <h2 className="mt-4 text-xl font-semibold text-secondary">Nenhum plano de ação encontrado.</h2>
                    <p className="text-neutral-500 mt-2">Ajuste os filtros ou crie um novo plano para começar.</p>
                </div>
            )}
        </div>
    );
};
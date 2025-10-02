import React, { useState, useMemo } from 'react';
import { Plan, SavedReport, PlanStatus } from '../types';
import { PlanIcon } from './icons/PlanIcon';
import { parseAsUTC } from '../utils/dateUtils';

interface GlobalReportsProps {
    plans: Plan[];
    savedReports: SavedReport[];
    onViewReport: (report: SavedReport) => void;
}

const ReportCard: React.FC<{ report: SavedReport; plan: Plan | undefined; onView: () => void; }> = ({ report, plan, onView }) => (
    <div className="bg-white rounded-lg shadow-card border border-border-color p-5 flex flex-col justify-between h-full hover:shadow-card-hover transition-shadow">
        <div>
            <div className="flex items-start gap-4">
                <div className="bg-primary-light p-2 rounded-lg">
                    <PlanIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h4 className="font-bold text-secondary text-base leading-tight flex-grow">{report.reportName}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{plan?.planName || 'Plano não encontrado'}</p>
                </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
                Gerado em: {new Date(report.generatedAt).toLocaleString('pt-BR')}
            </p>
        </div>
        <div className="mt-4 flex justify-end">
            <button onClick={onView} className="text-sm font-semibold text-primary hover:underline">
                Ver Relatório &rarr;
            </button>
        </div>
    </div>
);

export const GlobalReports: React.FC<GlobalReportsProps> = ({ plans, savedReports, onViewReport }) => {
    const [clientFilter, setClientFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const clientOptions = useMemo(() => ['Todos', ...Array.from(new Set(plans.map(p => p.clientName)))], [plans]);
    
    const recentReports = useMemo(() => {
        return savedReports
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .slice(0, 3);
    }, [savedReports]);

    const filteredReports = useMemo(() => {
        return savedReports
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .filter(report => {
                const plan = plans.find(p => p.id === report.planId);
                if (!plan) return false;

                const lowercasedQuery = searchQuery.toLowerCase();
                const searchMatch = lowercasedQuery === '' ||
                    report.reportName.toLowerCase().includes(lowercasedQuery) ||
                    plan.planName.toLowerCase().includes(lowercasedQuery) ||
                    plan.clientName.toLowerCase().includes(lowercasedQuery) ||
                    (plan.status && plan.status.toLowerCase().includes(lowercasedQuery));

                const clientMatch = clientFilter === 'Todos' || plan.clientName === clientFilter;
                const statusMatch = statusFilter === 'Todos' || plan.status === statusFilter;
                
                const reportDate = parseAsUTC(report.generatedAt.split('T')[0]);
                if (isNaN(reportDate.getTime())) return false;

                const startDate = parseAsUTC(startDateFilter);
                const endDate = parseAsUTC(endDateFilter);

                const startMatch = isNaN(startDate.getTime()) || reportDate.getTime() >= startDate.getTime();
                const endMatch = isNaN(endDate.getTime()) || reportDate.getTime() <= endDate.getTime();

                return searchMatch && clientMatch && statusMatch && startMatch && endMatch;
        });
    }, [savedReports, plans, clientFilter, statusFilter, startDateFilter, endDateFilter, searchQuery]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-slide-in-up space-y-8">
            <h1 className="text-3xl font-bold text-secondary">Relatórios Globais</h1>
            
            {recentReports.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-secondary mb-4">Últimos Relatórios Criados</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentReports.map(report => {
                             const plan = plans.find(p => p.id === report.planId);
                             return <ReportCard key={report.id} report={report} plan={plan} onView={() => onViewReport(report)} />
                        })}
                    </div>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-card border border-border-color">
                 <h2 className="text-2xl font-bold text-secondary mb-4">Todos os Relatórios</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pb-4 mb-4 border-b border-border-color">
                    <div className="lg:col-span-1">
                        <label htmlFor="reportSearch" className="block text-sm font-medium text-neutral-700">Buscar</label>
                        <input 
                            type="search" 
                            id="reportSearch"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Nome, plano, cliente ou status..."
                            className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="clientFilter" className="block text-sm font-medium text-neutral-700">Cliente</label>
                        <select id="clientFilter" value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="mt-1 w-full pl-3 pr-8 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md bg-white">
                            {clientOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-neutral-700">Status do Plano</label>
                        <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 w-full pl-3 pr-8 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md bg-white">
                            <option value="Todos">Todos</option>
                            {Object.values(PlanStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDateFilter" className="block text-sm font-medium text-neutral-700">De</label>
                        <input type="date" id="startDateFilter" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="endDateFilter" className="block text-sm font-medium text-neutral-700">Até</label>
                        <input type="date" id="endDateFilter" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                </div>

                 {filteredReports.length > 0 ? (
                    <table className="w-full text-sm text-left text-neutral-500">
                        <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                            <tr>
                                <th scope="col" className="px-4 py-3">Nome do Relatório</th>
                                <th scope="col" className="px-4 py-3">Plano de Ação</th>
                                <th scope="col" className="px-4 py-3">Cliente</th>
                                <th scope="col" className="px-4 py-3">Data de Geração</th>
                                <th scope="col" className="px-4 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border-color">
                            {filteredReports.map(report => {
                                const plan = plans.find(p => p.id === report.planId);
                                return (
                                <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                                    <td className="px-4 py-4 font-medium text-secondary flex items-center"><PlanIcon className="w-5 h-5 mr-3 text-neutral-400"/>{report.reportName}</td>
                                    <td className="px-4 py-4">{plan?.planName || 'N/A'}</td>
                                    <td className="px-4 py-4">{plan?.clientName || 'N/A'}</td>
                                    <td className="px-4 py-4">{new Date(report.generatedAt).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => onViewReport(report)} className="font-medium text-primary hover:underline">Ver Relatório</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 ) : (
                    <div className="text-center py-10">
                        <h2 className="text-xl font-semibold text-secondary">Nenhum relatório encontrado.</h2>
                        <p className="text-neutral-500 mt-2">Ajuste os filtros ou gere novos relatórios dentro dos planos de ação.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};
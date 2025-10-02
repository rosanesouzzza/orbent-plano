import React, { useState } from 'react';
import { Plan, ActionItem, SavedReport } from '../types';
import { AddIcon } from './icons/AddIcon';
import { Modal } from './Modal';
import { PlanIcon } from './icons/PlanIcon';

interface ReportsProps {
  currentPlan: Plan;
  savedReports: SavedReport[];
  onViewReport: (report: SavedReport) => void;
  onGenerateReport: (reportName: string, items: ActionItem[]) => Promise<void>;
  isGeneratingReport: boolean;
}

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Gerando relatório..." }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2 text-white">{text}</span>
    </div>
);

const ReportCard: React.FC<{ report: SavedReport; onView: () => void; }> = ({ report, onView }) => (
    <div className="bg-white rounded-xl shadow-card border border-border-color p-5 flex flex-col justify-between h-full hover:shadow-card-hover transition-shadow">
        <div>
            <div className="flex items-start gap-4">
                <div className="bg-primary-light p-2 rounded-lg">
                    <PlanIcon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-secondary text-base leading-tight flex-grow">{report.reportName}</h4>
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


export const ExecutiveReport: React.FC<ReportsProps> = ({ 
    currentPlan, 
    savedReports, 
    onViewReport,
    onGenerateReport,
    isGeneratingReport
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reportName, setReportName] = useState('');
    const [modalError, setModalError] = useState('');

    const recentReports = savedReports.slice(0, 3);

    const handleOpenGenerateModal = () => {
        const now = new Date();
        const formattedDateTime = now.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        setReportName(`${currentPlan.planName} - ${formattedDateTime}`);
        setModalError('');
        setIsModalOpen(true);
    };

    const handleGenerateAndShowReport = async () => {
        if (!reportName.trim()) {
            setModalError('O nome do relatório é obrigatório.');
            return;
        }
        setIsModalOpen(false);
        // Reports generated from this page always use the full action item list
        await onGenerateReport(reportName, currentPlan.actionItems);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-slide-in-up space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-secondary">Relatórios do Plano</h2>
                    <p className="text-sm text-neutral-500">{currentPlan.planName} - {currentPlan.clientName}</p>
                </div>
                <button onClick={handleOpenGenerateModal} disabled={isGeneratingReport} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors flex items-center shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed">
                    {isGeneratingReport ? <LoadingSpinner text="Gerando..."/> : <><AddIcon className="h-5 w-5 mr-2" /> Gerar Novo Relatório</>}
                </button>
            </div>
            
            {recentReports.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-secondary mb-4">Últimos Relatórios Criados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentReports.map(report => (
                             <ReportCard key={report.id} report={report} onView={() => onViewReport(report)} />
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-card border border-border-color">
                 <h3 className="text-xl font-bold text-secondary mb-4">Todos os Relatórios Salvos</h3>
                <div className="overflow-x-auto">
                    {savedReports.length > 0 ? (
                        <table className="w-full text-sm text-left text-neutral-500">
                             <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Nome do Relatório</th>
                                    <th scope="col" className="px-4 py-3">Data de Geração</th>
                                    <th scope="col" className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-border-color">
                                {savedReports.map(report => (
                                    <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-secondary flex items-center">
                                            <PlanIcon className="w-5 h-5 mr-3 text-neutral-400"/>
                                            {report.reportName}
                                        </td>
                                        <td className="px-4 py-4 text-neutral-700">{new Date(report.generatedAt).toLocaleString('pt-BR')}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => onViewReport(report)} className="font-medium text-primary hover:underline">Ver Relatório</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-10">
                            <h2 className="text-xl font-semibold text-secondary">Nenhum relatório salvo.</h2>
                            <p className="text-neutral-500 mt-2">Clique em "Gerar Novo Relatório" para criar o primeiro.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gerar Novo Relatório">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="reportName" className="block text-sm font-medium text-secondary">Nome do Relatório</label>
                        <input type="text" id="reportName" value={reportName} onChange={e => setReportName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    {modalError && <p className="text-sm text-error">{modalError}</p>}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border-color">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-neutral-100 text-secondary px-4 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">Cancelar</button>
                        <button type="button" onClick={handleGenerateAndShowReport} disabled={isGeneratingReport} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed">
                            {isGeneratingReport ? 'Gerando...' : 'Gerar e Visualizar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
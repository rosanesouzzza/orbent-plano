





import React, { useMemo, useState } from 'react';
// Import ActionItem to resolve type errors.
import { SavedReport, ActionPriority, ActionStatus, ActionType, ActionItem } from '../types';
import Markdown from 'react-markdown';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { strategicPillars } from '../data/strategicPillars';
import { getDisplayStatus, PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from '../utils/styleUtils';
import { PrintableExecutiveReport } from './PrintableExecutiveReport';
import { ExportMenu, ExportSection } from './ExportMenu';
import { PdfIcon } from './icons/PdfIcon';
import { WordIcon } from './icons/WordIcon';
import { useExportHandler } from '../hooks/useExportHandler';
import { parseAsUTC, safeFormatDate } from '../utils/dateUtils';
import { generatePdfReport } from '../utils/reportGeneratorService';

// --- HELPER FUNCTIONS ---
const dayDiff = (date1: Date, date2: Date): number => {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};


// --- SUB-COMPONENTS ---
const PillarCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 flex flex-col justify-between shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 h-10">{title}</h3>
        <span className="text-3xl font-black text-[#004080] self-end">{value}</span>
    </div>
);

const MinimalGanttForReport: React.FC<{ actionItems: ActionItem[] }> = ({ actionItems }) => {
    const ganttData = useMemo(() => {
        const itemsWithValidDates = actionItems.filter(i => !isNaN(parseAsUTC(i.prazo).getTime()));
        if (itemsWithValidDates.length === 0) return null;

        const dates = itemsWithValidDates.map(i => parseAsUTC(i.prazo));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        const timelineStart = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
        const timelineEnd = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth() + 1, 0));
        
        const totalDuration = dayDiff(timelineStart, timelineEnd);
        if (totalDuration <= 0) return null;

        // @fix: The initial value for reduce must be typed to ensure `groupedByPillar` has the correct type.
        // I will fix this by typing the accumulator parameter.
        // FIX: Typed the accumulator for the reduce function to ensure type safety.
        // The initial value for reduce was an empty object `{}`, which TypeScript infers as `unknown`. By explicitly typing the accumulator `acc` and casting the initial value, we ensure `groupedByPillar` has the correct type `Record<string, ActionItem[]>`, resolving the downstream `.map` error.
        const groupedByPillar = itemsWithValidDates.reduce((acc: Record<string, ActionItem[]>, item) => {
            const pillar = item.pilarEstrategico;
            if (!acc[pillar]) {
                acc[pillar] = [];
            }
            acc[pillar].push(item);
            return acc;
        // FIX: Explicitly typing the initial value of reduce ensures TypeScript correctly infers the return type, fixing the downstream '.map' error.
        }, {} as Record<string, ActionItem[]>);

        return { timelineStart, totalDuration, groupedByPillar };
    }, [actionItems]);

    if (!ganttData) {
        return <div className="text-center py-4 text-sm text-gray-500">Nenhuma ação com data válida para exibir.</div>;
    }

    const { timelineStart, totalDuration, groupedByPillar } = ganttData;

    return (
      <div className="text-xs font-sans space-y-2">
        {Object.entries(groupedByPillar).map(([pillar, items]) => (
          <div key={pillar} className="flex items-center border-b border-gray-200 py-1 last:border-b-0">
            <h5 className="w-1/3 font-semibold text-secondary pr-2 truncate" title={pillar}>{pillar}</h5>
            <div className="w-2/3 relative h-5 bg-gray-100 rounded">
                {items.map(item => {
                    const offsetDays = dayDiff(timelineStart, parseAsUTC(item.prazo));
                    const left = (offsetDays / totalDuration) * 100;
                    const { color } = getDisplayStatus(item);
                    return (
                        <div 
                          key={item.id} 
                          className="absolute w-2 h-2 rounded-full top-1/2 -translate-y-1/2" 
                          style={{ left: `${left}%`, backgroundColor: color }}
                          title={`${item.desvioPontoMelhoria} - Prazo: ${safeFormatDate(item.prazo)}`}
                        ></div>
                    );
                })}
            </div>
          </div>
        ))}
      </div>
    );
};


// --- MAIN COMPONENT ---
interface ReportViewerProps {
    report: SavedReport;
    onBack: () => void;
    planName: string;
    clientName: string;
    planOwnerName: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onBack, planName, clientName, planOwnerName }) => {
    const { triggerExport, isExporting: isDocExporting } = useExportHandler();
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    
    const isExporting = isDocExporting || isPdfExporting;
    
    const parsedSections = useMemo(() => {
        const sections: { [key: string]: string } = {};
        const parts = report.summaryContent.split(/###\s*(.*?)\s*\n/s).filter(p => p.trim());
        for (let i = 0; i < parts.length; i += 2) {
            const title = parts[i].trim().replace(/[*_]/g, '');
            const content = parts[i + 1]?.trim() || '';
            sections[title] = content;
        }
        return sections;
    }, [report.summaryContent]);
    
    const kpiDataByPillar = useMemo(() => {
        const pillarMap = new Map<string, number>();
        strategicPillars.forEach(p => pillarMap.set(p, 0));
        report.dataUsed.forEach(item => {
            pillarMap.set(item.pilarEstrategico, (pillarMap.get(item.pilarEstrategico) || 0) + 1);
        });
        return strategicPillars.map(p => ({ name: p, value: pillarMap.get(p) || 0 }));
    }, [report.dataUsed]);

    const chartData = useMemo(() => {
        // @fix: The initial value for reduce must be typed to ensure `statuses` is a known object type for spreading.
        // I will fix this by typing the accumulator parameter.
        // FIX: Typed the accumulator for the reduce function to prevent spread operator errors on unknown types.
        // The initial value for reduce was an empty object `{}`, which TypeScript infers as `unknown`. By explicitly typing the accumulator `acc` and casting the initial value, `statuses` in the subsequent `.map` is correctly typed as an object, allowing the spread operator `...statuses` to be used.
        const statusByPillarData = Object.entries(
            report.dataUsed.reduce((acc: Record<string, Record<string, number>>, item) => {
                const pillar = item.pilarEstrategico;
                if (!acc[pillar]) {
                    acc[pillar] = {};
                }
                const statusLabel = getDisplayStatus(item).label;
                acc[pillar][statusLabel] = (acc[pillar][statusLabel] || 0) + 1;
                return acc;
            // FIX: Explicitly typing the initial value of reduce ensures TypeScript correctly infers the return type, fixing the downstream spread operator error.
            }, {} as Record<string, Record<string, number>>)
        ).map(([name, statuses]) => ({ name, ...statuses }));

        const priorityOrder = [ActionPriority.BAIXA, ActionPriority.MEDIA, ActionPriority.ALTA];
        const byPriority = priorityOrder.map(priority => ({
            name: priority,
            Ações: report.dataUsed.filter(item => item.priority === priority).length
        }));

        const statusLabels = Array.from(new Set(report.dataUsed.map(item => getDisplayStatus(item).label)));

        return { statusByPillarData, byPriority, statusLabels };
    }, [report.dataUsed]);
    
    const handleExport = async (format: 'pdf' | 'doc') => {
        if (format === 'doc') {
            const reportContent = (
                 <PrintableExecutiveReport
                    clientName={clientName}
                    reportDate={report.generatedAt}
                    summaryContent={report.summaryContent}
                    actionItems={report.dataUsed}
                    planOwnerName={planOwnerName}
                />
            );
            triggerExport({
                type: 'doc',
                content: reportContent,
                fileName: `${report.reportName.replace(/\s/g, '_')}.doc`
            });
        } else {
            setIsPdfExporting(true);
            try {
                const elementIds = {
                    cover: 'report-cover',
                    kpi: 'report-kpi-section',
                    gantt: 'report-gantt-section',
                    statusByPillar: 'report-status-chart',
                    priority: 'report-priority-chart'
                };
                await generatePdfReport({
                    report,
                    clientName,
                    planOwnerName,
                    parsedSections,
                    elementIds
                });
            } catch (error) {
                console.error("Failed to generate PDF report:", error);
                alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
            } finally {
                setIsPdfExporting(false);
            }
        }
    };

    const exportSections: ExportSection[] = [
        {
            title: "Formatos",
            options: [
                { label: 'PDF (Alta Resolução)', icon: <PdfIcon className="w-5 h-5 mr-3 text-red-600"/>, onClick: () => handleExport('pdf') },
                { label: 'Word (.doc)', icon: <WordIcon className="w-5 h-5 mr-3 text-blue-700"/>, onClick: () => handleExport('doc') }
            ]
        }
    ];

    return (
        <>
            <div className="flex flex-col h-full animate-slide-in-up">
                <div className="flex-shrink-0 bg-white p-4 border-b flex justify-between items-center">
                    <button onClick={onBack} className="text-sm text-primary font-semibold hover:underline">
                        &larr; Voltar para Relatórios
                    </button>
                    <ExportMenu isExporting={isExporting} sections={exportSections} />
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
                     <div id="printable-report-viewer" className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
                        {/* Header */}
                        <header id="report-cover" className="bg-primary text-white rounded-xl p-5 mb-5 text-center">
                            <h1 className="text-3xl font-black">Orbent</h1>
                            <p className="font-satisfy text-lg italic mt-1">Inteligência para Acelerar Seus Planos</p>
                            <div className="mt-4 pt-4 border-t border-white/30 text-left">
                                <h2 className="text-xl font-bold">Relatório: Plano de Ação</h2>
                                <p className="text-sm"><strong>Cliente:</strong> {clientName}</p>
                                <p className="text-sm"><strong>Data de emissão:</strong> {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </header>
                        <div className="space-y-5">
                            {/* Summary */}
                            {parsedSections['Sumário Executivo'] && (
                                <section className="bg-white border border-border-color rounded-xl p-5">
                                    <h2 className="text-xl font-extrabold text-primary mb-2">Sumário Executivo</h2>
                                    <div className="text-justify text-sm text-muted leading-relaxed prose prose-sm max-w-none"><Markdown>{parsedSections['Sumário Executivo']}</Markdown></div>
                                </section>
                            )}
                            
                             {/* Pillar KPIs */}
                            <section id="report-kpi-section" className="bg-white border border-border-color rounded-xl p-5">
                                <h2 className="text-xl font-extrabold text-primary mb-2">Indicadores de Ações por Pilar Estratégico</h2>
                                <p className="text-justify text-sm text-muted leading-relaxed mb-4">
                                    Os indicadores abaixo apresentam a quantidade de ações atualmente vinculadas a cada Pilar Estratégico.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {kpiDataByPillar.map(p => <PillarCard key={p.name} title={p.name} value={p.value} />)}
                                </div>
                            </section>

                            {/* Graphics Section */}
                            <section className="bg-white border border-border-color rounded-xl p-5">
                                <h2 className="text-xl font-extrabold text-primary mb-2">Análise Gráfica</h2>
                                
                                <div id="report-gantt-section" className="mt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Cronograma por Pilar Estratégico</h3>
                                    <MinimalGanttForReport actionItems={report.dataUsed} />
                                </div>

                                <div id="report-status-chart" className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Distribuição de Status por Pilar</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData.statusByPillarData} layout="vertical" stackOffset="expand" margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} interval={0} />
                                                <XAxis type="number" tickFormatter={(tick) => `${Math.round(tick * 100)}%`} />
                                                <Tooltip formatter={(value, name, { payload }) => {
                                                    const rawValue = payload[name as keyof typeof payload] || 0;
                                                    const total = Object.keys(payload).filter(k => k !== 'name').reduce((sum, key) => sum + (payload[key as keyof typeof payload] || 0), 0);
                                                    const percentage = total > 0 ? ((rawValue / total) * 100).toFixed(0) : 0;
                                                    return `${rawValue} Ações (${percentage}%)`;
                                                }} />
                                                <Legend wrapperStyle={{fontSize: '10px'}}/>
                                                {chartData.statusLabels.map(status => (
                                                    <Bar key={status} dataKey={status} stackId="a" fill={STATUS_CHART_COLORS[status]} />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div id="report-priority-chart" className="mt-6 pt-6 border-t border-gray-200">
                                     <h3 className="text-lg font-bold text-gray-800 mb-2">Ações por Prioridade</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.byPriority} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend wrapperStyle={{fontSize: '10px'}}/>
                                                <Line type="monotone" dataKey="Ações" stroke="#004080" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>

                            {/* Final Thoughts */}
                            {parsedSections['Considerações Finais'] && (
                                <section className="bg-white border border-border-color rounded-xl p-5">
                                    <h2 className="text-xl font-extrabold text-primary mb-2">Considerações Finais</h2>
                                    <div className="text-justify text-sm text-muted leading-relaxed prose prose-sm max-w-none"><Markdown>{parsedSections['Considerações Finais']}</Markdown></div>
                                </section>
                            )}
                            
                            {/* Annex Table */}
                            <section className="bg-white border border-border-color rounded-xl p-5">
                               <h2 className="text-xl font-extrabold text-primary mb-2">Anexo – Tabela Detalhada das Ações</h2>
                               <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-primary text-white">
                                            <tr>
                                                <th className="p-2 text-left">ID</th>
                                                <th className="p-2 text-left">Desvio/Ponto de Melhoria</th>
                                                <th className="p-2 text-left">Ação a Mitigar</th>
                                                <th className="p-2 text-left">Departamentos</th>
                                                <th className="p-2 text-left">Responsável</th>
                                                <th className="p-2 text-left">Prazo</th>
                                                <th className="p-2 text-left">Status</th>
                                                <th className="p-2 text-left">Prioridade</th>
                                                <th className="p-2 text-left">Tipo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.dataUsed.map(item => (
                                                <tr key={item.id} className="border-b hover:bg-light-gray/50">
                                                    <td className="p-2 font-bold">{item.id}</td>
                                                    <td className="p-2">{item.desvioPontoMelhoria}</td>
                                                    <td className="p-2">{item.acaoParaMitigacao}</td>
                                                    <td className="p-2">{item.departamentosEnvolvidos.join(', ')}</td>
                                                    <td className="p-2">{item.responsavel}</td>
                                                    <td className="p-2">{safeFormatDate(item.prazo)}</td>
                                                    <td className="p-2">{getDisplayStatus(item).label}</td>
                                                    <td className="p-2">{item.priority}</td>
                                                    <td className="p-2">{item.tipo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                               </div>
                            </section>

                            {/* Signatures */}
                             <section className="bg-white border border-border-color rounded-xl p-5 mt-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 text-center text-xs">
                                    <div>
                                        <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                        <p className="font-bold">Responsável pelo Projeto</p>
                                        <p>{planOwnerName}</p>
                                    </div>
                                    <div>
                                        <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                        <p className="font-bold">Gerência de Operações</p>
                                        <p>Renata Curvello</p>
                                    </div>
                                    <div>
                                        <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                        <p className="font-bold">Diretoria Administrativa</p>
                                        <p>Rosane Souza</p>
                                    </div>
                                     <div>
                                        <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                        <p className="font-bold">GRC</p>
                                        <p>Gisele Almeida</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
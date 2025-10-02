





import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import { ActionItem, ActionPriority, ActionStatus, ActionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { strategicPillars } from '../data/strategicPillars';
import { getDisplayStatus, PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from '../utils/styleUtils';
import { parseAsUTC, safeFormatDate } from '../utils/dateUtils';


// --- HELPER FUNCTIONS ---
const dayDiff = (date1: Date, date2: Date): number => {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};


// --- PROPS INTERFACE ---
interface PrintableExecutiveReportProps {
    clientName: string;
    reportDate: string;
    summaryContent: string;
    actionItems: ActionItem[];
    planOwnerName: string;
}

// --- SUB-COMPONENTS ---
const PillarCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
    <div className="kpi-card">
        <h3>{title}</h3>
        <span className="value">{value}</span>
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
        // FIX: Typed the initial value for the reduce function to ensure type safety.
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
        return <div className="gantt-no-data">Nenhuma ação com data válida para exibir.</div>;
    }

    const { timelineStart, totalDuration, groupedByPillar } = ganttData;

    return (
      <div className="gantt-chart">
        {Object.entries(groupedByPillar).map(([pillar, items]) => (
          <div key={pillar} className="gantt-pillar">
            <h5 className="gantt-pillar-title">{pillar}</h5>
            <div className="gantt-timeline-container">
                {items.map(item => {
                    const offsetDays = dayDiff(timelineStart, parseAsUTC(item.prazo));
                    const left = (offsetDays / totalDuration) * 100;
                    const { color } = getDisplayStatus(item);
                    return (
                        <div 
                          key={item.id} 
                          className="gantt-milestone" 
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
export const PrintableExecutiveReport: React.FC<PrintableExecutiveReportProps> = ({ clientName, reportDate, summaryContent, actionItems, planOwnerName }) => {

    const parsedSections = useMemo(() => {
        const sections: { [key: string]: string } = {};
        const parts = summaryContent.split(/###\s*(.*?)\s*\n/s).filter(p => p.trim());
        for (let i = 0; i < parts.length; i += 2) {
            const title = parts[i].trim().replace(/[*_]/g, '');
            const content = parts[i + 1]?.trim() || '';
            sections[title] = content;
        }
        return sections;
    }, [summaryContent]);
    
    const kpiDataByPillar = useMemo(() => {
        const pillarMap = new Map<string, number>();
        strategicPillars.forEach(p => pillarMap.set(p, 0));
        actionItems.forEach(item => {
            pillarMap.set(item.pilarEstrategico, (pillarMap.get(item.pilarEstrategico) || 0) + 1);
        });
        return strategicPillars.map(p => ({ name: p, value: pillarMap.get(p) || 0 }));
    }, [actionItems]);

    const chartData = useMemo(() => {
        // @fix: The initial value for reduce must be typed to ensure `statuses` is a known object type for spreading.
        // I will fix this by typing the accumulator parameter.
        // FIX: Typed the accumulator for the reduce function to prevent spread operator errors on unknown types.
        // The initial value for reduce was an empty object `{}`, which TypeScript infers as `unknown`. By explicitly typing the accumulator `acc` and casting the initial value, `statuses` in the subsequent `.map` is correctly typed as an object, allowing the spread operator `...statuses` to be used.
        const statusByPillarData = Object.entries(
            actionItems.reduce((acc: Record<string, Record<string, number>>, item) => {
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
            Ações: actionItems.filter(item => item.priority === priority).length
        }));

        const statusLabels = Array.from(new Set(actionItems.map(item => getDisplayStatus(item).label)));
        
        return { statusByPillarData, byPriority, statusLabels };
    }, [actionItems]);

    return (
        <div className="printable-report">
            <header className="report-header">
                <h1>Orbent</h1>
                <p className="subtitle">Inteligência para Acelerar Seus Planos</p>
                <div className="details">
                    <h2>Relatório: Plano de Ação</h2>
                    <p><strong>Cliente:</strong> {clientName}</p>
                    <p><strong>Data de emissão:</strong> {new Date(reportDate).toLocaleDateString('pt-BR')}</p>
                </div>
            </header>

            <div className="space-y-5">
                {parsedSections['Sumário Executivo'] && (
                    <section className="report-section">
                        <h2>Sumário Executivo</h2>
                        <div className="prose"><Markdown>{parsedSections['Sumário Executivo']}</Markdown></div>
                    </section>
                )}

                <section className="report-section">
                    <h2>Indicadores de Ações por Pilar Estratégico</h2>
                    <p className="prose">
                        Os indicadores abaixo apresentam a quantidade de ações atualmente vinculadas a cada Pilar Estratégico.
                    </p>
                    <div className="kpi-grid">
                        {kpiDataByPillar.map(p => <PillarCard key={p.name} title={p.name} value={p.value} />)}
                    </div>
                </section>
                
                <div className="print-page-break">
                    <section className="report-section">
                        <h2>Análise Gráfica</h2>
                        
                        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#333', marginTop: '20px', marginBottom: '10px' }}>Cronograma por Pilar Estratégico</h3>
                        <MinimalGanttForReport actionItems={actionItems} />

                        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#333', marginTop: '20px', marginBottom: '10px' }}>Distribuição de Status por Pilar</h3>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.statusByPillarData} layout="vertical" stackOffset="expand" margin={{ top: 5, right: 30, left: 100, bottom: 20 }}>
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} interval={0}/>
                                    <XAxis type="number" tickFormatter={(tick) => `${Math.round(tick * 100)}%`} />
                                    <Tooltip formatter={(value, name, { payload }) => {
                                        const rawValue = payload[name as keyof typeof payload] || 0;
                                        const total = Object.keys(payload).filter(k => k !== 'name').reduce((sum, key) => sum + (payload[key as keyof typeof payload] || 0), 0);
                                        const percentage = total > 0 ? ((rawValue / total) * 100).toFixed(0) : 0;
                                        return `${rawValue} Ações (${percentage}%)`;
                                    }} />
                                    <Legend wrapperStyle={{fontSize: '10px'}}/>
                                    {chartData.statusLabels.map(status => (
                                        <Bar key={status} dataKey={status} stackId="a" fill={STATUS_CHART_COLORS[status]} isAnimationActive={false} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <h3 style={{ fontSize: '14pt', fontWeight: 700, color: '#333', marginTop: '20px', marginBottom: '10px' }}>Ações por Prioridade</h3>
                        <div className="chart-container" style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.byPriority} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{fontSize: '10px'}}/>
                                    <Line type="monotone" dataKey="Ações" stroke="#004080" strokeWidth={2} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>
                
                {parsedSections['Considerações Finais'] && (
                    <section className="report-section">
                        <h2>Considerações Finais</h2>
                        <div className="prose"><Markdown>{parsedSections['Considerações Finais']}</Markdown></div>
                    </section>
                )}

                <section className="report-section print-page-break">
                   <h2>Anexo – Tabela Detalhada das Ações</h2>
                   <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Desvio/Ponto de Melhoria</th>
                                <th>Responsável</th>
                                <th>Prazo</th>
                                <th>Status</th>
                                <th>Prioridade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {actionItems.map(item => {
                                const { label: statusLabel } = getDisplayStatus(item);
                                return (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.desvioPontoMelhoria}</td>
                                    <td>{item.responsavel}</td>
                                    <td>{safeFormatDate(item.prazo)}</td>
                                    <td>{statusLabel}</td>
                                    <td>{item.priority}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </section>
                
                <section className="report-section">
                    <div className="signatures">
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p className="signature-title">Responsável pelo Projeto</p>
                            <p className="signature-name">{planOwnerName}</p>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p className="signature-title">Gerência de Operações</p>
                            <p className="signature-name">Renata Curvello</p>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p className="signature-title">Diretoria Administrativa</p>
                            <p className="signature-name">Rosane Souza</p>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <p className="signature-title">GRC</p>
                            <p className="signature-name">Gisele Almeida</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
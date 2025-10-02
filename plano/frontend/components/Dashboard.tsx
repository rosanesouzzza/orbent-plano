
import React, { useMemo, useState } from 'react';
import { ActionItem, ActionStatus, ActionType, ActionPriority } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import html2canvas from 'html2canvas';
import { ExportMenu, ExportSection } from './ExportMenu';
import { ExcelIcon } from './icons/ExcelIcon';
import { PdfIcon } from './icons/PdfIcon';
import { ImageIcon } from './icons/ImageIcon';
import { getDisplayStatus, PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from '../utils/styleUtils';
import { useFilters } from '../contexts/FilterContext';
import { useExportHandler } from '../hooks/useExportHandler';
import { parseAsUTC, safeFormatDate } from '../utils/dateUtils';

// Allow XLSX to be recognized from the CDN script
declare const XLSX: any;

interface DashboardProps {
  allActionItems: ActionItem[];
  planName: string;
  clientName: string;
  exportedBy: string;
}

const PILLAR_COLORS = ['#0052cc', '#ffab00', '#00875a', '#de350b', '#5243aa', '#8c564b'];

const Card: React.FC<{ children: React.ReactNode, className?: string, id?: string }> = ({ children, className, id }) => (
  <div id={id} className={`bg-white p-4 sm:p-6 rounded-xl shadow-card border border-border-color flex flex-col ${className}`}>
    {children}
  </div>
);

const ChartTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-lg font-bold text-secondary mb-4 flex-shrink-0">{children}</h3>
);

const KpiSummaryCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-white p-5 rounded-xl shadow-card border border-border-color">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className={`text-4xl font-bold text-secondary mt-1`}>{value}</p>
  </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ 
    allActionItems, 
    planName,
    clientName,
    exportedBy,
}) => {
  const { filters, setFilters, data } = useFilters();
  const { filteredActionItems } = data;
  const { triggerExport, ExportPortal, isExporting: isPdfOrDocExporting } = useExportHandler();
  const [isOtherExporting, setIsOtherExporting] = useState(false);

  const isExporting = isPdfOrDocExporting || isOtherExporting;

  const filterOptions = useMemo(() => {
    const allTags = ['Todos', ...Array.from(new Set(allActionItems.flatMap(item => item.tags || []))).sort()];
    const departamentos = ['Todos', ...Array.from(new Set(allActionItems.flatMap(item => item.departamentosEnvolvidos))).sort()];
    const pilaresEstrategicos = ['Todos', ...Array.from(new Set(allActionItems.map(item => item.pilarEstrategico))).sort()];
    return { allTags, departamentos, pilaresEstrategicos };
  }, [allActionItems]);

  const kpiData = useMemo(() => {
    const total = filteredActionItems.length;
    const concluido = filteredActionItems.filter(item => item.status === ActionStatus.CONCLUIDO).length;
    const emAndamento = total - concluido;
    const percentConcluido = total > 0 ? Math.round((concluido / total) * 100) : 0;
    return { total, emAndamento, concluido, percentConcluido };
  }, [filteredActionItems]);

  const actionsByStatusPieData = useMemo(() => {
    const statusCounts = new Map<string, number>();
    filteredActionItems.forEach(item => {
        const displayStatus = getDisplayStatus(item);
        statusCounts.set(displayStatus.label, (statusCounts.get(displayStatus.label) || 0) + 1);
    });
    return Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [filteredActionItems]);

  const actionsByPillarData = useMemo(() => {
    const pillarCounts = new Map<string, number>();
    filteredActionItems.forEach(item => {
        pillarCounts.set(item.pilarEstrategico, (pillarCounts.get(item.pilarEstrategico) || 0) + 1);
    });
    return Array.from(pillarCounts.entries()).map(([name, value], index) => ({ name, value, fill: PILLAR_COLORS[index % PILLAR_COLORS.length] })).filter(d => d.value > 0);
  }, [filteredActionItems]);

  const actionsByDeptData = useMemo(() => {
    const deptCounts = new Map<string, number>();
    filteredActionItems.forEach(item => {
        item.departamentosEnvolvidos.forEach(dept => {
            deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
        });
    });
    return Array.from(deptCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredActionItems]);

  const cumulativeTrendData = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {}; // Key: YYYY-MM

    const completedItems = filteredActionItems.filter(item => {
        if (item.status !== ActionStatus.CONCLUIDO || !item.prazo) return false;
        const date = parseAsUTC(item.prazo);
        return !isNaN(date.getTime());
    });

    if (completedItems.length === 0) return [];

    completedItems.forEach(item => {
        const date = parseAsUTC(item.prazo);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    });

    const sortedMonthKeys = Object.keys(monthlyCounts).sort();

    let cumulative = 0;
    return sortedMonthKeys.map(key => {
        cumulative += monthlyCounts[key];
        const name = safeFormatDate(`${key}-01`, { month: 'short', year: '2-digit' }).replace(' de ', '/').replace('.', '');
        return { name, 'Acumulado': cumulative };
    });
  }, [filteredActionItems]);

  const exportToXlsx = () => {
    setIsOtherExporting(true);
    const date = new Date().toLocaleString('pt-BR');
    const headers = [
        ["Dashboard Plano de Ação:", planName],
        ["Cliente:", clientName], [],
        ["Exportado por:", exportedBy], ["Data de Exportação:", date], []
    ];
    const data = filteredActionItems.map(item => ({
        'ID': item.id, 'Desvio/Ponto de Melhoria': item.desvioPontoMelhoria, 'Origem': item.origem, 'Ação para mitigação': item.acaoParaMitigacao,
        'Departamentos Envolvidos': item.departamentosEnvolvidos.join(', '), 'Responsável': item.responsavel, 
        'Prazo': safeFormatDate(item.prazo),
        'Status': item.status, 'Prioridade': item.priority, 'Tipo': item.tipo, 'Pilar Estratégico': item.pilarEstrategico, 'Evidência': item.evidencia,
        'Verificação': item.verificacao, 'Tags': (item.tags || []).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, data, { origin: `A${headers.length + 1}` });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");
    XLSX.writeFile(wb, `dashboard_plano_de_acao_${planName.replace(/\s/g, '_')}.xlsx`);
    setIsOtherExporting(false);
  };
  
  const captureAndExportDashboardAsImage = async () => {
    setIsOtherExporting(true);
    try {
        const dashboardElement = document.getElementById('dashboard-main-content');
        if (!dashboardElement) throw new Error("Elemento do dashboard não encontrado.");
        
        const canvas = await html2canvas(dashboardElement, { scale: 2, useCORS: true });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `dashboard_${planName.replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error(`Error exporting dashboard to PNG:`, error);
    } finally {
        setIsOtherExporting(false);
    }
  };

  const exportDashboardAsPdf = () => {
    triggerExport({ type: 'pdf', content: <DashboardContent isPrintMode={true} /> });
  };
  
  const dashboardExportSections: ExportSection[] = [
    {
      title: 'Visualização',
      options: [
        { label: 'PNG', icon: <ImageIcon className="w-5 h-5 mr-3 text-purple-600"/>, onClick: captureAndExportDashboardAsImage },
        { label: 'PDF', icon: <PdfIcon className="w-5 h-5 mr-3 text-red-600"/>, onClick: exportDashboardAsPdf }
      ]
    },
    {
      title: 'Dados',
      options: [
        { label: 'Excel', icon: <ExcelIcon className="w-5 h-5 mr-3 text-green-600"/>, onClick: exportToXlsx }
      ]
    }
  ];

  const NoDataView = () => (
    <div className="text-center py-10 bg-white rounded-lg shadow-card border border-border-color">
        <h2 className="text-xl font-semibold text-secondary">Nenhum dado encontrado.</h2>
        <p className="text-neutral-500 mt-2">Ajuste os filtros para visualizar os dados do plano de ação.</p>
    </div>
  );
  
  const DashboardContent = ({ isPrintMode = false }: { isPrintMode?: boolean }) => (
    <div className="p-4 sm:p-6 space-y-6 flex-grow">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print-avoid-break">
          <KpiSummaryCard title="Total de Ações" value={kpiData.total} />
          <KpiSummaryCard title="Concluídas" value={kpiData.concluido} />
          <KpiSummaryCard title="Em Andamento" value={kpiData.emAndamento} />
          <KpiSummaryCard title="% Conclusão" value={`${kpiData.percentConcluido}%`} />
      </div>
      
      {filteredActionItems.length === 0 ? (
          <NoDataView />
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-1 print-avoid-break">
                  <ChartTitle>Distribuição por Status</ChartTitle>
                  <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                          <Pie data={actionsByStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5} labelLine={false} isAnimationActive={!isPrintMode}>
                              {actionsByStatusPieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={STATUS_CHART_COLORS[entry.name]} stroke={STATUS_CHART_COLORS[entry.name]} />)}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} Ações`, name]} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                      </PieChart>
                  </ResponsiveContainer>
              </Card>
               <Card className="lg:col-span-1 print-avoid-break">
                  <ChartTitle>Ações por Pilar Estratégico</ChartTitle>
                   <ResponsiveContainer width="100%" height={250}>
                      {/* FIX: Removed isAnimationActive from BarChart container. */}
                      <BarChart data={actionsByPillarData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                          <Tooltip formatter={(value) => [`${value} Ações`, 'Total']} />
                          <Bar dataKey="value" name="Ações" isAnimationActive={!isPrintMode}>
                            {actionsByPillarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </Card>
              <Card className="lg:col-span-2 print-avoid-break">
                  <ChartTitle>Ações por Departamento</ChartTitle>
                  <ResponsiveContainer width="100%" height={280}>
                      {/* FIX: Removed isAnimationActive from BarChart container. */}
                      <BarChart data={actionsByDeptData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip formatter={(value) => [`${value} Ações`, 'Total']} />
                          <Bar dataKey="value" name="Ações" fill="#0052cc" barSize={30} isAnimationActive={!isPrintMode}/>
                      </BarChart>
                  </ResponsiveContainer>
              </Card>
              <Card className="lg:col-span-2 print-avoid-break">
                  <ChartTitle>Evolução ao Longo do Tempo</ChartTitle>
                  <ResponsiveContainer width="100%" height={280}>
                      {/* FIX: Removed isAnimationActive from LineChart container. */}
                      <LineChart data={cumulativeTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line type="monotone" dataKey="Acumulado" stroke="#00875a" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} isAnimationActive={!isPrintMode}/>
                      </LineChart>
                  </ResponsiveContainer>
              </Card>
          </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Filter and Export Bar */}
        <div className="bg-white p-4 rounded-xl border border-border-color m-4 sm:m-6 print:hidden shadow-card">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-grow">
                    <div>
                      <label htmlFor="depFilter" className="sr-only">Departamento</label>
                      <select id="depFilter" value={filters.departamentoFiltro} onChange={e => setFilters.setDepartamentoFiltro(e.target.value)} className="w-full pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                        {filterOptions.departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pilarFilter" className="sr-only">Pilar Estratégico</label>
                      <select id="pilarFilter" value={filters.pilarEstrategicoFiltro} onChange={e => setFilters.setPilarEstrategicoFiltro(e.target.value)} className="w-full pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                        {filterOptions.pilaresEstrategicos.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="statusFilter" className="sr-only">Status</label>
                      <select id="statusFilter" value={filters.statusFiltro} onChange={e => setFilters.setStatusFiltro(e.target.value)} className="w-full pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                        <option value="Todos">Todos os Status</option>
                        {Object.values(ActionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tipoFilter" className="sr-only">Tipo</label>
                      <select id="tipoFilter" value={filters.tipoFiltro} onChange={e => setFilters.setTipoFiltro(e.target.value)} className="w-full pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                        <option value="Todos">Todos os Tipos</option>
                        {Object.values(ActionType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                        <label htmlFor="priorityFilter" className="sr-only">Prioridade</label>
                        <select id="priorityFilter" value={filters.priorityFiltro} onChange={e => setFilters.setPriorityFiltro(e.target.value)} className="w-full pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                            <option value="Todos">Todas as Prioridades</option>
                            {Object.values(ActionPriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <ExportMenu isExporting={isExporting} sections={dashboardExportSections} />
                </div>
            </div>
        </div>
        <div id="dashboard-main-content" className="flex-grow">
          <DashboardContent />
        </div>
      </div>
      {ExportPortal}
    </>
  );
};

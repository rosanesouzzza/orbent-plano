
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActionItem, ActionStatus, ActionPriority, ActionType, PlanReason } from '../types';
import { Modal } from './Modal';
import { ActionForm } from './ActionForm';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { ListIcon } from './icons/ListIcon';
import { CardIcon } from './icons/CardIcon';
import { ActionItemCard } from './ActionItemCard';
import { ExportMenu, ExportSection } from './ExportMenu';
import { PdfIcon } from './icons/PdfIcon';
import { CsvIcon } from './icons/CsvIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { AddIcon } from './icons/AddIcon';
import { PlannerIcon } from './icons/PlannerIcon';
import { GanttChart } from './GanttChart';
import { generateExecutiveSummary } from '../services/geminiService';
import { PrintableExecutiveReport } from './PrintableExecutiveReport';
import { getDisplayStatus, getPriorityStyles } from '../utils/styleUtils';
import { WordIcon } from './icons/WordIcon';
import { useExportHandler } from '../hooks/useExportHandler';
import { useFilters } from '../contexts/FilterContext';
import { safeFormatDate } from '../utils/dateUtils';

// Allow TypeScript to recognize the global variables from the CDN scripts
declare const XLSX: any;

const ORBENT_FOOTER = `© 2025 Orbent. Todos os direitos reservados.`;

interface ActionPlanTableProps {
  isOperating: boolean;
  updateActionItem: (item: ActionItem) => void;
  deleteActionItem: (id: number) => void;
  onAddAction: () => void;
  exportedBy: string;
  planName: string;
  planOwnerName: string;
  clientName: string;
  planEmissionDate: string;
  onGenerateSubTasks: (item: ActionItem) => Promise<void>;
}

export const ActionPlanTable: React.FC<ActionPlanTableProps> = ({ 
  isOperating,
  updateActionItem, 
  deleteActionItem,
  onAddAction,
  exportedBy,
  planName,
  planOwnerName,
  clientName,
  planEmissionDate,
  onGenerateSubTasks,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'gantt'>('card');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDataExporting, setIsDataExporting] = useState(false);

  const { filters, setFilters, data } = useFilters();
  const { filteredActionItems: actionItems, filterOptions } = data;
  const { triggerExport, ExportPortal, isExporting: isReportExporting } = useExportHandler();

  const isExporting = isGeneratingSummary || isDataExporting || isReportExporting;

  const handleOpenModal = (item: ActionItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };
  
  const handleSave = (itemData: ActionItem) => {
    updateActionItem(itemData);
    handleCloseModal();
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação?')) {
        deleteActionItem(id);
    }
  };

  const generateReportHeaderText = (isMultiLine = false): string | string[] => {
    const date = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const lines = [
        `Plano de Ação: ${planName}`,
        `Cliente: ${clientName}`,
        `Responsável pelo Plano: ${planOwnerName}`,
        `Relatório Emitido por: ${exportedBy} em ${date}`,
    ];
    return isMultiLine ? lines : lines.join('\n');
  };

  const exportToCsv = () => {
    setIsDataExporting(true);
    let csvContent = (generateReportHeaderText(true) as string[]).map(line => `"${line}"`).join('\n') + '\n\n';

    const headers = ["ID", "Desvio/Ponto de Melhoria", "Origem", "Ação para mitigação", "Departamentos Envolvidos", "Responsável", "Pilar Estratégico", "Prazo", "Status", "Prioridade", "Tipo", "Evidência", "Verificação", "Tags"];
    const rows = actionItems.map(item => 
        [
            item.id,
            `"${item.desvioPontoMelhoria.replace(/"/g, '""')}"`,
            item.origem,
            `"${item.acaoParaMitigacao.replace(/"/g, '""')}"`,
            `"${item.departamentosEnvolvidos.join(', ')}"`,
            item.responsavel,
            item.pilarEstrategico,
            safeFormatDate(item.prazo),
            item.status,
            item.priority,
            item.tipo,
            `"${item.evidencia.replace(/"/g, '""')}"`,
            `"${item.verificacao.replace(/"/g, '""')}"`,
            `"${(item.tags || []).join(', ')}"`
        ].join(',')
    ).join('\n');
    
    csvContent += headers.join(',') + '\n' + rows;

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plano_de_acao_${planName.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDataExporting(false);
  };
  
  const exportToXlsx = () => {
    setIsDataExporting(true);
    const headerText = generateReportHeaderText(true) as string[];
    const headers = headerText.map(line => [line]);
    headers.push([]);

    const data = actionItems.map(item => ({
        'ID': item.id, 
        'Desvio/Ponto de Melhoria': item.desvioPontoMelhoria, 
        'Origem': item.origem, 
        'Ação para mitigação': item.acaoParaMitigacao,
        'Departamentos Envolvidos': item.departamentosEnvolvidos.join(', '), 
        'Responsável': item.responsavel, 
        'Pilar Estratégico': item.pilarEstrategico, 
        'Prazo': safeFormatDate(item.prazo),
        'Status': item.status, 
        'Prioridade': item.priority, 
        'Tipo': item.tipo, 
        'Evidência': item.evidencia,
        'Verificação': item.verificacao, 
        'Tags': (item.tags || []).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: "A1" });
    XLSX.utils.sheet_add_json(ws, data, { origin: `A${headers.length + 1}` });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");
    XLSX.writeFile(wb, `plano_de_acao_${planName.replace(/\s/g, '_')}.xlsx`);
    setIsDataExporting(false);
  };

  const exportToPdf = () => {
    setIsDataExporting(true);
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [[
        "ID", "Desvio/Ponto de Melhoria", "Origem", "Ação para mitigação", 
        "Departamentos Envolvidos", "Responsável", "Pilar Estratégico", "Prazo", 
        "Status", "Prioridade", "Tipo", "Evidência", "Verificação", "Tags"
    ]];
    const body = actionItems.map(item => [
      item.id,
      item.desvioPontoMelhoria,
      item.origem,
      item.acaoParaMitigacao,
      item.departamentosEnvolvidos.join(', '),
      item.responsavel,
      item.pilarEstrategico,
      safeFormatDate(item.prazo),
      item.status,
      item.priority,
      item.tipo,
      item.evidencia,
      item.verificacao,
      (item.tags || []).join(', ')
    ]);
  
    const headerLines = generateReportHeaderText(true) as string[];
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(headerLines[0], 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(headerLines.slice(1), 14, 22);
  
    autoTable(doc, {
      startY: 32,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 82, 204] }, // New primary color
      styles: { fontSize: 6, cellPadding: 1.5 },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as any).getNumberOfPages();
        const footerText = `${ORBENT_FOOTER} | Página ${data.pageNumber} de ${pageCount}`;
        doc.setFontSize(8);
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });
  
    doc.save(`dados_plano_de_acao_${planName.replace(/\s/g, '_')}.pdf`);
    setIsDataExporting(false);
  };

  const handleGenerateExecutiveReport = async (format: 'pdf' | 'doc') => {
    setIsGeneratingSummary(true);
    try {
        const summary = await generateExecutiveSummary(actionItems, planName, clientName, actionItems.length > 0 ? actionItems[0].origem : PlanReason.OUTROS, exportedBy);
        const reportContent = (
            <PrintableExecutiveReport
                clientName={clientName}
                reportDate={new Date().toISOString()}
                summaryContent={summary}
                actionItems={actionItems}
                planOwnerName={planOwnerName}
            />
        );
        triggerExport({
            type: format,
            content: reportContent,
            fileName: `Relatorio_Executivo_${planName.replace(/\s/g, '_')}.doc`
        });
    } catch (error) {
        console.error("Failed to generate report summary:", error);
    } finally {
        setIsGeneratingSummary(false);
    }
  };

  const tableExportSections: ExportSection[] = [
    {
      title: 'Exportar Relatório',
      options: [
        { label: 'Executivo (PDF)', icon: <PdfIcon className="w-5 h-5 mr-3 text-red-600"/>, onClick: () => handleGenerateExecutiveReport('pdf') },
        { label: 'Executivo (Word)', icon: <WordIcon className="w-5 h-5 mr-3 text-blue-700"/>, onClick: () => handleGenerateExecutiveReport('doc') },
      ]
    },
    {
      title: 'Exportar Dados',
      options: [
        { label: 'Excel', icon: <ExcelIcon className="w-5 h-5 mr-3 text-green-600"/>, onClick: exportToXlsx },
        { label: 'CSV', icon: <CsvIcon className="w-5 h-5 mr-3 text-blue-600"/>, onClick: exportToCsv },
        { label: 'PDF (Tabela)', icon: <PdfIcon className="w-5 h-5 mr-3 text-red-600"/>, onClick: exportToPdf }
      ]
    }
  ];

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full animate-fade-in">
          <div className="bg-white p-4 rounded-xl shadow-card border border-border-color mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div>
                      <label htmlFor="depFilter" className="block text-xs font-medium text-neutral-500">Departamentos</label>
                      <select id="depFilter" value={filters.departamentoFiltro} onChange={e => setFilters.setDepartamentoFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          {filterOptions.departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="pilarFilter" className="block text-xs font-medium text-neutral-500">Pilar Estratégico</label>
                      <select id="pilarFilter" value={filters.pilarEstrategicoFiltro} onChange={e => setFilters.setPilarEstrategicoFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          {filterOptions.pilaresEstrategicos.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="statusFilter" className="block text-xs font-medium text-neutral-500">Status</label>
                      <select id="statusFilter" value={filters.statusFiltro} onChange={e => setFilters.setStatusFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          <option value="Todos">Todos</option>
                          {Object.values(ActionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="tipoFilter" className="block text-xs font-medium text-neutral-500">Tipo</label>
                      <select id="tipoFilter" value={filters.tipoFiltro} onChange={e => setFilters.setTipoFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          <option value="Todos">Todos</option>
                          {Object.values(ActionType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="priorityFilter" className="block text-xs font-medium text-neutral-500">Prioridade</label>
                      <select id="priorityFilter" value={filters.priorityFiltro} onChange={e => setFilters.setPriorityFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          <option value="Todos">Todos</option>
                          {Object.values(ActionPriority).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="tagFilter" className="block text-xs font-medium text-neutral-500">Tag</label>
                      <select id="tagFilter" value={filters.tagFiltro} onChange={e => setFilters.setTagFiltro(e.target.value)} className="w-full mt-1 pl-2 pr-8 py-1.5 text-sm border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary rounded-lg bg-white">
                          {filterOptions.allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                      </select>
                  </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-color">
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                      <button onClick={() => setViewMode('card')} title="Visualização em Cartões" className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-neutral-500 hover:bg-neutral-200'}`}><CardIcon className="w-5 h-5"/></button>
                      <button onClick={() => setViewMode('table')} title="Visualização em Tabela" className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-neutral-500 hover:bg-neutral-200'}`}><ListIcon className="w-5 h-5"/></button>
                      <button onClick={() => setViewMode('gantt')} title="Visualização em Gráfico de Gantt" className={`p-2 rounded-md transition-colors ${viewMode === 'gantt' ? 'bg-white shadow-sm text-primary' : 'text-neutral-500 hover:bg-neutral-200'}`}><PlannerIcon className="w-5 h-5"/></button>
                  </div>
                  <div className="flex items-center gap-2">
                      <ExportMenu isExporting={isExporting} sections={tableExportSections} />
                      <button onClick={onAddAction} disabled={isOperating} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors flex items-center shadow-sm disabled:bg-neutral-400 disabled:cursor-not-allowed">
                          <AddIcon className="h-5 w-5 mr-2" /> Adicionar Ação
                      </button>
                  </div>
              </div>
          </div>

          <div className="flex-grow overflow-auto relative">
              {actionItems.length === 0 ? (
                  <div className="text-center py-10">
                      <h2 className="text-xl font-semibold text-secondary">Nenhuma ação encontrada.</h2>
                      <p className="text-neutral-500 mt-2">Adicione uma nova ação ou ajuste os filtros.</p>
                  </div>
              ) : viewMode === 'card' ? (
                  <div id="card-view-container" className="grid gap-6 items-start [grid-template-columns:repeat(auto-fill,minmax(420px,1fr))]">
                      {actionItems.map(item => <ActionItemCard key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleDelete} onGenerateSubTasks={onGenerateSubTasks} />)}
                  </div>
              ) : viewMode === 'table' ? (
                  <div id="table-view-container" className="bg-white rounded-xl shadow-card border border-border-color overflow-x-auto">
                     <table className="w-full text-sm text-left text-neutral-500">
                          <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                              <tr>
                                  <th scope="col" className="px-4 py-3">ID</th>
                                  <th scope="col" className="px-4 py-3">Desvio/Ponto de Melhoria</th>
                                  <th scope="col" className="px-4 py-3">Pilar Estratégico</th>
                                  <th scope="col" className="px-4 py-3">Responsável</th>
                                  <th scope="col" className="px-4 py-3">Departamentos</th>
                                  <th scope="col" className="px-4 py-3">Prazo</th>
                                  <th scope="col" className="px-4 py-3">Status</th>
                                  <th scope="col" className="px-4 py-3">Prioridade</th>
                                  <th scope="col" className="px-4 py-3 text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody>
                              {actionItems.map(item => {
                                  const { label: statusLabel, bgClass: statusBg, textClass: statusText } = getDisplayStatus(item);
                                  const { bgClass: priorityBg, textClass: priorityText } = getPriorityStyles(item.priority);
                                  return (
                                  <tr key={item.id} onClick={() => handleOpenModal(item)} className="bg-white border-b border-border-color hover:bg-neutral-50 cursor-pointer">
                                      <td className="px-4 py-4 font-medium text-neutral-900">{item.id}</td>
                                      <td className="px-4 py-4 font-semibold text-secondary whitespace-nowrap" title={item.desvioPontoMelhoria}>{item.desvioPontoMelhoria}</td>
                                      <td className="px-4 py-4" title={item.pilarEstrategico}>{item.pilarEstrategico}</td>
                                      <td className="px-4 py-4 whitespace-nowrap">{item.responsavel}</td>
                                      <td className="px-4 py-4">{item.departamentosEnvolvidos.join(', ')}</td>
                                      <td className={`px-4 py-4 whitespace-nowrap`}>{safeFormatDate(item.prazo)}</td>
                                      <td className="px-4 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${statusBg} ${statusText}`}>{statusLabel}</span></td>
                                      <td className="px-4 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${priorityBg} ${priorityText}`}>{item.priority}</span></td>
                                      <td className="px-4 py-4 flex items-center justify-center gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} disabled={isOperating} className="text-neutral-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} disabled={isOperating} className="text-neutral-500 hover:text-error disabled:opacity-50 disabled:cursor-not-allowed" title="Excluir"><DeleteIcon className="w-5 h-5"/></button>
                                      </td>
                                  </tr>
                              )})}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div id="gantt-view-container" className="bg-white rounded-xl shadow-card border border-border-color h-full">
                      <GanttChart actionItems={actionItems} />
                  </div>
              )}
          </div>
          
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Editar Ação">
              {editingItem && (
                  <ActionForm 
                      item={editingItem} 
                      onSave={handleSave} 
                      onCancel={handleCloseModal}
                      planEmissionDate={planEmissionDate}
                      isSaving={isOperating}
                  />
              )}
          </Modal>
      </div>
      {ExportPortal}
    </>
  );
};

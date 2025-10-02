
import React, { useState } from 'react';
import { ActionItem } from '../types';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { AttachmentIcon } from './icons/AttachmentIcon';
import { getDisplayStatus, getPriorityStyles } from '../utils/styleUtils';
import { safeFormatDate } from '../utils/dateUtils';
import { AIPlannerIcon } from './icons/AIPlannerIcon';

// A single metadata item component for cleaner code
const MetaDataItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={className}>
        <strong className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</strong>
        <span className="text-sm text-secondary break-words">{value}</span>
    </div>
);

interface ActionItemCardProps {
    item: ActionItem;
    onEdit: (item: ActionItem) => void;
    onDelete: (id: number) => void;
    onGenerateSubTasks: (item: ActionItem) => Promise<void>;
    isPrintMode?: boolean;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ item, onEdit, onDelete, onGenerateSubTasks, isPrintMode = false }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    const { label: displayStatusName, bgClass: statusBg, textClass: statusText, borderClass: statusBorder } = getDisplayStatus(item);
    const { bgClass: priorityBg, textClass: priorityText, borderClass: priorityBorder } = getPriorityStyles(item.priority);

    const handleGenerateClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGenerating(true);
        try {
            await onGenerateSubTasks(item);
        } finally {
            setIsGenerating(false);
        }
    };

    const Spinner = () => <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>;


    return (
        <div className="bg-white rounded-xl shadow-card border border-border-color flex flex-col h-full animate-fade-in transition-shadow duration-300 hover:shadow-card-hover relative">
             {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
                    <Spinner />
                    <span className="mt-2 text-sm font-semibold text-primary-text">Gerando sub-tarefas...</span>
                </div>
            )}
            {/* --- Card Header --- */}
            <div className="p-4 border-b border-border-color flex justify-between items-start gap-3">
                <div className="flex-grow">
                    <span className="font-mono text-xs text-neutral-500 font-semibold block">AÇÃO #{String(item.id).padStart(3, '0')}</span>
                    <h3 className="font-bold text-secondary text-base leading-tight mt-1">{item.desvioPontoMelhoria}</h3>
                </div>
                {!isPrintMode && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                        <button onClick={handleGenerateClick} disabled={isGenerating} className="p-1.5 text-neutral-500 hover:text-primary rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-wait" title="Gerar sub-tarefas com IA">
                            <AIPlannerIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => onEdit(item)} disabled={isGenerating} className="p-1.5 text-neutral-500 hover:text-primary rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50" title="Editar Ação">
                            <EditIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => onDelete(item.id)} disabled={isGenerating} className="p-1.5 text-neutral-500 hover:text-error rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50" title="Excluir Ação">
                            <DeleteIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>

            {/* --- Card Body --- */}
            <div className="p-4 flex-grow space-y-4">
                {/* Action Description */}
                <div>
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Ação para Mitigação</h4>
                    <p className="text-sm text-secondary">{item.acaoParaMitigacao}</p>
                </div>
                
                <div className="border-t border-border-color"></div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                    <MetaDataItem label="Pilar Estratégico" value={item.pilarEstrategico} className="lg:col-span-3" />
                    <MetaDataItem label="Departamentos" value={item.departamentosEnvolvidos.join(', ')} className="lg:col-span-3" />
                    <MetaDataItem label="Responsável" value={item.responsavel} />
                    <MetaDataItem label="Prazo" value={safeFormatDate(item.prazo)} />
                    <MetaDataItem label="Prioridade" value={<span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${priorityBg} ${priorityText} ${priorityBorder}`}>{item.priority}</span>} />
                    <MetaDataItem label="Tipo" value={item.tipo} />
                    <MetaDataItem label="Origem" value={item.origem} />
                    <MetaDataItem label="Anexos" value={<span className="flex items-center"><AttachmentIcon className="w-4 h-4 mr-1 text-neutral-500"/> {(item.anexos || []).length}</span>} />
                </div>
                
                <div className="border-t border-border-color"></div>

                {/* Evidence & Verification */}
                <div className="space-y-3">
                    <MetaDataItem label="Evidência de Conclusão" value={item.evidencia || <span className="text-neutral-500">N/A</span>} />
                    <MetaDataItem label="Verificação de Eficácia" value={item.verificacao || <span className="text-neutral-500">N/A</span>} />
                </div>
            </div>

            {/* --- Card Footer --- */}
            <div className="p-4 mt-auto bg-neutral-50/40 border-t border-border-color rounded-b-xl flex justify-between items-center gap-4">
                <div>
                    <strong className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</strong>
                    <span className={`mt-1 px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${statusBg} ${statusText} ${statusBorder}`}>{displayStatusName}</span>
                </div>
                {(item.tags && item.tags.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 justify-end flex-shrink max-w-[50%]">
                        {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-primary/10 text-primary-text text-xs font-semibold rounded-full whitespace-nowrap">{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

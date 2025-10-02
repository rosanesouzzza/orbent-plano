


import React, { useState, useEffect } from 'react';
// FIX: Added ActionStatus to the import to resolve type errors.
import { Plan, SuggestedActionItem, ActionItem, NewPlanData, ActionStatus } from '../types';
import { generateSubTasks, generateSubTasksForAction } from '../services/geminiService';
import { Modal } from './Modal';
import { EditIcon } from './icons/EditIcon';
import { ActionForm } from './ActionForm';
import { CreatePlanForm } from './CreatePlanForm';
import { AIPlannerIcon } from './icons/AIPlannerIcon';
import { safeFormatDate } from '../utils/dateUtils';

// Allow pdf.js to be recognized from the CDN script
declare const pdfjsLib: any;

interface AIPlannerProps {
    plans: Plan[];
    isOperating: boolean;
    createPlan: (planData: NewPlanData, items: Omit<ActionItem, 'id'>[]) => Promise<void>;
    addActionItemsBatch: (planId: number, items: Omit<ActionItem, 'id'>[]) => Promise<void>;
}

// Suggestion type with subtasks for state management
type SuggestionWithSubTasks = SuggestedActionItem & { 
    subTasks: SuggestedActionItem[];
    isGeneratingSubTasks?: boolean;
};


const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "A IA está planejando..." }) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2 text-gray-600">{text}</span>
    </div>
);

export const AIPlanner: React.FC<AIPlannerProps> = ({ plans, isOperating, createPlan, addActionItemsBatch }) => {
    const [goal, setGoal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("A IA está planejando...");
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<SuggestionWithSubTasks[]>([]);
    const [approvedItems, setApprovedItems] = useState<SuggestedActionItem[]>([]);
    const [newlyApprovedIndices, setNewlyApprovedIndices] = useState<number[]>([]);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ parentIndex: number; subIndex?: number; data: SuggestedActionItem } | null>(null);

    const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');

    useEffect(() => {
        if (newlyApprovedIndices.length > 0) {
            const timer = setTimeout(() => {
                setNewlyApprovedIndices([]);
            }, 1500); // Must match animation duration
            return () => clearTimeout(timer);
        }
    }, [newlyApprovedIndices]);

    const extractTextFromPdf = async (fileToExtract: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) {
                    return reject('Falha ao ler o arquivo.');
                }
                try {
                    const pdf = await pdfjsLib.getDocument(event.target.result).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ');
                    }
                    resolve(text);
                } catch (error) {
                    reject('Erro ao extrair texto do PDF.');
                }
            };
            reader.onerror = () => reject('Erro ao ler o arquivo.');
            reader.readAsArrayBuffer(fileToExtract);
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type === 'application/pdf') {
                setIsLoading(true);
                setLoadingText("Processando PDF...");
                setError('');
                try {
                    const text = await extractTextFromPdf(selectedFile);
                    setFileContent(text);
                } catch (err: any) {
                    setError(err.message || 'Falha ao processar o PDF.');
                    setFileContent('');
                    setFile(null);
                } finally {
                    setIsLoading(false);
                    setLoadingText("A IA está planejando...");
                }
            } else {
                setError('Formato de arquivo não suportado. Por favor, envie um PDF.');
                setFile(null);
                setFileContent('');
            }
        } else {
            setFile(null);
            setFileContent('');
        }
    };
    
    const handleGeneratePlan = async () => {
        if (!goal.trim() && !fileContent) {
            setError('Por favor, descreva o objetivo ou anexe um arquivo.');
            return;
        }
        setIsLoading(true);
        setLoadingText("A IA está planejando...");
        setError('');
        setSuggestions([]);
        setApprovedItems([]);

        const goalToSend = goal.trim() || "Avalie o anexo e fragmente as ações.";

        try {
            const result = await generateSubTasks(goalToSend, fileContent);
            setSuggestions(result.map(item => ({ ...item, subTasks: [] })));
        } catch (err: any) {
            setError(err.message || 'Falha ao gerar o plano.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSubTasks = async (parentIndex: number) => {
        setSuggestions(prev => prev.map((item, index) => 
            index === parentIndex ? { ...item, isGeneratingSubTasks: true } : item
        ));
        setError('');
    
        const parentAction = suggestions[parentIndex];
        try {
            const subTasks = await generateSubTasksForAction(parentAction);
            setSuggestions(prev => prev.map((item, index) => {
                if (index === parentIndex) {
                    return { ...item, subTasks: [...item.subTasks, ...subTasks], isGeneratingSubTasks: false };
                }
                return item;
            }));
        } catch (err: any) {
            setError(err.message || 'Falha ao gerar sub-tarefas.');
            setSuggestions(prev => prev.map((item, index) => 
                index === parentIndex ? { ...item, isGeneratingSubTasks: false } : item
            ));
        }
    };

    const handleApprove = (parentIndex: number, subIndex?: number) => {
        let itemToApprove: SuggestedActionItem;

        if (typeof subIndex === 'number') {
            itemToApprove = suggestions[parentIndex].subTasks[subIndex];
            setSuggestions(prev => prev.map((item, index) => {
                if (index === parentIndex) {
                    return { ...item, subTasks: item.subTasks.filter((_, i) => i !== subIndex) };
                }
                return item;
            }));
        } else {
            const { subTasks, ...parentItem } = suggestions[parentIndex];
            itemToApprove = parentItem;
            setSuggestions(prev => prev.filter((_, i) => i !== parentIndex));
        }
        
        setApprovedItems(prev => {
            const newItems = [...prev, itemToApprove];
            setNewlyApprovedIndices([newItems.length - 1]);
            return newItems;
        });
    };
    
    const handleReject = (parentIndex: number, subIndex?: number) => {
        if (typeof subIndex === 'number') {
            setSuggestions(prev => prev.map((item, index) => {
                if (index === parentIndex) {
                    return { ...item, subTasks: item.subTasks.filter((_, i) => i !== subIndex) };
                }
                return item;
            }));
        } else {
            setSuggestions(prev => prev.filter((_, i) => i !== parentIndex));
        }
    };

    const handleRemoveApprovedItem = (indexToRemove: number) => {
        setApprovedItems(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const handleOpenEditModal = (item: SuggestedActionItem, parentIndex: number, subIndex?: number) => {
        setEditingItem({ parentIndex, subIndex, data: { ...item } });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (updatedItem: SuggestedActionItem) => {
        if (!editingItem) return;
        
        if (typeof editingItem.subIndex === 'number') {
            setSuggestions(prev => prev.map((item, index) => {
                if (index === editingItem.parentIndex) {
                    const newSubTasks = [...item.subTasks];
                    newSubTasks[editingItem.subIndex!] = updatedItem;
                    return { ...item, subTasks: newSubTasks };
                }
                return item;
            }));
        } else {
            setSuggestions(prev => prev.map((item, i) => {
                if (i === editingItem.parentIndex) {
                    const { subTasks } = item;
                    return { ...(updatedItem as SuggestionWithSubTasks), subTasks };
                }
                return item;
            }));
        }
        
        setIsEditModalOpen(false);
        setEditingItem(null);
    };


    const handleAddToExistingPlan = () => {
        if (!selectedPlanId || approvedItems.length === 0) return;
        // FIX: Add the missing 'status' property, as SuggestedActionItem lacks it but the API requires it.
        const itemsToSave = approvedItems.map(item => ({
            ...item,
            status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
        }));
        addActionItemsBatch(parseInt(selectedPlanId, 10), itemsToSave);
    };

    const handleCreateNewPlan = (planData: NewPlanData) => {
        // FIX: Add the missing 'status' property, as SuggestedActionItem lacks it but the API requires it.
        const itemsToSave = approvedItems.map(item => ({
            ...item,
            status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
        }));
        createPlan(planData, itemsToSave);
        setIsCreatePlanModalOpen(false);
    };

    const ongoingPlans = plans.filter(p => p.status === 'Em Andamento');

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-slide-in-up space-y-6">
            {/* --- Goal Input --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                <div className="flex items-start gap-4">
                    <AIPlannerIcon className="w-10 h-10 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Planejador Inteligente</h1>
                        <p className="text-muted mt-1">Descreva um objetivo de alto nível e a IA irá decompô-lo em um plano de ação detalhado para você.</p>
                    </div>
                </div>
                <div className="mt-4">
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={
                            fileContent
                            ? "Avalie o anexo e fragmente as ações."
                            : "Ex: Lançar uma nova campanha de marketing digital no Q4 para aumentar os leads em 20%."
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary h-28"
                        rows={4}
                        disabled={isLoading}
                    />
                </div>
                <div className="mt-4">
                    <label htmlFor="file-upload-ai-planner" className="block text-sm font-medium text-gray-700 mb-1">Anexar Contexto (Opcional - PDF)</label>
                    <input id="file-upload-ai-planner" type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                    {file && <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: {file.name}</p>}
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleGeneratePlan} disabled={isLoading || isOperating} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto">
                        {isLoading ? <LoadingSpinner text={loadingText} /> : 'Gerar Plano de Ação'}
                    </button>
                </div>
                {error && <p className="text-error text-sm mt-2">{error}</p>}
            </div>

            {/* --- Suggestions & Approved Lists --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Suggestions */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    <h2 className="font-bold text-lg text-secondary">Sugestões da IA ({suggestions.length})</h2>
                    <p className="text-sm text-muted mb-4">Revise as tarefas geradas. Aprove ou rejeite cada uma.</p>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {suggestions.length > 0 ? suggestions.map((item, index) => (
                             <div key={`sugg-${index}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 animate-fade-in space-y-3">
                                <div>
                                     <h4 className="font-bold text-primary-text text-sm">{item.desvioPontoMelhoria}</h4>
                                     <p className="text-xs text-muted mt-1">{item.acaoParaMitigacao}</p>
                                     <div className="flex justify-end items-center space-x-2 mt-2">
                                         <button onClick={() => handleGenerateSubTasks(index)} disabled={item.isGeneratingSubTasks} className="text-xs font-semibold text-primary/80 hover:text-primary disabled:opacity-50 disabled:cursor-wait">
                                             {item.isGeneratingSubTasks ? 'Gerando...' : 'Gerar Sub-tarefas'}
                                         </button>
                                         <button onClick={() => handleOpenEditModal(item, index)} className="text-xs font-semibold text-muted hover:text-primary">Editar</button>
                                         <button onClick={() => handleReject(index)} className="text-xs font-semibold text-error/80 hover:text-error">Rejeitar</button>
                                         <button onClick={() => handleApprove(index)} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary/20">Aprovar</button>
                                     </div>
                                </div>
                        
                                {item.subTasks && item.subTasks.length > 0 && (
                                    <div className="pl-4 pt-3 border-l-2 border-primary/20 space-y-3">
                                        <h5 className="text-xs font-bold text-muted uppercase">Sub-tarefas</h5>
                                        {item.subTasks.map((subTask, subIndex) => (
                                            <div key={`sub-${index}-${subIndex}`}>
                                                <h4 className="font-bold text-primary-text text-sm">{subTask.desvioPontoMelhoria}</h4>
                                                <p className="text-xs text-muted mt-1">{subTask.acaoParaMitigacao}</p>
                                                <div className="flex justify-end items-center space-x-2 mt-2">
                                                    <button onClick={() => handleOpenEditModal(subTask, index, subIndex)} className="text-xs font-semibold text-muted hover:text-primary">Editar</button>
                                                    <button onClick={() => handleReject(index, subIndex)} className="text-xs font-semibold text-error/80 hover:text-error">Rejeitar</button>
                                                    <button onClick={() => handleApprove(index, subIndex)} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary/20">Aprovar</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-8 text-sm text-muted">
                                {isLoading ? 'Aguardando sugestões...' : 'Nenhuma sugestão para revisar.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Approved Items */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
                    <h2 className="font-bold text-lg text-secondary">Ações Aprovadas ({approvedItems.length})</h2>
                    <p className="text-sm text-muted mb-4">Estas ações estão prontas. Adicione-as a um plano existente ou crie um novo.</p>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {approvedItems.length > 0 ? approvedItems.map((item, index) => (
                            <div 
                                key={`appr-${index}`} 
                                className={`border border-success/30 rounded-lg p-3 bg-success/5 ${newlyApprovedIndices.includes(index) ? 'animate-highlight-fade' : ''}`}
                            >
                                <h4 className="font-bold text-success text-sm">{item.desvioPontoMelhoria}</h4>
                                <p className="text-xs text-muted mt-1">{item.responsavel} • Prazo: {safeFormatDate(item.prazo)}</p>
                                <div className="flex justify-end mt-1">
                                    <button onClick={() => handleRemoveApprovedItem(index)} className="text-xs font-semibold text-error/80 hover:text-error">Remover</button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-sm text-muted">Aprove as sugestões da IA para adicioná-las aqui.</div>
                        )}
                    </div>
                    {approvedItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div>
                                <label htmlFor="plan-select" className="text-sm font-medium text-secondary">Adicionar a um plano existente:</label>
                                <div className="flex gap-2 mt-1">
                                    <select id="plan-select" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className="flex-grow w-full px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md bg-white">
                                        <option value="">Selecione um plano...</option>
                                        {ongoingPlans.map(p => <option key={p.id} value={p.id}>{p.planName}</option>)}
                                    </select>
                                    <button onClick={handleAddToExistingPlan} disabled={!selectedPlanId || isOperating} className="bg-secondary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                            <div className="text-center text-sm text-muted">ou</div>
                            <button onClick={() => setIsCreatePlanModalOpen(true)} disabled={isOperating} className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Criar Novo Plano com Estas Ações
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Ação Sugerida">
                {editingItem && (
                    <ActionForm
                        item={editingItem.data}
                        onSave={(itemData) => handleSaveEdit(itemData as SuggestedActionItem)}
                        onCancel={() => setIsEditModalOpen(false)}
                        planEmissionDate={new Date().toISOString().split('T')[0]}
                        isSaving={isOperating}
                    />
                )}
            </Modal>

            <Modal isOpen={isCreatePlanModalOpen} onClose={() => setIsCreatePlanModalOpen(false)} title="Criar Novo Plano de Ação">
                <CreatePlanForm 
                    onSave={handleCreateNewPlan}
                    onCancel={() => setIsCreatePlanModalOpen(false)}
                    isSaving={isOperating}
                />
            </Modal>
        </div>
    );
};

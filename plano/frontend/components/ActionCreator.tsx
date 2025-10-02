import React, { useState } from 'react';
import { generateActionPlan } from '../services/geminiService';
import { SuggestedActionItem, ActionItem, ActionType, PlanReason, ActionStatus, ActionPriority } from '../types';
import { Modal } from './Modal';
import { EditIcon } from './icons/EditIcon';
import { ActionForm } from './ActionForm';
import { AIPlannerIcon } from './icons/AIPlannerIcon';


// Allow pdf.js to be recognized from the CDN script
declare const pdfjsLib: any;


interface ActionCreatorProps {
  planReason: PlanReason;
  planEmissionDate: string;
  isOperating: boolean;
  setSuggestedItems: (items: SuggestedActionItem[]) => void;
  suggestedItems: SuggestedActionItem[];
  approveSuggestedItem: (index: number) => void;
  rejectSuggestedItem: (index: number) => void;
  updateSuggestedItem: (index: number, updatedData: SuggestedActionItem) => void;
  addActionItem: (item: Omit<ActionItem, 'id'>) => void;
}

const LoadingSpinner: React.FC<{ text?: string}> = ({ text = "A IA está pensando..."}) => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-primary" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2 text-gray-600">{text}</span>
    </div>
);

const ManualActionForm: React.FC<{ 
    onSave: (item: Omit<ActionItem, 'id'>) => void; 
    planReason: PlanReason;
    planEmissionDate: string;
    isSaving: boolean;
}> = ({ onSave, planReason, planEmissionDate, isSaving }) => {
    
    return (
        <ActionForm
            item={{ 
                origem: planReason, 
                status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
                tipo: ActionType.CORRETIVA,
                priority: ActionPriority.MEDIA,
                prazo: new Date().toISOString().split('T')[0]
            }}
            onSave={(itemData) => onSave(itemData as Omit<ActionItem, 'id'>)}
            onCancel={() => {}} // This form is embedded, so cancel is handled by parent
            planEmissionDate={planEmissionDate}
            isSaving={isSaving}
        />
    );
};

export const ActionCreator: React.FC<ActionCreatorProps> = ({ planReason, planEmissionDate, isOperating, setSuggestedItems, suggestedItems, approveSuggestedItem, rejectSuggestedItem, updateSuggestedItem, addActionItem }) => {
    const [mode, setMode] = useState<'ai' | 'manual'>('ai');
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [loadingText, setLoadingText] = useState("A IA está pensando...");


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
                    setLoadingText("A IA está pensando...");
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


    const handleGenerate = async () => {
        if (!prompt.trim() && !fileContent) {
            setError('Por favor, descreva o objetivo ou anexe um arquivo.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuggestedItems([]);
        const promptToSend = prompt.trim() || "Avalie o anexo e fragmente as ações.";

        try {
            const items = await generateActionPlan(promptToSend, planReason, planEmissionDate, fileContent);
            setSuggestedItems(items);
        } catch (err: any) {
            setError(err.message || 'Falha ao gerar o plano.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEditModal = (index: number) => {
        setEditingItemIndex(index);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedItem = (updatedData: SuggestedActionItem) => {
        if (editingItemIndex !== null) {
            updateSuggestedItem(editingItemIndex, updatedData);
        }
        setIsEditModalOpen(false);
        setEditingItemIndex(null);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
             <div className="border-b border-border-color mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setMode('ai')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center ${mode === 'ai' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-secondary hover:border-gray-300'}`}>
                        <AIPlannerIcon className="w-5 h-5 mr-2"/> Gerar com IA
                    </button>
                    <button onClick={() => setMode('manual')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'manual' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-secondary hover:border-gray-300'}`}>
                        Adicionar Manualmente
                    </button>
                </nav>
            </div>
            
            {mode === 'ai' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* AI Input Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-card border border-border-color">
                        <h2 className="text-xl font-bold text-secondary">Gerar Ações com IA</h2>
                        <p className="text-sm text-neutral-500 mt-1">Descreva o objetivo ou anexe um documento. A IA criará um rascunho do plano de ação para você.</p>
                        <div className="mt-4">
                            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-1">Objetivo ou Problema</label>
                            <textarea id="ai-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ex: Melhorar a satisfação do cliente com o serviço de refeitório." className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                         <div className="mt-4">
                            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">Anexar Contexto (Opcional - PDF)</label>
                            <input id="file-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            {file && <p className="text-xs text-gray-500 mt-1">Arquivo selecionado: {file.name}</p>}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleGenerate} disabled={isLoading || isOperating} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed w-full sm:w-auto">
                                {isLoading ? <LoadingSpinner text={loadingText} /> : 'Gerar Ações'}
                            </button>
                        </div>
                        {error && <p className="text-error text-sm mt-2">{error}</p>}
                    </div>

                    {/* AI Suggestions Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-card border border-border-color">
                         <h2 className="text-xl font-bold text-secondary">Sugestões da IA ({suggestedItems.length})</h2>
                        <p className="text-sm text-neutral-500 mt-1">Revise, edite e aprove as ações geradas.</p>
                        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {suggestedItems.length > 0 ? suggestedItems.map((item, index) => (
                                <div key={index} className="border border-border-color rounded-lg p-3 bg-neutral-50/50 animate-fade-in">
                                    <h4 className="font-bold text-primary-text text-sm">{item.desvioPontoMelhoria}</h4>
                                    <p className="text-xs text-neutral-500 mt-1">{item.acaoParaMitigacao}</p>
                                    <div className="flex justify-end items-center space-x-2 mt-2">
                                        <button onClick={() => handleOpenEditModal(index)} className="text-xs font-semibold text-neutral-500 hover:text-primary"><EditIcon className="w-4 h-4 inline-block mr-1"/>Editar</button>
                                        <button onClick={() => rejectSuggestedItem(index)} className="text-xs font-semibold text-error/80 hover:text-error">Rejeitar</button>
                                        <button onClick={() => approveSuggestedItem(index)} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full hover:bg-primary/20">Aprovar</button>
                                    </div>
                                </div>
                            )) : (
                                 <div className="text-center py-8 text-sm text-neutral-500">
                                    {isLoading ? 'Aguardando sugestões...' : 'Nenhuma sugestão para revisar.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-card border border-border-color max-w-3xl mx-auto">
                     <h2 className="text-xl font-bold text-secondary mb-4">Adicionar Nova Ação Manualmente</h2>
                     <ManualActionForm onSave={addActionItem} planReason={planReason} planEmissionDate={planEmissionDate} isSaving={isOperating}/>
                </div>
            )}
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Ação Sugerida">
                {editingItemIndex !== null && suggestedItems[editingItemIndex] && (
                    <ActionForm 
                        item={suggestedItems[editingItemIndex]}
                        onSave={(itemData) => handleSaveEditedItem(itemData as SuggestedActionItem)}
                        onCancel={() => setIsEditModalOpen(false)}
                        planEmissionDate={planEmissionDate}
                        isSaving={isOperating}
                    />
                )}
            </Modal>
        </div>
    );
};
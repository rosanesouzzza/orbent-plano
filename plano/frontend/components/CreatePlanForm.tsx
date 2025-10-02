import React, { useState } from 'react';
import { PlanReason, ActionItem, ActionStatus, ActionPriority, ActionType, SuggestedActionItem, NewPlanData } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { generateActionPlan } from '../services/geminiService';
import { strategicPillars } from '../data/strategicPillars';
import { validResponsibles } from '../data/responsibles';

// Allow TypeScript to recognize the global variables from the CDN scripts
declare const Papa: any;
declare const XLSX: any;
declare const pdfjsLib: any;

interface CreatePlanFormProps {
    onSave: (data: NewPlanData, items?: Omit<ActionItem, 'id'>[]) => void;
    onCancel: () => void;
    isSaving: boolean;
}

export const CreatePlanForm: React.FC<CreatePlanFormProps> = ({ onSave, onCancel, isSaving }) => {
    const [mode, setMode] = useState<'manual' | 'import'>('manual');
    
    // Common state for both modes
    const [clientName, setClientName] = useState('');
    const [planName, setPlanName] = useState('');
    const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState<PlanReason>(PlanReason.OUTROS);
    const [planOwnerName, setPlanOwnerName] = useState(validResponsibles[0]);
    
    // Import mode state
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseMessage, setParseMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [parsedItems, setParsedItems] = useState<Omit<ActionItem, 'id'>[]>([]);

    const extractTextFromPdf = async (fileToParse: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) return reject('Falha ao ler o arquivo PDF.');
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
                    reject('Erro ao extrair texto do PDF. O arquivo pode estar corrompido.');
                }
            };
            reader.onerror = () => reject('Erro ao ler o arquivo PDF.');
            reader.readAsArrayBuffer(fileToParse);
        });
    };

    const processPdfFile = async (pdfFile: File) => {
        setIsParsing(true);
        setParseMessage({ type: 'info', text: 'Extraindo texto do PDF...' });
        try {
            if (!planName.trim()) {
                throw new Error("Por favor, preencha o 'Nome do Plano de Ação' antes de enviar um PDF para dar contexto à IA.");
            }
            const textContent = await extractTextFromPdf(pdfFile);
            setParseMessage({ type: 'info', text: 'Texto extraído. Gerando ações com IA...' });
            
            const aiPrompt = `Com base no plano de ação nomeado "${planName}", analise o seguinte texto e gere as ações necessárias.`;
            
            const result: SuggestedActionItem[] = await generateActionPlan(aiPrompt, reason, emissionDate, textContent);
            
            const completeItems: Omit<ActionItem, 'id'>[] = result.map(item => ({
                ...item,
                status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
                anexos: [], 
                tags: item.tags || [],
            }));

            setParsedItems(completeItems);
            setParseMessage({ type: 'success', text: `${completeItems.length} ações foram geradas com sucesso a partir do PDF.` });

        } catch (error: any) {
            setParsedItems([]);
            setParseMessage({ type: 'error', text: error.message || "Ocorreu um erro ao processar o PDF com a IA." });
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
            setParseMessage(null);
            setParsedItems([]);
            
            const fileName = selectedFile.name.toLowerCase();

            if (fileName.endsWith('.pdf')) {
                processPdfFile(selectedFile);
            } else if (['.csv', '.xls', '.xlsx'].some(ext => fileName.endsWith(ext))) {
                parseSpreadsheet(selectedFile);
            } else {
                setParseMessage({ type: 'error', text: 'Formato de arquivo não suportado. Use CSV, XLSX, XLS ou PDF.' });
            }
        }
    };
    
    const columnAliases: { [key in keyof Omit<ActionItem, 'id' | 'anexos'>]: string[] } = {
        pilarEstrategico: ['pilar estratégico', 'pilar estrategico', 'pilar'],
        desvioPontoMelhoria: ['desvio/ponto de melhoria', 'desvio ponto de melhoria', 'desvio', 'ponto de melhoria', 'ponto', 'item', 'título', 'titulo', 'ação', 'acao'],
        origem: ['origem', 'motivo', 'fonte'],
        acaoParaMitigacao: ['ação para mitigação', 'acao para mitigacao', 'ação corretiva', 'acao corretiva', 'descrição', 'descricao', 'description', 'mitigação', 'detalhes da ação'],
        departamentosEnvolvidos: ['departamentos envolvidos', 'departamento envolvido', 'departamentos', 'departamento', 'área', 'area', 'áreas', 'areas', 'setor'],
        responsavel: ['responsável', 'responsavel', 'owner', 'dono'],
        prazo: ['prazo', 'deadline', 'data de entrega', 'data-alvo', 'data final'],
        evidencia: ['evidência', 'evidencia', 'evidência de conclusão', 'comprovação', 'comprovacao'],
        verificacao: ['verificação', 'verificacao', 'verificação de eficácia'],
        status: ['status', 'estado'],
        tipo: ['tipo', 'categoria'],
        priority: ['prioridade', 'urgência', 'urgencia'],
        tags: ['tags', 'etiquetas'],
    };

    const normalizeAndValidateRow = (row: any, rowIndex: number): Omit<ActionItem, 'id'> | null => {
        const normalizedRow: Partial<Omit<ActionItem, 'id'>> = {};
        
        const get = (key: keyof Omit<ActionItem, 'id' | 'anexos'>): any => {
            const aliases = columnAliases[key];
            for (const alias of aliases) {
                if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
                    return row[alias];
                }
            }
            return null;
        };

        const desvioPontoMelhoria = get('desvioPontoMelhoria');
        const acaoParaMitigacao = get('acaoParaMitigacao');
        const departamentosEnvolvidos = get('departamentosEnvolvidos');
        const responsavel = get('responsavel');
        const prazo = get('prazo');
        
        if (!desvioPontoMelhoria || !acaoParaMitigacao || !departamentosEnvolvidos || !responsavel || !prazo) {
            return null; // Skip row if mandatory fields are missing
        }

        normalizedRow.desvioPontoMelhoria = String(desvioPontoMelhoria);
        normalizedRow.acaoParaMitigacao = String(acaoParaMitigacao);
        normalizedRow.responsavel = String(responsavel);
        
        const depts = String(departamentosEnvolvidos).split(/[,;]/).map(d => d.trim()).filter(Boolean);
        normalizedRow.departamentosEnvolvidos = depts.length > 0 ? depts : ['Não especificado'];

        let parsedDate: Date | null = null;
        if (prazo instanceof Date) {
            parsedDate = prazo;
        } else if (typeof prazo === 'number') {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            parsedDate = new Date(excelEpoch.getTime() + prazo * 86400000);
        } else if (typeof prazo === 'string') {
            const parts = prazo.match(/(\d+)/g);
            if (parts && parts.length === 3) {
                const [p1, p2, p3] = parts.map(p => parseInt(p, 10));
                if (prazo.includes('/') && p3 > 2000) { // DD/MM/YYYY
                    parsedDate = new Date(Date.UTC(p3, p2 - 1, p1));
                } else if (p1 > 2000) { // YYYY-MM-DD
                    parsedDate = new Date(Date.UTC(p1, p2 - 1, p3));
                } else {
                    parsedDate = new Date(prazo);
                }
            } else {
                 parsedDate = new Date(prazo);
            }
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
            const utcDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
            normalizedRow.prazo = utcDate.toISOString().split('T')[0];
        } else {
            return null;
        }
        
        normalizedRow.pilarEstrategico = String(get('pilarEstrategico') || strategicPillars[0]);
        normalizedRow.origem = String(get('origem') || reason) as PlanReason;
        normalizedRow.evidencia = String(get('evidencia') || '');
        normalizedRow.verificacao = String(get('verificacao') || '');
        normalizedRow.status = String(get('status') || ActionStatus.AJUSTADAS_EM_EXECUCAO) as ActionStatus;
        normalizedRow.tipo = String(get('tipo') || ActionType.CORRETIVA) as ActionType;
        normalizedRow.priority = String(get('priority') || ActionPriority.MEDIA) as ActionPriority;
        normalizedRow.tags = String(get('tags') || '').split(/[,;]/).map(t => t.trim()).filter(Boolean);
        normalizedRow.anexos = [];

        return normalizedRow as Omit<ActionItem, 'id'>;
    };

    const findHeaderRow = (rows: any[][]) => {
        let bestMatch = { headerRow: null as any[] | null, headerIndex: -1, maxMatches: 0 };
        const maxRowsToCheck = Math.min(rows.length, 10);
        
        const aliasToKeyMap = new Map<string, keyof typeof columnAliases>();
        for (const key in columnAliases) {
            const typedKey = key as keyof typeof columnAliases;
            columnAliases[typedKey].forEach(alias => aliasToKeyMap.set(alias, typedKey));
        }

        for (let i = 0; i < maxRowsToCheck; i++) {
            const row = rows[i].map(cell => String(cell || '').toLowerCase().trim().replace('*', ''));
            const foundKeys = new Set<string>();
            row.forEach(cell => {
                if (aliasToKeyMap.has(cell)) foundKeys.add(aliasToKeyMap.get(cell)!);
            });
            const currentMatches = foundKeys.size;
            if (currentMatches > bestMatch.maxMatches && currentMatches >= 5) { // Require at least the 5 mandatory fields
                bestMatch = { headerRow: rows[i], headerIndex: i, maxMatches: currentMatches };
            }
        }
        return bestMatch;
    }

    const parseSpreadsheet = (fileToParse: File) => {
        setIsParsing(true);
        setParseMessage({ type: 'info', text: 'Analisando arquivo...' });
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
    
                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
                if (rows.length < 1) throw new Error("A planilha está vazia.");
    
                const { headerRow, headerIndex } = findHeaderRow(rows);
                if (!headerRow) throw new Error("Não foi possível encontrar uma linha de cabeçalho válida. Verifique se as colunas obrigatórias correspondem às instruções.");
    
                const headerStrings = headerRow.map(h => String(h || '').toLowerCase().trim().replace('*', ''));
                const dataRows = rows.slice(headerIndex + 1);
    
                const json = dataRows.map(rowArray => {
                    const rowData: { [key: string]: any } = {};
                    headerStrings.forEach((header, index) => {
                        if (header) rowData[header] = rowArray[index];
                    });
                    return rowData;
                });
                
                const items = json.map((row, i) => normalizeAndValidateRow(row, i + headerIndex + 1)).filter((item): item is Omit<ActionItem, 'id'> => item !== null);

                if (items.length === 0) {
                    setParseMessage({ type: 'error', text: 'Nenhum item de ação válido foi encontrado no arquivo. Verifique se as colunas obrigatórias estão preenchidas e se os nomes correspondem às instruções.' });
                    setParsedItems([]);
                } else {
                    setParsedItems(items);
                    setParseMessage({ type: 'success', text: `${items.length} ações foram encontradas e validadas no arquivo.` });
                }
            } catch (error: any) {
                setParseMessage({ type: 'error', text: `Erro ao ler a planilha: ${error.message}` });
                setParsedItems([]);
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsBinaryString(fileToParse);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const planData: NewPlanData = { clientName, planName, emissionDate, reason, planOwnerName };

        if (!clientName.trim() || !planName.trim() || !emissionDate || !planOwnerName) {
            alert('Por favor, preencha todos os campos: Nome do Cliente, Nome do Plano, Data de Emissão e Responsável pelo Plano.');
            return;
        }

        if (mode === 'manual') {
            onSave(planData);
        } else {
            onSave(planData, parsedItems);
        }
    };
    
    return (
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Nome do Plano de Ação</label>
                    <input type="text" id="planName" value={planName} onChange={e => setPlanName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Cliente</label>
                    <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                    <label htmlFor="planOwnerName" className="block text-sm font-medium text-gray-700">Responsável pelo Plano</label>
                    <select id="planOwnerName" value={planOwnerName} onChange={e => setPlanOwnerName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        {validResponsibles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="emissionDate" className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                    <input type="date" id="emissionDate" value={emissionDate} onChange={e => setEmissionDate(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Origem do Plano</label>
                    <select id="reason" value={reason} onChange={e => setReason(e.target.value as PlanReason)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        {Object.values(PlanReason).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>
            
             <div className="border-b border-border-color">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button type="button" onClick={() => setMode('manual')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'manual' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary hover:border-gray-300'}`}>
                        Criar Vazio
                    </button>
                    <button type="button" onClick={() => setMode('import')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${mode === 'import' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-secondary hover:border-gray-300'}`}>
                        Importar Arquivo
                    </button>
                </nav>
            </div>

            {mode === 'import' && (
                <div className="pt-4 space-y-4">
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0] || null); }}
                    >
                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-primary">
                          Carregue um arquivo <span className="text-gray-600 font-normal">ou arraste e solte</span>
                        </p>
                        <p className="text-xs text-muted">CSV, XLSX, XLS ou PDF</p>
                        <input id="file-upload" type="file" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
                    </div>

                    {file && <p className="text-sm text-center text-muted">Arquivo selecionado: <strong>{file.name}</strong></p>}
                    
                    {isParsing && (
                         <div className="flex items-center justify-center p-3 bg-primary/10 rounded-lg">
                            <div className="w-4 h-4 rounded-full animate-spin border-2 border-solid border-primary border-t-transparent mr-3"></div>
                            <span className="text-sm font-semibold text-primary-text">{parseMessage?.text || 'Processando...'}</span>
                        </div>
                    )}

                    {parseMessage && !isParsing && (
                         <div className={`p-3 rounded-lg text-sm font-semibold text-center ${
                             parseMessage.type === 'success' ? 'bg-success/10 text-success' : 
                             parseMessage.type === 'error' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary-text'
                         }`}>
                           {parseMessage.text}
                        </div>
                    )}
                    
                    <div className="text-xs text-muted bg-light-gray p-3 rounded-lg border border-border-color">
                        <h4 className="font-bold mb-2 text-secondary">Instruções para Arquivo CSV/XLSX:</h4>
                        <p className="mb-2">O sistema encontrará o cabeçalho automaticamente. Certifique-se de que sua planilha contenha as seguintes colunas:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <div>
                                <strong className="underline">Colunas Obrigatórias (*):</strong>
                                <ul className="list-['*_'] list-inside space-y-0.5 mt-1">
                                    <li>Desvio/Ponto de Melhoria</li>
                                    <li>Ação para mitigação</li>
                                    <li>Departamentos Envolvidos</li>
                                    <li>Responsável</li>
                                    <li>Prazo</li>
                                </ul>
                            </div>
                            <div>
                                <strong className="underline">Colunas Opcionais:</strong>
                                <ul className="list-['-_'] list-inside space-y-0.5 mt-1">
                                    <li>ID, Pilar Estratégico, Origem</li>
                                    <li>Evidência, Verificação</li>
                                    <li>Status, Tipo, Prioridade, Tags</li>
                                </ul>
                            </div>
                        </div>
                         <h4 className="font-bold mt-3 mb-1 text-secondary">Instruções para Arquivo PDF:</h4>
                         <p>O conteúdo do PDF será lido e analisado pela IA para gerar sugestões de ações. Certifique-se de que o texto contenha os detalhes necessários.</p>
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-light-gray text-secondary px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving || isParsing} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isSaving ? 'Salvando...' : (mode === 'manual' ? 'Criar Plano Vazio' : `Criar Plano com ${parsedItems.length} Ações`)}
                </button>
            </div>
        </form>
    );
};
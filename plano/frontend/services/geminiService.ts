
import { GoogleGenAI, Type } from "@google/genai";
import { ActionItem, SuggestedActionItem, ActionType, PlanReason, ActionPriority } from '../types';
import { validResponsibles } from "../data/responsibles";
import { strategicPillars } from "../data/strategicPillars";
import { safeFormatDate } from "../utils/dateUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const rewriteText = async (textToRewrite: string, fieldContext: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const prompt = `
    Aja como um redator profissional especializado em comunicação empresarial clara e concisa.
    Sua tarefa é reescrever o texto a seguir para que seja mais profissional, claro e alinhado com o tom da Orbent.

    **Contexto do Campo:** ${fieldContext}
    **Texto Original:** "${textToRewrite}"

    **Diretrizes:**
    - Mantenha o significado original.
    - Melhore a clareza e a gramática.
    - Use um tom profissional e objetivo.
    - A saída deve ser APENAS o texto reescrito, sem introduções, despedidas ou formatação extra.

    **Texto Reescrito:**
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error rewriting text with Gemini:", error);
    throw new Error("Ocorreu um erro ao reescrever o texto. Por favor, tente novamente.");
  }
};


export const generateExecutiveSummary = async (items: ActionItem[], planName: string, clientName: string, planReason: PlanReason, creatorName: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const prompt = `
    Aja como um consultor de gestão sênior da Orbent.
    Sua tarefa é gerar o conteúdo textual para um "Relatório de Plano de Ação" para o cliente **${clientName}**, seguindo estritamente a estrutura e o tom institucional da Orbent.

    **INFORMAÇÕES DE CONTEXTO:**
    - **Cliente:** ${clientName}
    - **Plano de Ação:** ${planName}

    ---
    
    **ESTRUTURA OBRIGATÓRIA DA SAÍDA (MARKDOWN):**
    
    ### Sumário Executivo
    Redija o Sumário Executivo do Plano de Ação elaborado pela Orbent para o cliente ${clientName}.

    Regras:
    - Tom profissional, colaborativo e objetivo; evite exageros (“é um prazer”, “com satisfação” etc.).
    - Foque em contexto e clareza: finalidade do plano, organização das iniciativas, responsabilidades e prazos.
    - Aponte o alinhamento do plano às prioridades estratégicas do cliente.
    - Realce a atuação da Orbent como parceira no acompanhamento das ações.
    - Formato: parágrafo corrido, alinhado justificado, sem números/dados (eles estarão nos quadros).

    ### Considerações Finais
    Redija as Considerações Finais do Plano de Ação elaborado pela Orbent para o cliente ${clientName}.

    Regras:
    - Tom colaborativo, firme e profissional.
    - Reforce o compromisso conjunto e o acompanhamento sistemático para cumprir prazos e qualidade.
    - Indique a disposição da Orbent em apoiar o cliente em todas as etapas.
    - Formato: parágrafo corrido, alinhado justificado; evitar frases promocionais e elogios excessivos.

    ---

    **Dados JSON do Plano de Ação para sua Análise (Não inclua na saída):**
    ${JSON.stringify(items, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Ocorreu um erro ao gerar o relatório. Por favor, verifique a configuração da API e tente novamente.";
  }
};

export const generateActionPlan = async (prompt: string, planReason: PlanReason, planEmissionDate: string, fileContent?: string): Promise<SuggestedActionItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  
  const fileContextPrompt = fileContent
    ? `
    ---
    **CONTEXTO ADICIONAL DE ARQUIVO ANEXADO:**
    O seguinte texto foi extraído de um documento de referência (ex: relatório de auditoria, e-mail, etc.). Use as informações contidas nele como a principal fonte para identificar os desvios e riscos que precisam ser mitigados. As suas sugestões de ação devem abordar diretamente os pontos levantados neste texto.

    \`\`\`
    ${fileContent}
    \`\`\`
    ---
    `
    : '';
    
  const formattedEmissionDate = safeFormatDate(planEmissionDate);


  const fullPrompt = `
    Aja como um consultor de gestão sênior da Orbent, especializado na indústria de food service e em conformidade com as normas regulatórias brasileiras. Sua tarefa é criar um plano de ação estratégico e detalhado com base no problema ou objetivo fornecido.

    **Sua Tarefa:**
    **Regra principal: FRAGMENTE o objetivo em várias ações menores, específicas e independentes.** Um bom plano de ação tem várias etapas claras, não apenas uma ou duas ações genéricas. Gere uma lista de 3 a 5 ações.

    **REGRAS OBRIGATÓRIAS DE CONTEXTO (MUITO IMPORTANTE):**
    1.  **Origem Fixa:** A 'origem' de TODAS as ações que você gerar DEVE ser obrigatoriamente: **"${planReason}"**. Não use nenhuma outra categoria de origem.
    2.  **Prazo Válido:** O 'prazo' (data de término) de TODAS as ações que você gerar DEVE ser uma data FUTURA em relação à data de emissão do plano. A data de emissão do plano é **${formattedEmissionDate}**. Portanto, todos os prazos devem ser posteriores a esta data. Não gere prazos anteriores ou iguais a esta data.

    ---
    **DIRETRIZ DE LINGUAGEM E TOM (REGRA MAIS IMPORTANTE DE TODAS):**

    Sua tarefa principal é descrever ações como **melhorias ou reforços de processos que já existem**, e não como a criação de algo novo. A linguagem deve ser protetiva para a empresa Orbent, mostrando proatividade e continuidade.

    **1. VERBOS PROIBIDOS (NUNCA USE):**
    Estes verbos sugerem que algo está sendo criado do zero. Evite-os completamente.
    - 🚫 Desenvolver, Implementar, Criar, Elaborar, Construir, Iniciar, Estabelecer.

    **2. VERBOS OBRIGATÓRIOS (USE SEMPRE ESTES):**
    Use esta lista para construir todas as suas frases de ação.
    - ✅ **Reforçar:** Para intensificar uma prática existente.
    - ✅ **Manter:** Para ações que já estão em curso e continuarão.
    - ✅ **Ajustar:** Para pequenas correções ou adaptações.
    - ✅ **Ampliar:** Para aumentar o alcance de algo já existente.
    - ✅ **Intensificar:** Para aumentar a frequência ou rigor da ação.
    - ✅ **Consolidar:** Para garantir a estabilidade de um processo.
    - ✅ **Fortalecer:** Para dar mais robustez a uma prática.
    - ✅ **Atualizar:** Para modernizar uma prática contínua.
    - ✅ **Aprimorar:** Para melhorias contínuas dentro do escopo.
    - ✅ **Padronizar:** Para uniformizar práticas já aplicadas.

    **3. EXEMPLOS DE APLICAÇÃO (SIGA ESTE PADRÃO):**
    - **ERRADO:** "Desenvolver e implementar auditorias internas"
    - **CERTO:** "Reforçar e manter as auditorias internas já previstas no escopo"
    
    - **ERRADO:** "Criar um fluxo de comunicação com gestores"
    - **CERTO:** "Consolidar e intensificar o fluxo de comunicação já praticado com gestores"

    - **ERRADO:** "Elaborar novos controles de higienização"
    - **CERTO:** "Padronizar e reforçar os controles de higienização em vigor"

    **4. TOM GERAL:**
    Use construções que mostrem que as ações já estão em andamento: "reforçadas", "ajustadas", "em andamento contínuo", "intensificadas", "em execução", "em ampliação", "com fluxo reforçado e monitoramento".
    ---
    ${fileContextPrompt}
    **O objetivo é: "${prompt}"**

    Para cada item do plano de ação, preencha os seguintes campos, **respeitando estritamente TODAS as regras acima, especialmente a DIRETRIZ DE LINGUAGEM E TOM**:
    - desvioPontoMelhoria: Crie um título curto para a ação (este campo é o "Desvio/Ponto de Melhoria"), **seguindo as regras de estilo e tom.**
    - origem: Use o valor obrigatório: **"${planReason}"**.
    - acaoParaMitigacao: Descreva a ação a ser tomada de forma detalhada (este campo é a "Ação para mitigação"), **seguindo as regras de estilo e tom.**
    - departamentosEnvolvidos: Atribua a um ou mais departamentos (este campo é "Departamentos Envolvidos"). A saída DEVE ser uma lista de strings.
    - responsavel: Escolha um cargo da seguinte lista: ${JSON.stringify(validResponsibles)}.
    - pilarEstrategico: Classifique a ação em UM dos seguintes pilares: ${JSON.stringify(strategicPillars)}.
    - prazo: Estime uma data de prazo realista no formato AAAA-MM-DD, **posterior a ${formattedEmissionDate}**.
    - tipo: Classifique a ação como 'Corretiva', 'Preventiva' ou 'Melhoria'.
    - priority: Classifique a prioridade como 'Alta', 'Média', ou 'Baixa'.
    - evidencia: Descreva qual será a evidência concreta de que a tarefa foi concluída (ex: "Checklist de Boas Práticas preenchido", "Certificado de calibração de equipamento", "Plano de descarte de resíduos documentado").
    - verificacao: Descreva como a eficácia da ação será verificada. Qual é o resultado esperado ou o KPI que será impactado? (ex: "Redução de 100% das não-conformidades na próxima auditoria sanitária", "Aprovação na inspeção do corpo de bombeiros").

    A saída DEVE ser um JSON válido contendo uma lista de objetos.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        desvioPontoMelhoria: { type: Type.STRING, description: 'O "Desvio/Ponto de Melhoria". Um título curto para a ação.' },
        origem: { type: Type.STRING, description: 'A origem ou motivo da ação.', enum: Object.values(PlanReason) },
        acaoParaMitigacao: { type: Type.STRING, description: 'A "Ação para mitigação". Descrição detalhada da ação a ser tomada.' },
        departamentosEnvolvidos: { 
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Os "Departamentos Envolvidos". Uma lista de um ou mais departamentos responsáveis.' 
        },
        responsavel: { type: Type.STRING, description: 'Um cargo para o responsável.', enum: validResponsibles },
        pilarEstrategico: { type: Type.STRING, description: 'O pilar estratégico da ação.', enum: strategicPillars },
        prazo: { type: Type.STRING, description: "Data no formato AAAA-MM-DD" },
        tipo: { type: Type.STRING, enum: Object.values(ActionType), description: 'O tipo da ação.' },
        priority: { type: Type.STRING, enum: Object.values(ActionPriority), description: 'A prioridade da ação.' },
        evidencia: { type: Type.STRING, description: 'A evidência concreta de que a tarefa foi concluída.' },
        verificacao: { type: Type.STRING, description: 'Como a eficácia da ação será verificada.' },
      },
      required: ['desvioPontoMelhoria', 'acaoParaMitigacao', 'departamentosEnvolvidos', 'responsavel', 'prazo', 'origem', 'tipo', 'priority', 'evidencia', 'verificacao', 'pilarEstrategico']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
      }
    });
    
    const resultText = response.text;
    if (!resultText) {
        const errorDetails = JSON.stringify(response, null, 2);
        console.error("Unexpected AI response structure in generateActionPlan:", errorDetails);
        throw new Error("A resposta da IA não continha a parte de texto esperada.");
    }

    try {
        const cleanedResult = resultText.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedResult);
    } catch (e) {
        console.error("Failed to parse JSON string from Gemini:", e, "Original string:", resultText);
        throw new Error("A resposta da IA não é um JSON válido.");
    }

  } catch (error) {
    console.error("Error generating action plan with Gemini:", error);
    throw new Error("Ocorreu um erro ao gerar o plano de ação. Por favor, tente novamente.");
  }
};


export const generateSubTasks = async (goal: string, fileContent?: string): Promise<SuggestedActionItem[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const today = new Date().toISOString().split('T')[0];
    
    const fileAnalysisPrompt = fileContent
    ? `
    **MISSÃO PRINCIPAL: ANÁLISE DE DOCUMENTO**
    Sua tarefa principal é analisar o conteúdo do documento anexado, identificar CADA desvio, não-conformidade ou ponto de melhoria mencionado, e criar uma ação específica e detalhada para CADA UM deles. Seja exaustivo. Para cada problema distinto encontrado no texto, gere uma ação correspondente. Se o documento listar 5 problemas, você DEVE gerar 5 ou mais ações detalhadas.

    **DOCUMENTO PARA ANÁLISE:**
    \`\`\`
    ${fileContent}
    \`\`\`
    ---
    `
    : '';

    const goalPrompt = `
        **OBJETIVO GERAL (TEMA):**
        Use o seguinte objetivo como o tema principal para sua análise e criação de ações: "${goal}"
    `;

    const prompt = `
        Aja como um gerente de projetos sênior e especialista em conformidade e planejamento estratégico.
        ${fileContent ? fileAnalysisPrompt : ''}
        ${goalPrompt}

        **Sua Missão Detalhada:**
        1.  **Decomposição Exaustiva:** ${fileContent ? 'Com base no documento fornecido, fragmente CADA ponto crítico em uma ação individual.' : 'Quebre o objetivo principal em 3 a 5 sub-tarefas específicas, mensuráveis e independentes.'} Cada sub-tarefa deve ser um passo claro para alcançar o objetivo maior.
        2.  **Detalhamento:** Para cada sub-tarefa, preencha todos os campos necessários para criar um item de ação completo.
        3.  **Linguagem Proativa:** Use uma linguagem clara, direta e focada na ação. Verbos como "Analisar", "Verificar", "Implementar", "Corrigir" e "Padronizar" são apropriados.

        **Regras de Preenchimento:**
        -   **desvioPontoMelhoria:** Deve ser o nome da sub-tarefa, identificando claramente o problema ou desvio encontrado no documento. (Ex: "Falta de registro de temperatura na câmara fria 2", "Procedimento de higienização de bancadas não seguido").
        -   **acaoParaMitigacao:** Descreva em detalhes as atividades necessárias para corrigir ou mitigar o desvio. Seja específico.
        -   **origem:** Use o valor fixo: "${PlanReason.PLANEJAMENTO_IA}".
        -   **departamentosEnvolvidos:** Atribua a um ou mais departamentos. A saída deve ser uma lista de strings.
        -   **responsavel:** Escolha o cargo mais apropriado da seguinte lista: ${JSON.stringify(validResponsibles)}.
        -   **pilarEstrategico:** Classifique a ação em UM dos seguintes pilares: ${JSON.stringify(strategicPillars)}.
        -   **prazo:** Estime uma data de conclusão realista no formato AAAA-MM-DD, que seja **posterior a ${today}**.
        -   **tipo:** Classifique a ação como 'Corretiva', 'Preventiva' ou 'Melhoria'. A maioria será 'Corretiva' ou 'Melhoria' neste contexto.
        -   **priority:** Classifique a prioridade como 'Alta', 'Média', ou 'Baixa', com base na gravidade do desvio.
        -   **evidencia:** Descreva qual será a "prova" de que a tarefa foi concluída (ex: "Planilhas de registro de temperatura preenchidas dos últimos 30 dias", "Checklist de higienização assinado pela equipe", "Relatório fotográfico da correção").
        -   **verificacao:** Descreva como o sucesso da tarefa será medido (ex: "100% de conformidade nos registros de temperatura na próxima auditoria interna", "Redução a zero das não-conformidades de higienização").

        A saída DEVE ser um JSON válido contendo uma lista de objetos.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            desvioPontoMelhoria: { type: Type.STRING, description: 'O "Desvio/Ponto de Melhoria". O nome da sub-tarefa.' },
            origem: { type: Type.STRING, enum: [PlanReason.PLANEJAMENTO_IA] },
            acaoParaMitigacao: { type: Type.STRING, description: 'A "Ação para mitigação". Descrição detalhada da sub-tarefa.' },
            departamentosEnvolvidos: { 
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Os "Departamentos Envolvidos".' 
            },
            responsavel: { type: Type.STRING, enum: validResponsibles },
            pilarEstrategico: { type: Type.STRING, enum: strategicPillars },
            prazo: { type: Type.STRING, description: "Data no formato AAAA-MM-DD" },
            tipo: { type: Type.STRING, enum: Object.values(ActionType) },
            priority: { type: Type.STRING, enum: Object.values(ActionPriority) },
            evidencia: { type: Type.STRING, description: 'A evidência de conclusão.' },
            verificacao: { type: Type.STRING, description: 'A verificação de eficácia.' },
          },
          required: ['desvioPontoMelhoria', 'acaoParaMitigacao', 'departamentosEnvolvidos', 'responsavel', 'prazo', 'origem', 'tipo', 'priority', 'evidencia', 'verificacao', 'pilarEstrategico']
        }
    };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const resultText = response.text;
        if (!resultText) {
            const errorDetails = JSON.stringify(response, null, 2);
            console.error("Unexpected AI response structure in generateSubTasks:", errorDetails);
            throw new Error("A resposta da IA não continha a parte de texto esperada.");
        }

        try {
            const cleanedResult = resultText.trim().replace(/^```json\s*|```\s*$/g, '');
            return JSON.parse(cleanedResult);
        } catch (e) {
            console.error("Failed to parse JSON string from Gemini:", e, "Original string:", resultText);
            throw new Error("A resposta da IA não é um JSON válido.");
        }

    } catch (error) {
        console.error("Error generating sub-tasks with Gemini:", error);
        throw new Error("Ocorreu um erro ao gerar o plano de ação. Por favor, tente novamente.");
    }
};

export const generateSubTasksForAction = async (parentAction: SuggestedActionItem): Promise<SuggestedActionItem[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const today = new Date().toISOString().split('T')[0];
    const parentDeadline = parentAction.prazo ? ` O prazo da tarefa principal é ${parentAction.prazo}, então as sub-tarefas não devem exceder esta data.` : '';

    const prompt = `
        Aja como um gerente de projetos sênior. Sua tarefa é decompor uma ação principal em 1 a 3 sub-tarefas menores, mais detalhadas e acionáveis.

        **AÇÃO PRINCIPAL PARA DECOMPOR:**
        - **Título:** ${parentAction.desvioPontoMelhoria}
        - **Descrição:** ${parentAction.acaoParaMitigacao}
        - **Responsável Principal:** ${parentAction.responsavel}
        - **Pilar Estratégico:** ${parentAction.pilarEstrategico}

        **Sua Missão:**
        Crie de 1 a 3 sub-tarefas que detalhem os passos necessários para completar a ação principal. Cada sub-tarefa deve ser um item de ação completo e independente.

        **Regras de Preenchimento (para cada sub-tarefa):**
        -   **desvioPontoMelhoria:** O nome da sub-tarefa. **REGRA:** O nome DEVE começar com um prefixo que a identifique como sub-tarefa, como "Sub: " ou "Etapa: ". Exemplo: "Sub: Levantar requisitos".
        -   **acaoParaMitigacao:** Descreva as atividades específicas da sub-tarefa.
        -   **origem:** Use o valor fixo: **"${parentAction.origem}"**.
        -   **departamentosEnvolvidos:** Atribua a um ou mais departamentos. Pode ser o mesmo da ação principal.
        -   **responsavel:** Herde o responsável da ação principal ('${parentAction.responsavel}') ou escolha um outro da lista: ${JSON.stringify(validResponsibles)}.
        -   **pilarEstrategico:** Deve ser o mesmo da ação principal: **"${parentAction.pilarEstrategico}"**.
        -   **prazo:** Estime uma data de conclusão realista no formato AAAA-MM-DD. Deve ser **posterior a ${today}**. ${parentDeadline}
        -   **tipo:** Classifique a ação como 'Corretiva', 'Preventiva' ou 'Melhoria'.
        -   **priority:** Classifique a prioridade. Pode ser a mesma da ação principal ou diferente, se apropriado.
        -   **evidencia:** Descreva a "prova" de conclusão para esta sub-tarefa específica.
        -   **verificacao:** Descreva como o sucesso desta sub-tarefa será medido.

        A saída DEVE ser um JSON válido contendo uma lista de objetos.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            desvioPontoMelhoria: { type: Type.STRING, description: 'O "Desvio/Ponto de Melhoria". Um título curto para a sub-tarefa.' },
            origem: { type: Type.STRING, description: 'A origem ou motivo da ação.', enum: Object.values(PlanReason) },
            acaoParaMitigacao: { type: Type.STRING, description: 'A "Ação para mitigação". Descrição detalhada da sub-tarefa.' },
            departamentosEnvolvidos: { 
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Os "Departamentos Envolvidos".' 
            },
            responsavel: { type: Type.STRING, enum: validResponsibles },
            pilarEstrategico: { type: Type.STRING, enum: strategicPillars },
            prazo: { type: Type.STRING, description: "Data no formato AAAA-MM-DD" },
            tipo: { type: Type.STRING, enum: Object.values(ActionType) },
            priority: { type: Type.STRING, enum: Object.values(ActionPriority) },
            evidencia: { type: Type.STRING, description: 'A evidência de conclusão.' },
            verificacao: { type: Type.STRING, description: 'A verificação de eficácia.' },
          },
          required: ['desvioPontoMelhoria', 'acaoParaMitigacao', 'departamentosEnvolvidos', 'responsavel', 'prazo', 'origem', 'tipo', 'priority', 'evidencia', 'verificacao', 'pilarEstrategico']
        }
    };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });
        
        const resultText = response.text;
        if (!resultText) {
            const errorDetails = JSON.stringify(response, null, 2);
            console.error("Unexpected AI response structure in generateSubTasksForAction:", errorDetails);
            throw new Error("A resposta da IA não continha a parte de texto esperada.");
        }
        
        try {
            const cleanedResult = resultText.trim().replace(/^```json\s*|```\s*$/g, '');
            return JSON.parse(cleanedResult);
        } catch (e) {
            console.error("Failed to parse JSON string from Gemini:", e, "Original string:", resultText);
            throw new Error("A resposta da IA não é um JSON válido.");
        }

    } catch (error) {
        console.error("Error generating sub-tasks for action with Gemini:", error);
        throw new Error("Ocorreu um erro ao gerar as sub-tarefas. Por favor, tente novamente.");
    }
};

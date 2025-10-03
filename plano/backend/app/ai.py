# C:\orbent-dev\plano\backend\app\ai.py

import os
import json
import google.generativeai as genai
from .schemas import AIRequest

# 1. ESTA PARTE ESTÁ PERFEITA E CONTINUA IGUAL
API_KEY = os.getenv("GEMINI_API_KEY")

# 2. ADICIONAMOS A CONFIGURAÇÃO DO SDK
if API_KEY:
    genai.configure(api_key=API_KEY)

# 3. ALTERAMOS O CONTEÚDO DA FUNÇÃO PARA USAR A IA
def suggest_actions(req: AIRequest) -> list[dict]:
    """
    Usa a IA do Gemini para sugerir fases de um plano de ação.
    """
    if not API_KEY or not genai.get_model('models/gemini-pro'):
        return [{"title": "Erro de Configuração", "description": "A API Key do Gemini não foi configurada no ambiente."}]

    model = genai.GenerativeModel('gemini-pro')
    base_prompt = (req.prompt or "Criar um plano de marketing digital").strip()
    
    prompt_template = f"""
    Você é um assistente de planejamento estratégico.
    Dado o objetivo a seguir, sugira exatamente 3 fases de alto nível para um plano de ação.
    
    Objetivo: "{base_prompt}"

    Responda em formato JSON, como uma lista de objetos, onde cada objeto tem as chaves "title" e "description".
    Não adicione nenhum texto ou formatação extra antes ou depois do JSON.
    """

    try:
        response = model.generate_content(prompt_template)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(cleaned_response)
        return suggestions

    except Exception as e:
        print(f"Erro ao chamar a API Gemini: {e}")
        return [{"title": "Erro de IA", "description": "Não foi possível gerar sugestões no momento."}]

# 4. ESTAS FUNÇÕES AINDA SÃO PLACEHOLDERS E PRECISAM SER ADAPTADAS DEPOIS
def summarize_plan(plan) -> str:
    # TODO: Implementar a chamada à API do Gemini para resumir
    return f"# Executive Summary – {plan.name}\n\nAções: {len(plan.actions)}. Origem: {plan.origin or 'N/D'}."

def decompose_action(text: str) -> list[dict]:
    # TODO: Implementar a chamada à API do Gemini para decompor a ação
    return [
        {"title": "Quebrar requisitos", "description": "Elencar subitens e dependências."},
        {"title": "Definir prazos", "description": "Estimar esforço e marcos."},
        {"title": "Atribuir responsáveis", "description": "Mapear quem faz o quê."},
    ]
import React from 'react';
import { SearchResultPlan } from '../types';
import { PlanIcon } from './icons/PlanIcon';
import { ListIcon } from './icons/ListIcon';

interface GlobalSearchResultsProps {
  query: string;
  results: SearchResultPlan[];
  onSelectPlan: (planId: number) => void;
  onClear: () => void;
}

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-primary/20 text-secondary px-0 py-0 rounded">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ query, results, onSelectPlan, onClear }) => {
  return (
    <div id="global-search-results" className="p-4 sm:p-6 lg:p-8 animate-slide-in-up">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-secondary">
                Resultados da busca por: <span className="text-primary">"{query}"</span>
            </h1>
            <button onClick={onClear} className="text-sm font-semibold text-primary hover:underline">
                Limpar busca
            </button>
        </div>

        {results.length > 0 ? (
            <div className="space-y-6">
                {results.map(plan => (
                    <div key={plan.id} className="bg-base-100 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200/80">
                        <button onClick={() => onSelectPlan(plan.id)} className="w-full text-left">
                            <div className="flex items-center gap-3">
                                <PlanIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                <div className="flex-grow">
                                    <h2 className="text-lg font-bold text-secondary hover:text-primary transition-colors">
                                        <Highlight text={plan.planName} query={query} />
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        <Highlight text={plan.clientName} query={query} />
                                    </p>
                                </div>
                            </div>
                        </button>

                        {plan.matchingActionItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                {plan.matchingActionItems.map(item => (
                                    <button key={item.id} onClick={() => onSelectPlan(plan.id)} className="w-full text-left p-3 rounded-md hover:bg-neutral transition-colors">
                                        <div className="flex items-start gap-3">
                                             <ListIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                             <div className="flex-grow">
                                                <p className="font-semibold text-secondary"><Highlight text={item.desvioPontoMelhoria} query={query} /></p>
                                                <p className="text-sm text-gray-600 line-clamp-2"><Highlight text={item.acaoParaMitigacao} query={query} /></p>
                                                <div className="text-xs text-gray-500 mt-1 space-x-3">
                                                    <span>Responsável: <Highlight text={item.responsavel} query={query} /></span>
                                                    <span>Status: <Highlight text={item.status} query={query} /></span>
                                                </div>
                                             </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-base-100 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-secondary">Nenhum resultado encontrado.</h2>
                <p className="text-gray-500 mt-2">Tente usar palavras-chave diferentes na sua busca.</p>
            </div>
        )}
    </div>
  );
};
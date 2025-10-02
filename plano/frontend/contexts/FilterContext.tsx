import React, { createContext, useState, useMemo, useContext, ReactNode } from 'react';
import { ActionItem } from '../types';

interface FilterState {
    departamentoFiltro: string;
    statusFiltro: string;
    tipoFiltro: string;
    tagFiltro: string;
    priorityFiltro: string;
    pilarEstrategicoFiltro: string;
}

interface FilterSetters {
    setDepartamentoFiltro: (value: string) => void;
    setStatusFiltro: (value: string) => void;
    setTipoFiltro: (value: string) => void;
    setTagFiltro: (value: string) => void;
    setPriorityFiltro: (value: string) => void;
    setPilarEstrategicoFiltro: (value: string) => void;
}

interface FilterData {
    filteredActionItems: ActionItem[];
    filterOptions: {
        departamentos: string[];
        allTags: string[];
        pilaresEstrategicos: string[];
    };
}

interface FilterContextType {
    filters: FilterState;
    setFilters: FilterSetters;
    data: FilterData;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};

interface FilterProviderProps {
    allActionItems: ActionItem[];
    children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ allActionItems, children }) => {
    const [departamentoFiltro, setDepartamentoFiltro] = useState('Todos');
    const [statusFiltro, setStatusFiltro] = useState('Todos');
    const [tipoFiltro, setTipoFiltro] = useState('Todos');
    const [tagFiltro, setTagFiltro] = useState('Todos');
    const [priorityFiltro, setPriorityFiltro] = useState('Todos');
    const [pilarEstrategicoFiltro, setPilarEstrategicoFiltro] = useState('Todos');

    const filterOptions = useMemo(() => {
        const allTags = ['Todos', ...Array.from(new Set(allActionItems.flatMap(item => item.tags || []))).sort()];
        const departamentos = ['Todos', ...Array.from(new Set(allActionItems.flatMap(item => item.departamentosEnvolvidos))).sort()];
        const pilaresEstrategicos = ['Todos', ...Array.from(new Set(allActionItems.map(item => item.pilarEstrategico))).sort()];
        return { allTags, departamentos, pilaresEstrategicos };
    }, [allActionItems]);

    const filteredActionItems = useMemo(() => {
        return allActionItems.filter(item => {
            const depMatch = departamentoFiltro === 'Todos' || item.departamentosEnvolvidos.includes(departamentoFiltro);
            const statusMatch = statusFiltro === 'Todos' || item.status === statusFiltro;
            const tipoMatch = tipoFiltro === 'Todos' || item.tipo === tipoFiltro;
            const tagMatch = tagFiltro === 'Todos' || (item.tags && item.tags.includes(tagFiltro));
            const priorityMatch = priorityFiltro === 'Todos' || item.priority === priorityFiltro;
            const pilarMatch = pilarEstrategicoFiltro === 'Todos' || item.pilarEstrategico === pilarEstrategicoFiltro;
            return depMatch && statusMatch && tipoMatch && tagMatch && priorityMatch && pilarMatch;
        });
    }, [allActionItems, departamentoFiltro, statusFiltro, tipoFiltro, tagFiltro, priorityFiltro, pilarEstrategicoFiltro]);

    const value = {
        filters: { departamentoFiltro, statusFiltro, tipoFiltro, tagFiltro, priorityFiltro, pilarEstrategicoFiltro },
        setFilters: { setDepartamentoFiltro, setStatusFiltro, setTipoFiltro, setTagFiltro, setPriorityFiltro, setPilarEstrategicoFiltro },
        data: { filteredActionItems, filterOptions }
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

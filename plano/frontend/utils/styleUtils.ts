import { ActionItem, ActionStatus, ActionPriority, ActionType } from '../types';
import { parseAsUTC } from './dateUtils';

// ==================================
// STATUS LOGIC & STYLES
// ==================================

const STATUS_CONFIG: { [key in ActionStatus]: { label: string; color: string; } } = {
    [ActionStatus.PENDENTE]: { label: 'Pendente', color: '#94a3b8' },
    [ActionStatus.EXECUCAO_CONTINUA]: { label: 'Execução contínua monitorada', color: '#64748b' },
    [ActionStatus.ACOES_REFORCADAS]: { label: 'Ações reforçadas e em expansão', color: '#8b5cf6' },
    [ActionStatus.PROCESSOS_INTENSIFICADOS]: { label: 'Processos intensificados e otimizados', color: '#f59e0b' },
    [ActionStatus.AJUSTADAS_EM_EXECUCAO]: { label: 'Ajustadas e em plena execução', color: '#3b82f6' },
    [ActionStatus.REFORCO_EM_EXECUCAO]: { label: 'Reforço em execução com monitoramento ativo', color: '#0ea5e9' },
    [ActionStatus.CONCLUIDO]: { label: 'Concluída', color: '#22c55e' },
};

const OVERDUE_STATUS = { label: 'Em Atraso', color: '#ef4444' };

/**
 * Gets the display properties (label, color, className) for a given ActionItem.
 * It includes logic to dynamically determine if an item is overdue.
 */
export const getDisplayStatus = (item: ActionItem): { label: string; color: string; bgClass: string; textClass: string; borderClass: string; } => {
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const prazoUTC = parseAsUTC(item.prazo);
    
    if (item.status === ActionStatus.CONCLUIDO) {
        const config = STATUS_CONFIG[ActionStatus.CONCLUIDO];
        return { 
            label: config.label, 
            color: config.color,
            bgClass: `bg-status-concluida/10`,
            textClass: `text-status-concluida`,
            borderClass: `border-status-concluida/20`,
        };
    }
    
    // Check for invalid date before comparing
    if (!isNaN(prazoUTC.getTime()) && prazoUTC < todayUTC) {
        return { 
            label: OVERDUE_STATUS.label, 
            color: OVERDUE_STATUS.color,
            bgClass: `bg-status-em-atraso/10`,
            textClass: `text-status-em-atraso`,
            borderClass: `border-status-em-atraso/20`,
        };
    }

    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG[ActionStatus.EXECUCAO_CONTINUA];
     return { 
        label: config.label, 
        color: config.color,
        bgClass: `bg-neutral-200`,
        textClass: `text-neutral-800`,
        borderClass: `border-neutral-300`,
    };
};

/**
 * Provides the complete color map for dashboard charts, including the overdue status.
 */
export const STATUS_CHART_COLORS: { [key: string]: string } = {
    ...Object.fromEntries(Object.values(ActionStatus).map(s => [STATUS_CONFIG[s].label, STATUS_CONFIG[s].color])),
    [OVERDUE_STATUS.label]: OVERDUE_STATUS.color,
};


// ==================================
// PRIORITY LOGIC & STYLES
// ==================================

const PRIORITY_CONFIG: { [key in ActionPriority]: { color: string; bgClass: string; textClass: string; borderClass: string; } } = {
    [ActionPriority.ALTA]: { color: '#de350b', bgClass: 'bg-error/10', textClass: 'text-error', borderClass: 'border-error/20' },
    [ActionPriority.MEDIA]: { color: '#ffab00', bgClass: 'bg-warning/10', textClass: 'text-warning', borderClass: 'border-warning/20' },
    [ActionPriority.BAIXA]: { color: '#00875a', bgClass: 'bg-success/10', textClass: 'text-success', borderClass: 'border-success/20' },
};

/**
 * Gets the style classes for a given priority.
 */
export const getPriorityStyles = (priority: ActionPriority) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[ActionPriority.MEDIA];
};

/**
 * Provides the complete color map for priority charts.
 */
export const PRIORITY_CHART_COLORS: { [key in ActionPriority]: string } = {
    [ActionPriority.ALTA]: PRIORITY_CONFIG[ActionPriority.ALTA].color,
    [ActionPriority.MEDIA]: PRIORITY_CONFIG[ActionPriority.MEDIA].color,
    [ActionPriority.BAIXA]: PRIORITY_CONFIG[ActionPriority.BAIXA].color,
};

// ==================================
// ACTION TYPE LOGIC & STYLES
// ==================================

/**
 * Provides the complete color map for action type charts.
 */
export const TYPE_COLORS: { [key in ActionType]: string } = {
    [ActionType.MELHORIA]: '#0052cc',
    [ActionType.CORRETIVA]: '#de350b',
    [ActionType.PREVENTIVA]: '#ffab00',
};
import React, { useMemo } from 'react';
import { ActionItem, ActionStatus } from '../types';
import { getDisplayStatus } from '../utils/styleUtils';
import { parseAsUTC, safeFormatDate } from '../utils/dateUtils';

const dayDiff = (date1: Date, date2: Date): number => {
  // Dates are already UTC, no need to normalize further
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

const getMonthMarkers = (startDate: Date, endDate: Date) => {
    const markers = [];
    const totalDays = dayDiff(startDate, endDate);
    if (totalDays <= 0) return [];

    let current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));

    while (current <= endDate) {
        const monthName = current.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
        const year = current.getUTCFullYear();

        const monthStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
        const monthEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0));

        // Clip the start and end to the timeline boundaries
        const effectiveStart = monthStart < startDate ? startDate : monthStart;
        const effectiveEnd = monthEnd > endDate ? endDate : monthEnd;

        if (effectiveStart > effectiveEnd) {
            current.setUTCMonth(current.getUTCMonth() + 1);
            continue;
        }

        const offsetDays = dayDiff(startDate, effectiveStart);
        const durationDays = dayDiff(effectiveStart, effectiveEnd) + 1; // inclusive

        const offsetPercent = (offsetDays / totalDays) * 100;
        const widthPercent = (durationDays / totalDays) * 100;

        if (widthPercent > 0) {
             markers.push({
                label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} '${String(year).slice(2)}`,
                offset: `${offsetPercent}%`,
                width: `${widthPercent}%`,
            });
        }
       
        current.setUTCMonth(current.getUTCMonth() + 1);
    }
    return markers;
};

// Map color from style utils to a background class
const colorToBgClass: { [key: string]: string } = {
    '#94a3b8': 'bg-status-pendente',
    '#6b7280': 'bg-status-execucao-continua',
    '#7c3aed': 'bg-status-reforcadas-expansao',
    '#f59e0b': 'bg-status-intensificadas-otimizadas',
    '#1f6feb': 'bg-status-ajustadas-execucao',
    '#0ea5e9': 'bg-status-reforco-monitorado',
    '#2da44e': 'bg-status-concluida',
    '#ef4444': 'bg-status-em-atraso'
};

export const GanttChart: React.FC<{ actionItems: ActionItem[] }> = ({ actionItems }) => {
  const sortedItems = useMemo(() => {
    if (!actionItems) return [];
    return [...actionItems]
      .filter(item => !isNaN(parseAsUTC(item.prazo).getTime())) // Filter out invalid dates
      .sort((a, b) => parseAsUTC(a.prazo).getTime() - parseAsUTC(b.prazo).getTime());
  }, [actionItems]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    if (sortedItems.length === 0) {
      const today = new Date();
      const startDateUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      const endDateUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
      return { startDate: startDateUTC, endDate: endDateUTC, totalDays: dayDiff(startDateUTC, endDateUTC) };
    }
    
    const firstPrazo = parseAsUTC(sortedItems[0].prazo);
    const startDate = new Date(Date.UTC(firstPrazo.getUTCFullYear(), firstPrazo.getUTCMonth(), 1));

    const lastPrazo = parseAsUTC(sortedItems[sortedItems.length - 1].prazo);
    const endDate = new Date(Date.UTC(lastPrazo.getUTCFullYear(), lastPrazo.getUTCMonth() + 1, 0));
    endDate.setUTCDate(endDate.getUTCDate() + 5);

    const days = dayDiff(startDate, endDate);
    return { startDate, endDate, totalDays: days <= 0 ? 1 : days };
  }, [sortedItems]);
  
  const monthMarkers = useMemo(() => getMonthMarkers(startDate, endDate), [startDate, endDate]);

  if (sortedItems.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Nenhuma ação com data válida para exibir.</div>;
  }

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden text-xs">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 z-10 pr-[17px]">
             <div className="flex border-b border-gray-200">
                <div className="w-1/3 flex-shrink-0 border-r border-gray-200 p-2 font-semibold text-secondary">Ação</div>
                <div className="w-2/3 flex-shrink-0 relative h-8">
                     {monthMarkers.map((marker, index) => (
                        <div key={index} style={{ left: marker.offset, width: marker.width }} className="absolute h-full flex items-center justify-center border-r border-gray-200 last:border-r-0">
                            <span className="text-gray-500 font-medium">{marker.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-gray-200">
            {sortedItems.map((item) => {
                const itemDeadline = parseAsUTC(item.prazo);
                if (isNaN(itemDeadline.getTime())) return null; // Should be filtered, but as a safeguard

                // Calculate position relative to the chart's timeline.
                // Each action is a milestone, so its position is based on its deadline.
                const offsetDays = dayDiff(startDate, itemDeadline);
                
                // Represent the milestone with a fixed duration for visibility.
                const milestoneDurationDays = 1;

                const leftPercent = (offsetDays / totalDays) * 100;
                const widthPercent = (milestoneDurationDays / totalDays) * 100;
                
                // Clamp values to ensure they stay within the visible timeline area.
                const left = Math.max(0, leftPercent);
                const width = Math.min(widthPercent, 100 - left);

                if (left > 100 || totalDays <= 0) return null; // Don't render bars that are off-screen

                const { color: statusColor, label: statusLabel } = getDisplayStatus(item);
                const barColorClass = colorToBgClass[statusColor] || 'bg-gray-400';
                const isPendente = item.status === ActionStatus.PENDENTE;

                const formattedDeadline = safeFormatDate(item.prazo);

                const tooltipText = `Ação: ${item.desvioPontoMelhoria}\nPrazo: ${formattedDeadline}\nStatus: ${statusLabel}\nResponsável: ${item.responsavel}`;

                return (
                    <div key={item.id} className="flex hover:bg-neutral/50 min-h-[33px]">
                        <div className="w-1/3 flex-shrink-0 border-r border-gray-200 p-2 truncate flex items-center" title={item.desvioPontoMelhoria}>
                            {item.desvioPontoMelhoria}
                        </div>
                        <div className="w-2/3 flex-shrink-0 relative flex items-center p-1">
                             <div 
                                style={{ 
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    minWidth: '3px' // Ensure even small bars are visible
                                }} 
                                className={`absolute h-4 rounded ${barColorClass} transition-all duration-300 group`}
                                title={tooltipText}
                             >
                                {!isPendente && <div className="h-full w-full bg-black/10 rounded"></div>}
                             </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
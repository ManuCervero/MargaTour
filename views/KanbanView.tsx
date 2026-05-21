import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { BOT_KANBAN_COLUMNS, HUMAN_KANBAN_COLUMNS } from '../constants';
import { LeadCard } from '../components/LeadCard';
import { Bot, User, Layers } from 'lucide-react';

interface KanbanViewProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onToggleBot: (leadId: string, isBot: boolean) => void;
    onHandoff: (leadId: string) => void;
    onMarkCold: (leadId: string) => void;
    onConfirmBot: (leadId: string) => void;
    onConfirmHuman: (leadId: string) => void;
}

type FilterMode = 'AUTO' | 'HUMANO' | 'TODOS';

export const KanbanView: React.FC<KanbanViewProps> = ({
    leads,
    onLeadClick,
    onToggleBot,
    onHandoff,
    onMarkCold,
    onConfirmBot,
    onConfirmHuman
}) => {
    const [filterMode, setFilterMode] = useState<FilterMode>('AUTO');

    // Determine Columns based on filter
    let columns;
    if (filterMode === 'AUTO') {
        columns = BOT_KANBAN_COLUMNS;
    } else if (filterMode === 'HUMANO') {
        columns = HUMAN_KANBAN_COLUMNS;
    } else {
        // TODOS: Combine columns, deduplicating by id to avoid duplicate CANCELADO
        const allCols = [...BOT_KANBAN_COLUMNS, ...HUMAN_KANBAN_COLUMNS];
        const seen = new Set<string>();
        columns = allCols.filter(col => {
            if (seen.has(col.id)) return false;
            seen.add(col.id);
            return true;
        });
    }

    // Filter leads based on active tab
    const filteredLeads = leads.filter(l => {
        if (filterMode === 'AUTO') return l.isBotActive;
        if (filterMode === 'HUMANO') return !l.isBotActive;
        return true; // TODOS
    });

    return (
        <div className="h-full flex flex-col min-w-0 min-h-0">
            {/* Quick Filter Bar */}
            <div className="px-6 pb-2 pt-2 flex items-center justify-between border-b border-gray-100 bg-white">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilterMode('AUTO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${filterMode === 'AUTO'
                            ? 'bg-white text-marga-violet shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <Bot size={14} />
                        Modo: AUTO
                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded-full text-[10px] border border-gray-200 ml-1">
                            {leads.filter(l => l.isBotActive).length}
                        </span>
                    </button>

                    <button
                        onClick={() => setFilterMode('HUMANO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${filterMode === 'HUMANO'
                            ? 'bg-white text-marga-text shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <User size={14} />
                        Modo: HUMANO
                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded-full text-[10px] border border-gray-200 ml-1">
                            {leads.filter(l => !l.isBotActive).length}
                        </span>
                    </button>

                    <button
                        onClick={() => setFilterMode('TODOS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${filterMode === 'TODOS'
                            ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                    >
                        <Layers size={14} />
                        Todos
                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded-full text-[10px] border border-gray-200 ml-1">
                            {leads.length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 bg-gray-50/50">
                <div className="flex h-full gap-4 px-6 pb-4 min-w-[max-content]">
                    {columns.map((col) => {
                        const colLeads = filteredLeads.filter((l) => l.status === col.id);

                        return (
                            <div key={col.id} className="w-80 flex flex-col h-full group">
                                {/* Column Header */}
                                <div className="mb-4 px-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-extrabold text-gray-700 text-sm tracking-tight uppercase">{col.title}</h3>
                                        <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {colLeads.length}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium leading-tight h-8 line-clamp-2">
                                        {col.description}
                                    </p>
                                </div>

                                {/* Drop Zone */}
                                <div className="flex-1 bg-gray-100 rounded-xl p-2 overflow-y-auto border border-gray-200 shadow-inner">
                                    {colLeads.map((lead) => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onClick={onLeadClick}
                                            onToggleBot={onToggleBot}
                                            onHandoff={onHandoff}
                                            onMarkCold={onMarkCold}
                                            onConfirmBot={onConfirmBot}
                                            onConfirmHuman={onConfirmHuman}
                                        />
                                    ))}
                                    {colLeads.length === 0 && (
                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl m-2 opacity-50">
                                            <span className="text-xs text-gray-400 font-medium">Vacío</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
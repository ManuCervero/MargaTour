import React from 'react';
import { Lead, LeadPriority, ServiceType, LeadStatus } from '../types';
import { BotToggle } from './BotToggle';
import { Phone, Clock, MessageSquare, AlertCircle, ArrowRightCircle, Snowflake, Bot, User, Lock } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onToggleBot: (leadId: string, isBot: boolean) => void;
  onHandoff?: (leadId: string) => void;
  onMarkCold?: (leadId: string) => void;
  onConfirmBot?: (leadId: string) => void;
  onConfirmHuman?: (leadId: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, onToggleBot, onHandoff, onMarkCold, onConfirmBot, onConfirmHuman }) => {
  
  const getPriorityColor = (p: LeadPriority) => {
    switch (p) {
      case LeadPriority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case LeadPriority.MEDIUM: return 'bg-orange-100 text-orange-700 border-orange-200';
      case LeadPriority.LOW: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-marga-creamDark text-marga-dark/60';
    }
  };

  const getTypeColor = (t: ServiceType) => {
      switch(t) {
          case ServiceType.TRANSFER: return 'text-blue-600 bg-blue-50';
          case ServiceType.RUTA: return 'text-marga-wine bg-marga-cream';
          case ServiceType.SERVICIO: return 'text-teal-600 bg-teal-50';
          default: return 'text-gray-600 bg-gray-50';
      }
  }
  
  // STRICT CONDITION: Blocking state only if flagged pending, is in NUEVO, and is currently in Bot mode
  const isBlockingState = lead.pendingDecision && lead.status === LeadStatus.NUEVO && lead.isBotActive;

  // Show standard Handoff actions only if NOT blocking and IS bot
  const showHandoffActions = lead.isBotActive && !isBlockingState;

  // Border logic: Orange if blocked, else standard
  const cardBorderClass = isBlockingState 
    ? 'border-orange-300 ring-2 ring-orange-100 shadow-md' 
    : 'border-marga-creamDark';

  return (
    <div 
      onClick={() => onClick(lead)}
      className={`bg-white p-3 rounded-2xl shadow-sm border hover:shadow-md transition-all cursor-pointer group mb-3 relative overflow-hidden ${cardBorderClass}`}
    >
        {/* Accent Bar on Left based on Type */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
            lead.type === ServiceType.TRANSFER ? 'bg-blue-400' : 
            lead.type === ServiceType.RUTA ? 'bg-marga-rose' : 'bg-marga-creamDark'
        }`}></div>

      <div className="pl-2">
        {/* Header: Priority & Mode Badge */}
        <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${getPriorityColor(lead.priority)}`}>
                    {lead.priority}
                </span>
                
                {/* Mode Indicator: Shown if NOT blocking. If blocking, the banner below explains the state. */}
                {!isBlockingState && (
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${
                        lead.isBotActive 
                        ? 'bg-marga-wine text-white border-marga-wine' 
                        : 'bg-marga-wine text-marga-cream border-marga-yellow'
                    }`}>
                        Modo: {lead.isBotActive ? 'AUTO' : 'HUMANO'}
                    </span>
                )}
                
                {/* Lock icon for blocking state visual cue */}
                {isBlockingState && (
                     <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1">
                        <Lock size={8} />
                        Pendiente
                    </span>
                )}
            </div>
        </div>
        
        {/* BLOCKING BANNER: Only shown in NUEVO + Pending */}
        {isBlockingState && (
            <div className="mb-3 bg-orange-50 border border-orange-200 rounded-md p-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                     <AlertCircle size={14} className="text-orange-600 shrink-0" />
                     <p className="text-[11px] font-bold text-orange-800 leading-tight">Contacto conocido</p>
                </div>
                <p className="text-[10px] text-orange-700 leading-tight pl-0.5 font-medium">
                    Elegir quién responde para continuar.
                </p>
            </div>
        )}

        {/* Lead Info */}
        <div className="mb-2 mt-1">
            {lead.name ? (
                <h3 className="font-bold text-gray-800 text-sm">{lead.name}</h3>
            ) : (
                <span className="text-xs text-gray-400 italic">Sin nombre</span>
            )}
            <div className="flex items-center text-gray-500 text-xs mt-0.5">
                <Phone size={12} className="mr-1" />
                <span>{lead.phone}</span>
            </div>
             <div className="flex items-center text-gray-400 text-xs gap-1 mt-1">
                <Clock size={12} />
                <span>{lead.lastActivity}</span>
            </div>
        </div>

        {/* Status Badges */}
        {lead.isBotActive && lead.status === LeadStatus.INTERESADO && !isBlockingState && (
            <div className="mb-3">
                <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 font-bold border border-red-100 w-fit">
                    <AlertCircle size={10} />
                    Handoff pendiente
                </span>
            </div>
        )}

        {/* Service Type Badge */}
        <div className="mb-3">
             <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${getTypeColor(lead.type)}`}>
                {lead.type}
            </span>
        </div>

        {/* Message Preview */}
        <div className="bg-gray-50 p-2 rounded-lg mb-3 border border-marga-creamDark">
            <div className="flex items-start gap-1">
                <MessageSquare size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {lead.lastMessage}
                </p>
            </div>
        </div>

        {/* Actions Area */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            
            {/* 1. BLOCKING DECISION BUTTONS */}
            {isBlockingState && onConfirmBot && onConfirmHuman ? (
                <div className="space-y-2 mt-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onConfirmBot(lead.id); }}
                        className="w-full py-2.5 bg-marga-wine hover:bg-marga-wineLight text-white rounded-lg shadow-md flex items-center justify-center gap-2 transition-all border border-transparent active:scale-95 group/bot"
                    >
                        <Bot size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">Responder con BOT</span>
                    </button>
                    <button 
                         onClick={(e) => { e.stopPropagation(); onConfirmHuman(lead.id); }}
                        className="w-full py-2.5 bg-marga-wine hover:bg-marga-wineLight text-marga-cream rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all border border-marga-wine/30 active:scale-95"
                    >
                        <User size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">Responder HUMANO</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* 2. STANDARD BOT ACTIONS (Only if bot active and decision made) */}
                    {showHandoffActions && onHandoff && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onHandoff(lead.id); }}
                            className="w-full py-2 bg-marga-wine hover:bg-marga-wineLight text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors group/btn mb-3"
                        >
                            <span className="text-xs font-bold">Pasar a Humano</span>
                            <ArrowRightCircle size={14} className="group-hover/btn:translate-x-0.5 transition-transform"/>
                        </button>
                    )}

                    <div className="flex items-center justify-between min-h-[32px]">
                        {/* Secondary Action for BOT leads */}
                        {showHandoffActions && onMarkCold ? (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onMarkCold(lead.id); }}
                                className="text-[10px] text-gray-400 hover:text-marga-wine hover:bg-marga-creamDark px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <Snowflake size={12} />
                                Marcar frío
                            </button>
                        ) : <div></div>}

                        {/* 3. BOT TOGGLE (Hidden in Human Mode) */}
                        {lead.isBotActive && (
                            <BotToggle 
                                isBotActive={lead.isBotActive} 
                                onChange={(val) => onToggleBot(lead.id, val)}
                                size="sm"
                                readOnly={lead.isBotActive} // Usually just a visual indicator in card
                                disabled={!lead.isBotActive}
                                tooltip={"Modo Automático Activo"}
                            />
                        )}
                        {/* In Human Mode (isBotActive=false), BotToggle is hidden because of the condition above, and no other actions are shown by default. The badge at top indicates Mode: HUMANO. */}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
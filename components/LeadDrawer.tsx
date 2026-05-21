import React from 'react';
import { Lead } from '../types';
import { BotToggle } from './BotToggle';
import { X, Phone, User, MapPin, Calendar, FileText, Send, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onToggleBot: (leadId: string, isBot: boolean) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose, onToggleBot }) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {lead.name || 'Nuevo Lead'}
              <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {lead.status}
              </span>
            </h2>
            <div className="flex items-center text-gray-500 mt-1">
              <Phone size={14} className="mr-1" />
              <span className="text-sm font-mono">{lead.phone}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Bot Control Section - High Visibility */}
          <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-marga-yellow/30 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Modo de Respuesta</span>
            <BotToggle isBotActive={lead.isBotActive} onChange={(val) => onToggleBot(lead.id, val)} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 bg-marga-violet text-white py-2.5 px-4 rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-sm text-sm">
                <FileText size={16} />
                Crear Cotización
            </button>
             <button className="flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 px-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-sm text-sm">
                <Send size={16} />
                WhatsApp
            </button>
          </div>
          
           <div className="grid grid-cols-3 gap-2 mb-6">
            <button className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors text-xs text-gray-600">
                <CheckCircle size={16} className="text-green-500 mb-1"/>
                Aprobado
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors text-xs text-gray-600">
                <XCircle size={16} className="text-red-500 mb-1"/>
                Cancelado
            </button>
            <button className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors text-xs text-gray-600">
                <ArrowRight size={16} className="text-blue-500 mb-1"/>
                Handoff
            </button>
           </div>


          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                <User className="text-gray-400 mt-1" size={18} />
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Tipo de Cliente</p>
                    <p className="text-sm text-gray-700 font-medium">Turista Internacional</p>
                </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                <MapPin className="text-gray-400 mt-1" size={18} />
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Interés</p>
                    <p className="text-sm text-gray-700 font-medium">{lead.type}</p>
                </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                <Calendar className="text-gray-400 mt-1" size={18} />
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Actividad Reciente</p>
                    <p className="text-sm text-gray-700 font-medium">{lead.lastActivity}</p>
                </div>
            </div>
          </div>

          {/* Timeline Placeholder */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Últimos Mensajes</h3>
            <div className="space-y-4">
                {lead.messageHistory && lead.messageHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender !== 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                            msg.sender === 'user' 
                            ? 'bg-gray-100 text-gray-700 rounded-bl-none' 
                            : 'bg-marga-violetLight text-violet-900 rounded-br-none'
                        }`}>
                            <p>{msg.text}</p>
                            <p className="text-[10px] opacity-60 text-right mt-1">{msg.timestamp}</p>
                        </div>
                    </div>
                ))}
                {!lead.messageHistory && (
                    <p className="text-sm text-gray-500 italic">No hay historial disponible.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
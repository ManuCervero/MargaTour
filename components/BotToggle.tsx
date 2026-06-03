import React from 'react';
import { Bot, User } from 'lucide-react';

interface BotToggleProps {
  isBotActive: boolean;
  onChange: (isBot: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  readOnly?: boolean;
  tooltip?: string;
}

export const BotToggle: React.FC<BotToggleProps> = ({ 
  isBotActive, 
  onChange, 
  size = 'md', 
  disabled = false,
  readOnly = false,
  tooltip 
}) => {
  const heightClass = size === 'sm' ? 'h-7 text-xs' : 'h-9 text-sm';
  const iconSize = size === 'sm' ? 14 : 16;
  const defaultTooltip = disabled ? "Este lead ya está en manos del representante" : "";
  const finalTooltip = tooltip || defaultTooltip;

  // Disabled state: Grayscale, opacity, no interaction
  if (disabled) {
    return (
      <div 
        className={`flex bg-gray-100 rounded-lg p-1 ${heightClass} w-fit opacity-60 cursor-not-allowed grayscale`}
        title={finalTooltip}
      >
        <div className={`flex items-center gap-1 px-3 rounded-md font-bold text-gray-400`}>
          <Bot size={iconSize} />
          <span>AUTO</span>
        </div>
        <div className={`flex items-center gap-1 px-3 rounded-md font-bold bg-gray-200 text-gray-500 shadow-sm`}>
          <User size={iconSize} />
          <span>HUMANO</span>
        </div>
      </div>
    );
  }

  // ReadOnly state: Colors preserved, but no interaction
  if (readOnly) {
     return (
        <div 
            className={`flex bg-gray-200 rounded-lg p-1 ${heightClass} w-fit shadow-inner cursor-default`}
            title={finalTooltip}
        >
          <div className={`flex items-center gap-1 px-3 rounded-md transition-all duration-200 font-bold ${
            isBotActive
                ? 'bg-marga-wine text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <Bot size={iconSize} />
            <span>AUTO</span>
          </div>
          <div className={`flex items-center gap-1 px-3 rounded-md transition-all duration-200 font-bold ${
            !isBotActive
                ? 'bg-marga-wine text-marga-cream shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <User size={iconSize} />
            <span>HUMANO</span>
          </div>
        </div>
      );
  }

  // Interactive state
  return (
    <div className={`flex bg-gray-200 rounded-lg p-1 ${heightClass} w-fit shadow-inner`} title={finalTooltip}>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(true); }}
        className={`flex items-center gap-1 px-3 rounded-md transition-all duration-200 font-bold ${
          isBotActive
            ? 'bg-marga-wine text-white shadow-sm'
            : 'text-gray-500 hover:text-marga-wine'
        }`}
      >
        <Bot size={iconSize} />
        <span>AUTO</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(false); }}
        className={`flex items-center gap-1 px-3 rounded-md transition-all duration-200 font-bold ${
          !isBotActive
            ? 'bg-marga-wine text-marga-cream shadow-sm'
            : 'text-gray-500 hover:text-marga-wine'
        }`}
      >
        <User size={iconSize} />
        <span>HUMANO</span>
      </button>
    </div>
  );
};
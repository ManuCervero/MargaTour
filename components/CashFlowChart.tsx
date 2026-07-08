import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CashFlowMovement } from '../types';

const fmtUSD = (n: number) =>
    `USD ${(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
}

function bucketMovements(movements: CashFlowMovement[], year: number, month: number) {
    const weeks = Math.ceil(daysInMonth(year, month) / 7);
    const buckets = Array.from({ length: weeks }, (_, i) => ({ week: i + 1, ingresos: 0, egresos: 0 }));
    for (const m of movements) {
        const day = parseInt(m.date.slice(8, 10), 10);
        if (!day) continue;
        const idx = Math.min(Math.ceil(day / 7), weeks) - 1;
        if (m.type === 'egreso') buckets[idx].egresos += m.amount_usd || 0;
        else buckets[idx].ingresos += m.amount_usd || 0;
    }
    return buckets;
}

export const CashFlowChart: React.FC<{ movements: CashFlowMovement[]; year: number; month: number }> = ({ movements, year, month }) => {
    const buckets = bucketMovements(movements, year, month);
    const totalIngresos = buckets.reduce((s, b) => s + b.ingresos, 0);
    const totalEgresos = buckets.reduce((s, b) => s + b.egresos, 0);
    const maxVal = Math.max(...buckets.map(b => Math.max(b.ingresos, b.egresos)), 0);
    const scale = maxVal > 0 ? maxVal * 1.15 : 1;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-marga-creamDark p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-marga-dark">
                        <span className="w-3 h-3 rounded-sm bg-green-700 inline-block" />
                        <TrendingUp size={14} className="text-green-700" />
                        Ingresos <span className="text-marga-dark/40 font-mono font-normal">{fmtUSD(totalIngresos)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-marga-dark">
                        <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                        <TrendingDown size={14} className="text-red-600" />
                        Egresos <span className="text-marga-dark/40 font-mono font-normal">{fmtUSD(totalEgresos)}</span>
                    </span>
                </div>
                <span className="text-xs text-marga-dark/40">Semana = días 1–7, 8–14, ...</span>
            </div>

            {maxVal === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Sin movimientos este mes.</p>
            ) : (
                <div className="flex items-end justify-around gap-4 h-48">
                    {buckets.map(b => (
                        <div key={b.week} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                            <div className="flex items-end gap-2 h-40">
                                <div className="flex flex-col items-center justify-end h-full" title={`Ingresos Semana ${b.week}: ${fmtUSD(b.ingresos)}`}>
                                    {b.ingresos > 0 && <span className="text-[10px] text-marga-dark/50 font-mono mb-1">{fmtUSD(b.ingresos)}</span>}
                                    <div
                                        className="w-6 sm:w-8 bg-green-700 rounded-t-md min-h-[2px] transition-all"
                                        style={{ height: `${Math.max((b.ingresos / scale) * 100, b.ingresos > 0 ? 2 : 0)}%` }}
                                    />
                                </div>
                                <div className="flex flex-col items-center justify-end h-full" title={`Egresos Semana ${b.week}: ${fmtUSD(b.egresos)}`}>
                                    {b.egresos > 0 && <span className="text-[10px] text-marga-dark/50 font-mono mb-1">{fmtUSD(b.egresos)}</span>}
                                    <div
                                        className="w-6 sm:w-8 bg-red-600 rounded-t-md min-h-[2px] transition-all"
                                        style={{ height: `${Math.max((b.egresos / scale) * 100, b.egresos > 0 ? 2 : 0)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-marga-dark/50">Sem {b.week}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

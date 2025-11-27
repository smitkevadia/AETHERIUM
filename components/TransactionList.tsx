import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Filter, ChevronRight, Activity } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const TransactionList: React.FC<Props> = ({ transactions }) => {
  const [filter, setFilter] = useState('ALL');

  const filtered = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.category === filter;
  });

  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  return (
    <div className="flex flex-col h-full bg-slate-950/20 rounded-lg p-2">
      {/* Sci-Fi Filter Interface */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2">
            <div className="flex items-center gap-2 text-cyan-500 text-xs font-mono uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Protocols</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
                {filtered.length} RECORDS FOUND
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('ALL')}
            className={`
              relative group overflow-hidden px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 clip-path-slant
              ${filter === 'ALL' 
                ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-r-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-900/50 text-slate-500 hover:text-cyan-200 border-l border-slate-700 hover:border-cyan-500/50'}
            `}
          >
            <span className="relative z-10 flex items-center gap-1">
                {filter === 'ALL' && <Activity className="w-3 h-3" />}
                ALL DATA
            </span>
            {filter === 'ALL' && <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>}
          </button>
          
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                relative px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 clip-path-slant
                ${filter === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Data Stream Table */}
      <div className="flex-1 overflow-y-auto pr-1 max-h-[400px] rounded relative custom-scrollbar">
         {/* Grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[length:100%_24px] pointer-events-none"></div>

        <table className="w-full text-left text-sm border-collapse relative z-10">
          <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-20 text-[10px] uppercase tracking-wider text-cyan-600 border-b border-cyan-900/50 shadow-lg">
            <tr>
              <th className="p-3 font-medium">Timestamp</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 font-medium">Class</th>
              <th className="p-3 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {filtered.map((t, i) => (
              <tr key={i} className="hover:bg-cyan-500/5 transition-all duration-200 group relative">
                <td className="p-3 text-slate-500 font-mono text-xs whitespace-nowrap group-hover:text-cyan-400/70 transition-colors">
                    {t.date}
                </td>
                <td className="p-3">
                    <div className="text-slate-300 font-medium group-hover:text-white transition-colors text-xs truncate max-w-[140px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {t.description}
                    </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-none text-[9px] bg-slate-800/80 border-l border-slate-600 text-slate-400 uppercase tracking-wide group-hover:border-cyan-500/50 group-hover:text-cyan-200 transition-colors">
                    {t.category}
                  </span>
                </td>
                <td className={`p-3 text-right font-mono font-bold text-xs ${t.type === TransactionType.INCOME ? 'text-emerald-400 drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_0_3px_rgba(244,63,94,0.3)]'}`}>
                  {t.type === TransactionType.INCOME ? '+' : ''}{t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
           <div className="h-40 flex flex-col items-center justify-center text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded mt-4">
             <Activity className="w-6 h-6 mb-2 opacity-50" />
             NO TELEMETRY FOUND IN SECTOR
           </div>
        )}
      </div>
    </div>
  );
};
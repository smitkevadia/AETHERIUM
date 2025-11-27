import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Filter } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const TransactionList: React.FC<Props> = ({ transactions }) => {
  const [filter, setFilter] = useState('ALL');

  const filtered = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.category === filter;
  });

  const categories = Array.from(new Set(transactions.map(t => t.category))) as string[];

  return (
    <div className="flex flex-col h-full">
      {/* Sci-Fi Filter Bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-cyan-500 text-xs font-mono uppercase tracking-widest mb-2">
           <Filter className="w-3 h-3" />
           <span>Data Filter Protocol</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1 scrollbar-thin">
          <button 
            onClick={() => setFilter('ALL')}
            className={`
              relative px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 clip-path-slant
              ${filter === 'ALL' 
                ? 'bg-cyan-500 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-300 border-l-2 border-slate-600'}
            `}
          >
            ALL
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                relative px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 clip-path-slant
                ${filter === cat
                  ? 'bg-cyan-500 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-300 border-l-2 border-slate-600'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] border border-slate-800/50 bg-slate-950/30 rounded relative">
         {/* Grid lines background */}
        <div className="absolute inset-0 scifi-grid opacity-20 pointer-events-none"></div>

        <table className="w-full text-left text-sm border-collapse relative z-10">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-20 text-[10px] uppercase tracking-wider text-cyan-600/70 border-b border-cyan-900/30">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Desc</th>
              <th className="p-3">Cat</th>
              <th className="p-3 text-right">Val</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.map((t, i) => (
              <tr key={i} className="hover:bg-cyan-500/5 transition-colors group">
                <td className="p-3 text-slate-500 font-mono text-xs">{t.date}</td>
                <td className="p-3 text-slate-300 font-medium group-hover:text-cyan-300 transition-colors text-xs truncate max-w-[120px]">{t.description}</td>
                <td className="p-3">
                  <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-slate-800/50 border border-slate-700 text-slate-400 uppercase tracking-wide">
                    {t.category}
                  </span>
                </td>
                <td className={`p-3 text-right font-mono font-bold text-xs ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === TransactionType.INCOME ? '+' : ''}{t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
           <div className="p-8 text-center text-slate-600 font-mono text-xs">
             NO DATA FOUND IN SECTOR
           </div>
        )}
      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { Filter, ChevronDown, Check, Coins } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const TransactionList: React.FC<Props> = ({ transactions, selectedCategories, onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Extract all unique categories
  const allCategories = Array.from(new Set(transactions.map(t => t.category))).sort();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      onCategoryChange(selectedCategories.filter(c => c !== cat));
    } else {
      onCategoryChange([...selectedCategories, cat]);
    }
  };

  const toggleAll = () => {
    if (selectedCategories.length === allCategories.length) {
      onCategoryChange([]);
    } else {
      onCategoryChange(allCategories);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedCategories.length < allCategories.length && selectedCategories.length > 0
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
            `}
          >
            <Filter className="w-4 h-4" />
            <span>Filter Categories</span>
            {selectedCategories.length > 0 && selectedCategories.length < allCategories.length && (
              <span className="flex items-center justify-center bg-slate-600 text-white w-5 h-5 rounded-full text-[10px]">
                {selectedCategories.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up">
              <div className="p-2 max-h-64 overflow-y-auto">
                <button 
                  onClick={toggleAll}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 font-medium mb-1 border-b border-slate-100"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedCategories.length === allCategories.length ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>
                    {selectedCategories.length === allCategories.length && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span>Select All</span>
                </button>
                
                {allCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 transition-colors"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedCategories.includes(cat) ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                      {selectedCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs font-medium text-slate-400">
          {transactions.length} Transactions
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-100 rounded-xl bg-slate-50/50">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-100">Date</th>
              <th className="p-4 border-b border-slate-100">Description</th>
              <th className="p-4 border-b border-slate-100">Category</th>
              <th className="p-4 border-b border-slate-100 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t, i) => (
              <tr key={i} className={`group hover:bg-white transition-colors ${t.isSuspicious ? 'bg-rose-50/50' : ''}`}>
                <td className="p-4 text-slate-500 whitespace-nowrap font-medium text-xs">
                    {t.date}
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        {t.isCash && (
                          <span title="Cash Entry">
                            <Coins className="w-3 h-3 text-amber-500" />
                          </span>
                        )}
                        <span className="text-slate-700 font-medium truncate max-w-[180px]">{t.description}</span>
                        {t.isSuspicious && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-600 font-bold">ALERT</span>
                        )}
                    </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                    {t.category}
                  </span>
                </td>
                <td className={`p-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
             <p className="text-sm">No transactions match your filters.</p>
           </div>
        )}
      </div>
    </div>
  );
};

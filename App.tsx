
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Upload, Plus, AlertTriangle, Calendar, Target, DollarSign, X, Check, FileText } from 'lucide-react';
import { Card, Button, StatBox, ProgressBar } from './components/SciFiUI';
import { OverviewChart, CategoryChart } from './components/Charts';
import { TransactionList } from './components/TransactionList';
import { analyzeStatement, getFinancialAdvice } from './services/geminiService';
import { Transaction, TransactionType, SavingsTarget, SavingsFrequency, DateRange, AdviceResponse } from './types';
import { format, subMonths, isSameMonth, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

function App() {
  // --- State ---
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showSuspiciousModal, setShowSuspiciousModal] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateRange>('ALL');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Savings Goal
  const [savingsTarget, setSavingsTarget] = useState<SavingsTarget>({ amount: 0, frequency: SavingsFrequency.MONTHLY });
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  
  // Suspicious Items
  const [suspiciousItems, setSuspiciousItems] = useState<Transaction[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers for Data Processing ---
  
  // 1. Filter Transactions based on UI controls
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Date Filter
    const today = new Date();
    if (dateFilter === 'THIS_MONTH') {
      filtered = filtered.filter(t => isSameMonth(parseISO(t.date), today));
    } else if (dateFilter === 'LAST_MONTH') {
      filtered = filtered.filter(t => isSameMonth(parseISO(t.date), subMonths(today, 1)));
    } else if (dateFilter === 'CUSTOM' && customDateRange.start && customDateRange.end) {
      filtered = filtered.filter(t => {
        const d = parseISO(t.date);
        return d >= parseISO(customDateRange.start) && d <= parseISO(customDateRange.end);
      });
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    return filtered;
  }, [allTransactions, dateFilter, customDateRange, selectedCategories]);

  // 2. Aggregate Data for Charts
  const stats = useMemo(() => {
    const monthlyMap = new Map<string, { income: number, expense: number }>();
    const categoryMap = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { income: 0, expense: 0 });
      const m = monthlyMap.get(monthKey)!;

      // Logic: Savings = Income - Expenses.
      // Amounts are stored as positive absolute values.
      if (t.type === TransactionType.INCOME) {
        m.income += t.amount;
        totalIncome += t.amount;
      } else {
        m.expense += t.amount;
        totalExpense += t.amount;
        const currentCat = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, currentCat + t.amount);
      }
    });

    const monthlySummary = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        totalIncome: data.income,
        totalExpense: data.expense,
        savings: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { monthlySummary, topCategories, totalIncome, totalExpense, savings: totalIncome - totalExpense };
  }, [filteredTransactions]);

  // 3. Suspicious Detection Logic
  useEffect(() => {
    if (allTransactions.length === 0) return;

    const groups: {[key: string]: Transaction[]} = {};
    const suspicious: Transaction[] = [];

    allTransactions.forEach(t => {
      // Key by description (simple normalization)
      const key = t.description.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Check rules: Big amount (> 2000) AND duplicate reference
    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        group.forEach(t => {
          if (t.amount > 2000) {
            suspicious.push(t);
          }
        });
      }
    });

    // If found new suspicious items not already flagged
    const newSuspicious = suspicious.filter(s => !s.isSuspicious);
    if (newSuspicious.length > 0) {
        // Mark them in state so we don't popup forever
        const ids = new Set(newSuspicious.map(s => s.id));
        setAllTransactions(prev => prev.map(t => ids.has(t.id) ? { ...t, isSuspicious: true } : t));
        setSuspiciousItems(newSuspicious);
        setShowSuspiciousModal(true);
    }
  }, [allTransactions.length]);


  // 4. Progress Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress(prev => {
          // Slow down as we get closer to 90%
          if (prev >= 90) return prev;
          const increment = Math.max(1, (90 - prev) / 10);
          return prev + increment;
        });
      }, 300);
    } 
    return () => clearInterval(interval);
  }, [analyzing]);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyzing(true);
      try {
        const result = await analyzeStatement(e.target.files[0]);
        setUploadProgress(100);
        // Small delay to show 100% before switching view
        setTimeout(() => {
            setAllTransactions(result.transactions);
            const cats = Array.from(new Set(result.transactions.map(t => t.category)));
            setSelectedCategories(cats);
        }, 500);
      } catch (err) {
        console.error(err);
        alert("Could not analyze file.");
        setUploadProgress(0);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleAddCash = (date: string, amount: number, desc: string, type: TransactionType) => {
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      amount: Math.abs(amount), // Ensure positive for consistency
      description: desc || 'Cash Entry',
      type,
      category: 'Other',
      isCash: true
    };
    setAllTransactions(prev => [...prev, newTx]);
    setShowCashModal(false);
  };

  const handleGetAdvice = async () => {
    if (!savingsTarget.amount) return;

    let monthlyTarget = savingsTarget.amount;
    if (savingsTarget.frequency === SavingsFrequency.WEEKLY) monthlyTarget *= 4;
    if (savingsTarget.frequency === SavingsFrequency.QUARTERLY) monthlyTarget /= 3;

    setAdviceLoading(true);
    try {
      const res = await getFinancialAdvice({
        currentSavings: stats.savings,
        targetSavings: monthlyTarget,
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        topExpenses: stats.topCategories.slice(0, 5)
      });
      setAdvice(res);
    } catch (e) {
      alert("Failed to get advice");
    } finally {
      setAdviceLoading(false);
    }
  };

  // --- Render ---

  if (allTransactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 relative overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ECCAC6]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E5E5F2]/20 rounded-full blur-3xl pointer-events-none"></div>

        <Card className="w-full max-w-lg text-center p-12 z-10 bg-white/80 backdrop-blur-md">
          <div className="w-20 h-20 bg-[#FAF9F6] border border-[#EADACF] text-[#4a4a4a] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
             <DollarSign className="w-8 h-8 opacity-60" />
          </div>
          <h1 className="font-serif text-5xl text-[#4a4a4a] mb-3 tracking-tight">Lumina</h1>
          <p className="text-[#888991] mb-12 font-light text-lg">Minimalist financial clarity.</p>
          
          <div className="space-y-6">
            {!analyzing ? (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full py-5 text-lg shadow-xl shadow-[#ECCAC6]/20">
                  <FileText className="w-5 h-5" />
                  Upload Statement
                </Button>
                <p className="text-xs text-[#C8C8DC] uppercase tracking-widest mt-4">Secure • Private • Intelligent</p>
              </>
            ) : (
              <div className="text-left w-full space-y-2 animate-slide-up">
                 <ProgressBar progress={uploadProgress} label="Analyzing Financial Data" />
                 <p className="text-xs text-[#888991] text-center mt-2 italic">Extracting transactions...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-[#FAF9F6]">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#F0F0F0] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ECCAC6] text-white rounded-full flex items-center justify-center">
            <span className="font-serif font-bold">L</span>
          </div>
          <span className="font-serif text-2xl text-[#4a4a4a] tracking-tight">Lumina</span>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => setShowCashModal(true)} className="text-xs px-4 py-2 rounded-xl">
             <Plus className="w-4 h-4" /> Add Cash
           </Button>
           <Button variant="ghost" onClick={() => setAllTransactions([])} className="text-xs px-4 py-2">
             Reset
           </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 space-y-10">
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setDateFilter(r)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  dateFilter === r 
                    ? 'bg-[#4a4a4a] text-white shadow-lg shadow-[#4a4a4a]/20' 
                    : 'bg-white text-[#888991] hover:bg-[#F8F9FA]'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-[#F0F0F0]">
              <input 
                type="date" 
                value={customDateRange.start}
                onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs text-[#4a4a4a] focus:outline-none uppercase tracking-wide"
              />
              <span className="text-[#EADACF]">—</span>
              <input 
                type="date" 
                value={customDateRange.end}
                onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs text-[#4a4a4a] focus:outline-none uppercase tracking-wide"
              />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatBox label="Total Income" value={`$${stats.totalIncome.toLocaleString()}`} color="periwinkle" />
          <StatBox label="Total Expenses" value={`$${stats.totalExpense.toLocaleString()}`} color="rose" />
          <StatBox label="Net Savings" value={`$${stats.savings.toLocaleString()}`} color="beige" />
          <StatBox label="Transactions" value={filteredTransactions.length} color="grey" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Charts */}
          <div className="lg:col-span-2 space-y-8">
            <Card title="Cash Flow">
              <OverviewChart data={stats.monthlySummary} />
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card title="Categories">
                 <CategoryChart data={stats.topCategories} />
               </Card>
               <div className="h-[450px]">
                 <TransactionList 
                    transactions={filteredTransactions} 
                    selectedCategories={selectedCategories}
                    onCategoryChange={setSelectedCategories}
                 />
               </div>
            </div>
          </div>

          {/* Right Column: Targets & Advice */}
          <div className="space-y-8">
            <Card title="Savings Target" className="bg-[#FDFCFB] border-[#EADACF]/30">
               <div className="space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#888991] uppercase tracking-widest">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-[#EADACF] font-serif italic">$</span>
                        <input 
                          type="number" 
                          value={savingsTarget.amount || ''}
                          onChange={e => setSavingsTarget(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#F0F0F0] text-sm bg-white focus:ring-1 focus:ring-[#EADACF] focus:border-[#EADACF] outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#888991] uppercase tracking-widest">Frequency</label>
                      <div className="relative">
                        <select 
                          value={savingsTarget.frequency}
                          onChange={e => setSavingsTarget(prev => ({ ...prev, frequency: e.target.value as SavingsFrequency }))}
                          className="w-full px-4 py-3 rounded-xl border border-[#F0F0F0] text-sm bg-white focus:ring-1 focus:ring-[#EADACF] focus:border-[#EADACF] outline-none appearance-none cursor-pointer"
                        >
                          {Object.values(SavingsFrequency).map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-[#888991]">
                          <Target className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                 </div>
                 <Button onClick={handleGetAdvice} disabled={adviceLoading || !savingsTarget.amount} className="w-full bg-[#4a4a4a]">
                   {adviceLoading ? 'Analyzing...' : 'Generate Plan'}
                 </Button>
               </div>
            </Card>

            {advice && (
               <Card title="Guidance" className="border border-[#E5E5F2] bg-white animate-slide-up">
                 <div className="space-y-6">
                   <p className="text-sm text-[#4a4a4a] leading-relaxed font-light italic border-l-2 border-[#ECCAC6] pl-4">"{advice.advice}"</p>
                   
                   <div className="space-y-3 pt-2">
                     <h4 className="text-[10px] font-bold text-[#888991] uppercase tracking-widest">Adjustments</h4>
                     {advice.suggestedCuts.map((cut, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-[#FAF9F6] p-4 rounded-xl border border-transparent hover:border-[#ECCAC6] transition-colors group">
                         <div>
                           <p className="font-medium text-sm text-[#4a4a4a]">{cut.category}</p>
                           <p className="text-xs text-[#888991] mt-0.5">{cut.reason}</p>
                         </div>
                         <span className="text-[#ECCAC6] text-sm font-serif group-hover:scale-110 transition-transform">-${cut.suggestedReduction}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </Card>
            )}
          </div>
        </div>
      </main>

      {/* Cash Modal */}
      {showCashModal && (
        <div className="fixed inset-0 bg-[#4a4a4a]/10 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full animate-slide-up border border-white">
            <h3 className="font-serif text-2xl mb-6 text-[#4a4a4a]">Add Transaction</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              handleAddCash(
                formData.get('date') as string,
                Math.abs(Number(formData.get('amount'))), // Ensure absolute
                formData.get('desc') as string,
                formData.get('type') as TransactionType
              );
            }} className="space-y-5">
               <div>
                 <label className="block text-[10px] font-bold text-[#888991] uppercase tracking-widest mb-2">Type</label>
                 <div className="flex gap-3">
                   <label className="flex-1 cursor-pointer">
                     <input type="radio" name="type" value={TransactionType.INCOME} defaultChecked className="peer hidden" />
                     <div className="text-center py-3 rounded-xl border border-[#F0F0F0] bg-[#FAF9F6] text-[#888991] peer-checked:bg-[#F0F0F8] peer-checked:text-[#4a4a4a] peer-checked:border-[#C8C8DC] transition-all text-sm">Income</div>
                   </label>
                   <label className="flex-1 cursor-pointer">
                     <input type="radio" name="type" value={TransactionType.EXPENSE} className="peer hidden" />
                     <div className="text-center py-3 rounded-xl border border-[#F0F0F0] bg-[#FAF9F6] text-[#888991] peer-checked:bg-[#FFF0F0] peer-checked:text-[#D4A5A5] peer-checked:border-[#ECCAC6] transition-all text-sm">Expense</div>
                   </label>
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-[#888991] uppercase tracking-widest mb-2">Date</label>
                 <input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full px-4 py-3 bg-[#FAF9F6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#EADACF]" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-[#888991] uppercase tracking-widest mb-2">Amount</label>
                 <input name="amount" type="number" step="0.01" required className="w-full px-4 py-3 bg-[#FAF9F6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#EADACF]" placeholder="0.00" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-[#888991] uppercase tracking-widest mb-2">Description</label>
                 <input name="desc" type="text" required className="w-full px-4 py-3 bg-[#FAF9F6] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#EADACF]" placeholder="e.g. Coffee" />
               </div>
               <div className="flex gap-3 pt-4">
                 <Button type="button" variant="ghost" onClick={() => setShowCashModal(false)} className="flex-1">Cancel</Button>
                 <Button type="submit" className="flex-1 bg-[#4a4a4a] text-white">Save</Button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspicious Alert Modal */}
      {showSuspiciousModal && (
        <div className="fixed inset-0 bg-[#4a4a4a]/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full border border-white animate-slide-up relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-[#ECCAC6]"></div>
             <div className="flex items-start gap-5 mb-6">
               <div className="p-4 bg-[#FFF0F0] rounded-2xl text-[#ECCAC6]">
                 <AlertTriangle className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-serif text-xl text-[#4a4a4a] mb-1">Unusual Activity</h3>
                 <p className="text-sm text-[#888991]">We detected duplicate large transactions.</p>
               </div>
             </div>
             
             <div className="bg-[#FAF9F6] rounded-2xl p-4 space-y-3 mb-8 max-h-48 overflow-y-auto custom-scrollbar">
                {suspiciousItems.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-sm border-b border-[#E5E5F2] last:border-0 pb-3 last:pb-0">
                    <div>
                      <span className="font-medium block text-[#4a4a4a]">{t.description}</span>
                      <span className="text-xs text-[#888991]">{t.date}</span>
                    </div>
                    <span className="font-serif text-[#ECCAC6]">${t.amount}</span>
                  </div>
                ))}
             </div>

             <div className="flex justify-end gap-3">
               <Button onClick={() => setShowSuspiciousModal(false)} className="w-full bg-[#4a4a4a]">Acknowledge</Button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

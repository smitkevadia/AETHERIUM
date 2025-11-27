import React, { useState, useRef } from 'react';
import { Upload, Activity, Target, Shield, AlertTriangle, Cpu, Terminal } from 'lucide-react';
import { SciFiCard, NeonButton, StatBox } from './components/SciFiUI';
import { SpendOverviewChart, CategoryPieChart } from './components/Charts';
import { TransactionList } from './components/TransactionList';
import { analyzeStatement, getFinancialAdvice } from './services/geminiService';
import { AnalysisResult, AdviceResponse } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [targetSavings, setTargetSavings] = useState<number | ''>('');
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const result = await analyzeStatement(file);
      setData(result);
    } catch (error) {
      console.error(error);
      alert('Analysis failed. Please try a clear image or PDF of a bank statement.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!data || !targetSavings) return;
    
    // Aggregate all data for advice context
    const totalIncome = data.monthlySummary.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const totalExpense = data.monthlySummary.reduce((acc, curr) => acc + curr.totalExpense, 0);
    const currentSavings = totalIncome - totalExpense;
    
    setAdviceLoading(true);
    try {
      const response = await getFinancialAdvice({
        currentSavings,
        targetSavings: Number(targetSavings),
        totalIncome,
        totalExpense,
        topExpenses: data.topCategories
      });
      setAdvice(response);
    } catch (e) {
      console.error(e);
      alert("Failed to retrieve tactical advice from AI Core.");
    } finally {
      setAdviceLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="absolute inset-0 z-[-1] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]"></div>
        
        <div className="max-w-md w-full text-center space-y-8">
          <div className="mb-8">
            <h1 className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tighter mb-2 glow-text">
              CREDITS
            </h1>
            <p className="text-cyan-600/80 font-mono text-sm tracking-widest">FINANCIAL TELEMETRY SYSTEM v2.5</p>
          </div>

          <SciFiCard className="p-8 border-cyan-500/50 shadow-cyan-500/20" scanline>
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/20"></div>
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-300 font-medium">Upload Bank Statement</p>
                <p className="text-slate-500 text-xs">Supported formats: PDF, PNG, JPEG</p>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                className="hidden" 
              />
              
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-dashed border-slate-600 rounded text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors text-sm"
                >
                  {file ? file.name : "Select Document Source"}
                </button>

                <NeonButton 
                  onClick={handleUpload} 
                  disabled={!file || analyzing}
                  className="w-full"
                >
                  {analyzing ? 'ANALYZING TELEMETRY...' : 'INITIATE ANALYSIS'}
                </NeonButton>
              </div>
            </div>
          </SciFiCard>
        </div>
      </div>
    );
  }

  const latestMonth = data.monthlySummary[data.monthlySummary.length - 1];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-900/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="text-cyan-400" />
            FINANCIAL COMMAND
          </h1>
          <p className="text-cyan-700 font-mono text-xs mt-1">SYSTEM STATUS: ONLINE // AI CORE: ACTIVE</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setData(null); setFile(null); setAdvice(null); }}
            className="text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
          >
            [RESET SYSTEM]
          </button>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SciFiCard className="bg-emerald-950/20 border-emerald-500/30">
          <StatBox label="Total Income" value={`$${latestMonth.totalIncome.toFixed(0)}`} color="text-emerald-400" />
        </SciFiCard>
        <SciFiCard className="bg-rose-950/20 border-rose-500/30">
          <StatBox label="Total Expenses" value={`$${latestMonth.totalExpense.toFixed(0)}`} color="text-rose-400" />
        </SciFiCard>
        <SciFiCard className="bg-cyan-950/20 border-cyan-500/30">
          <StatBox label="Net Savings" value={`$${latestMonth.savings.toFixed(0)}`} color="text-cyan-400" />
        </SciFiCard>
        <SciFiCard className="bg-indigo-950/20 border-indigo-500/30">
           {/* Simple metric for savings rate */}
          <StatBox label="Savings Rate" value={`${((latestMonth.savings / latestMonth.totalIncome) * 100).toFixed(1)}%`} color="text-indigo-400" />
        </SciFiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          <SciFiCard title="Spending Trends" scanline>
            <SpendOverviewChart data={data} />
          </SciFiCard>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SciFiCard title="Category Breakdown">
               <CategoryPieChart data={data} />
            </SciFiCard>
            <SciFiCard title="Recent Transactions" className="h-[300px] md:h-auto">
               <TransactionList transactions={data.transactions} />
            </SciFiCard>
          </div>
        </div>

        {/* Sidebar / Advisor Area */}
        <div className="space-y-6">
          {/* Goal Setting */}
          <SciFiCard title="Target Protocol" className="border-amber-500/30">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-amber-500/80 uppercase tracking-widest font-mono">Target Savings Limit</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input 
                    type="number" 
                    value={targetSavings}
                    onChange={(e) => setTargetSavings(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-7 text-white focus:border-amber-500 focus:outline-none font-mono"
                    placeholder="2000"
                  />
                </div>
              </div>
              
              <NeonButton 
                onClick={handleGetAdvice} 
                className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                disabled={!targetSavings || adviceLoading}
              >
                {adviceLoading ? 'CALCULATING OPTIMAL PATH...' : 'OPTIMIZE SPEND'}
              </NeonButton>
            </div>
          </SciFiCard>

          {/* Advice Output */}
          {advice && (
            <SciFiCard title="Tactical Advice" className="border-violet-500/30 animate-fade-in-up">
              <div className="space-y-4">
                <div className="p-3 bg-violet-900/20 border-l-2 border-violet-500 rounded-r">
                  <p className="text-sm text-slate-300 leading-relaxed font-mono">
                    <Terminal className="inline w-4 h-4 mr-2 text-violet-400" />
                    {advice.advice}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Recommended Cuts</h4>
                  {advice.suggestedCuts.map((cut, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-slate-200 text-sm font-bold">{cut.category}</span>
                          <span className="text-rose-400 text-xs font-mono">-${cut.suggestedReduction}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{cut.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SciFiCard>
          )}

           {/* High Spend Alert if no advice yet */}
           {!advice && (
             <SciFiCard title="System Alerts" className="border-rose-900/50">
                <div className="flex items-center gap-3 text-rose-400">
                  <Shield className="w-5 h-5" />
                  <span className="font-mono text-sm">Top Spend: {data.topCategories[0]?.category}</span>
                </div>
             </SciFiCard>
           )}
        </div>
      </div>
    </div>
  );
}

export default App;

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalysisResult } from '../types';

interface ChartProps {
  data: AnalysisResult;
}

const COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6', '#94a3b8'];

export const SpendOverviewChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = data.monthlySummary.map(m => ({
    name: m.month,
    Income: m.totalIncome,
    Expenses: m.totalExpense,
    Savings: m.savings
  }));

  return (
    <div className="h-72 w-full relative group">
      <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"></div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Rajdhani', fontWeight: 600 }} 
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Rajdhani' }} 
            tickFormatter={(value) => `$${value}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(6,182,212,0.1)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/50 p-4 shadow-[0_0_15px_rgba(6,182,212,0.3)] clip-path-slant min-w-[180px]">
                    <p className="text-cyan-400 font-display text-xs mb-3 border-b border-cyan-900/50 pb-2 flex justify-between">
                      <span>PERIOD</span>
                      <span className="text-white">{label}</span>
                    </p>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs font-mono mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                           <span className="text-slate-400 uppercase">{entry.name}</span>
                        </div>
                        <span className="text-white font-bold tracking-wider">${Number(entry.value).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontFamily: 'Rajdhani', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }} 
            iconType="rect"
            iconSize={10}
          />
          <Bar dataKey="Income" fill="#10b981" radius={[2, 2, 0, 0]} animationDuration={1500} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} animationDuration={1500} />
          <Bar dataKey="Savings" fill="#06b6d4" radius={[2, 2, 0, 0]} animationDuration={1500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<ChartProps> = ({ data }) => {
  // Map data correctly for Recharts Pie to ensure 'name' matches the legend logic
  const pieData = data.topCategories.map(item => ({
    name: item.category,
    value: item.amount
  }));

  return (
    <div className="h-72 w-full relative">
       {/* Decorative center ring */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-dashed border-slate-700/50 animate-[spin_10s_linear_infinite] pointer-events-none"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-slate-800/80 pointer-events-none"></div>
       
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip 
             content={({ active, payload }) => {
               if (active && payload && payload.length) {
                 const d = payload[0].payload;
                 const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                 const percent = ((d.value / total) * 100).toFixed(1);
                 
                 return (
                   <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/50 p-3 shadow-lg clip-path-slant min-w-[150px]">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: payload[0].color }}></div>
                        <p className="text-cyan-400 font-display text-xs uppercase tracking-wider">{d.name}</p>
                     </div>
                     <div className="flex justify-between items-end border-t border-cyan-900/50 pt-2">
                        <p className="text-white font-mono font-bold text-lg leading-none">${d.value.toFixed(0)}</p>
                        <p className="text-slate-400 font-mono text-xs">{percent}%</p>
                     </div>
                   </div>
                 );
               }
               return null;
             }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            wrapperStyle={{ fontSize: '11px', fontFamily: 'Rajdhani', color: '#94a3b8' }}
            formatter={(value) => <span className="text-slate-300 uppercase tracking-wide ml-1 hover:text-cyan-400 transition-colors">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
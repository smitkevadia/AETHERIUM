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

const COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export const SpendOverviewChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = data.monthlySummary.map(m => ({
    name: m.month,
    Income: m.totalIncome,
    Expenses: m.totalExpense,
    Savings: m.savings
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Rajdhani' }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Rajdhani' }} />
          <Tooltip 
            cursor={{ fill: 'rgba(6,182,212,0.1)' }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 p-3 shadow-lg rounded-sm">
                    <p className="text-cyan-400 font-display text-xs mb-2 uppercase">{label}</p>
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs font-mono mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-300">{entry.name}:</span>
                        <span className="text-white font-bold">${Number(entry.value).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ fontFamily: 'Rajdhani', fontSize: '12px' }} />
          <Bar dataKey="Income" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Savings" fill="#06b6d4" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.topCategories}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="amount"
            nameKey="category"
          >
            {data.topCategories.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
             content={({ active, payload }) => {
               if (active && payload && payload.length) {
                 const d = payload[0].payload;
                 return (
                   <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 p-3 shadow-lg rounded-sm">
                     <p className="text-cyan-400 font-display text-xs uppercase tracking-wider">{d.category}</p>
                     <p className="text-white font-mono font-bold text-lg">${d.amount.toFixed(2)}</p>
                   </div>
                 );
               }
               return null;
             }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontFamily: 'Rajdhani', color: '#94a3b8' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

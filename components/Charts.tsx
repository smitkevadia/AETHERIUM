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
import { MonthlySummary } from '../types';

interface ChartProps {
  data: any[];
  type?: 'monthly' | 'category';
}

// User provided pastel palette
const COLORS = {
  rose: '#ECCAC6',
  beige: '#EADACF',
  lavender: '#E5E5F2',
  periwinkle: '#C8C8DC',
  grey: '#888991',
};

const PASTEL_PALETTE = [
  COLORS.rose,
  COLORS.periwinkle,
  COLORS.beige,
  COLORS.lavender,
  COLORS.grey,
  '#F5E6E8', // Light Rose
  '#D9D9E0', // Darker Lavender
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-[#E5E5F2] text-xs">
        <p className="font-serif text-[#888991] mb-2 border-b border-[#E5E5F2] pb-1 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[#888991] capitalize">{entry.name}:</span>
            <span className="font-medium text-[#4a4a4a]">
              ${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const OverviewChart: React.FC<{ data: MonthlySummary[] }> = ({ data }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F2" />
          <XAxis 
            dataKey="month" 
            stroke="#888991" 
            tick={{ fill: '#888991', fontSize: 11 }} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#888991" 
            tick={{ fill: '#888991', fontSize: 11 }} 
            tickFormatter={(value) => `$${value}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FAFAF9' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#888991' }} 
            iconType="circle"
            iconSize={8}
          />
          <Bar name="Income" dataKey="totalIncome" fill={COLORS.periwinkle} radius={[6, 6, 6, 6]} barSize={16} />
          <Bar name="Expenses" dataKey="totalExpense" fill={COLORS.rose} radius={[6, 6, 6, 6]} barSize={16} />
          <Bar name="Savings" dataKey="savings" fill={COLORS.beige} radius={[6, 6, 6, 6]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryChart: React.FC<{ data: { category: string; amount: number }[] }> = ({ data }) => {
  return (
    <div className="h-72 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={4}
            dataKey="amount"
            nameKey="category"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={PASTEL_PALETTE[index % PASTEL_PALETTE.length]} 
                className="hover:opacity-90 transition-opacity outline-none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            wrapperStyle={{ fontSize: '11px', color: '#888991' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text for decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-28 lg:pr-32">
        <span className="text-[10px] text-[#888991] tracking-widest uppercase">Total</span>
      </div>
    </div>
  );
};
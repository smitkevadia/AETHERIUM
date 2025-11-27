import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white rounded-[24px] border border-[#f0f0f0] pastel-shadow overflow-hidden transition-all duration-300 ${className}`}>
      {title && (
        <div className="px-8 py-6 flex items-center justify-between">
          <h3 className="font-serif text-xl text-[#4a4a4a] tracking-wide">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-8 pb-8 pt-2">
        {children}
      </div>
    </div>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ children, className = '', variant = 'primary', ...props }) => {
  const variants = {
    // Primary: Grey bg, White text, Rose shadow hint
    primary: "bg-[#4a4a4a] text-white hover:bg-[#333] shadow-lg shadow-[#ECCAC6]/40 border border-transparent",
    // Secondary: Beige bg, Dark text
    secondary: "bg-[#FAF9F6] text-[#4a4a4a] border border-[#EADACF] hover:bg-[#EADACF] hover:border-[#EADACF]",
    danger: "bg-[#FFF5F5] text-[#ECCAC6] hover:bg-[#FFE5E5] border border-[#ECCAC6]",
    ghost: "bg-transparent text-[#888991] hover:text-[#4a4a4a]"
  };

  return (
    <button 
      className={`
        px-6 py-3 rounded-2xl font-normal text-sm transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
        active:scale-95 tracking-wide
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export const StatBox: React.FC<{ label: string; value: string | number; color?: 'rose' | 'beige' | 'lavender' | 'periwinkle' | 'grey' }> = ({ label, value, color = "grey" }) => {
  const colors = {
    rose: "bg-[#FFF0F0] text-[#D4A5A5]",
    beige: "bg-[#FAF5F0] text-[#C4B5A5]",
    lavender: "bg-[#F8F8FC] text-[#B5B5C4]",
    periwinkle: "bg-[#F0F0F8] text-[#A5A5C4]",
    grey: "bg-[#F8F9FA] text-[#888991]",
  };

  return (
    <div className={`flex flex-col p-6 rounded-2xl transition-transform hover:-translate-y-1 duration-300 ${colors[color]}`}>
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-2">{label}</span>
      <span className="font-serif text-3xl text-[#4a4a4a]">{value}</span>
    </div>
  );
};

export const ProgressBar: React.FC<{ progress: number; label?: string }> = ({ progress, label }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        {label && <span className="text-xs font-medium text-[#888991] uppercase tracking-wider">{label}</span>}
        <span className="text-xs font-bold text-[#ECCAC6]">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E5E5F2]">
        <div 
          className="h-full bg-[#ECCAC6] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
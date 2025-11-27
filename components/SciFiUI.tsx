import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  scanline?: boolean;
}

export const SciFiCard: React.FC<CardProps> = ({ children, className = '', title, scanline = false }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.2)] ${className}`}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
      
      {scanline && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.4)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan"></div>
      )}

      {title && (
        <div className="px-4 py-2 bg-cyan-950/50 border-b border-cyan-500/30 flex items-center justify-between">
          <h3 className="font-display text-cyan-400 tracking-wider text-sm uppercase">{title}</h3>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-cyan-500/20 rounded-full"></div>
          </div>
        </div>
      )}
      
      <div className="p-4 relative z-10">
        {children}
      </div>
    </div>
  );
};

export const NeonButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => {
  return (
    <button 
      className={`
        relative px-6 py-3 font-display font-bold text-cyan-950 bg-cyan-400 
        clip-path-slant hover:bg-cyan-300 transition-all duration-300
        hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2 justify-center">
        {children}
      </span>
    </button>
  );
};

export const StatBox: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = "text-cyan-400" }) => (
  <div className="flex flex-col border-l-2 border-slate-700 pl-4">
    <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">{label}</span>
    <span className={`font-display text-2xl font-bold ${color} glow-text`}>{value}</span>
  </div>
);

import React, { useEffect, useRef } from 'react';

interface DisplayProps {
  expression: string;
  result: string;
}

export const Display: React.FC<DisplayProps> = ({ expression, result }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right when expression changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [expression]);

  return (
    <div className="w-full h-40 bg-white/50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col justify-end items-end shadow-inner mb-4 transition-colors duration-300 backdrop-blur-sm border border-white/20 dark:border-slate-700">
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar text-right whitespace-nowrap mb-2"
      >
        <span className="text-3xl text-slate-500 dark:text-slate-400 font-light tracking-wide">
          {expression || '0'}
        </span>
      </div>
      <div className="w-full text-right overflow-hidden text-ellipsis">
        <span className="text-5xl font-semibold text-slate-800 dark:text-white tracking-tight animate-in fade-in duration-200">
          {result ? `= ${result}` : ''}
        </span>
      </div>
    </div>
  );
};

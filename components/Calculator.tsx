import React, { useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { Button } from './Button';
import { History } from './History';
import { ThemeToggle } from './ThemeToggle';
import { CalculatorButton } from '../types';
import { History as HistoryIcon, Delete } from 'lucide-react';

export const Calculator: React.FC = () => {
  const { 
    expression, 
    setExpression,
    result, 
    history, 
    handleInput, 
    clear, 
    deleteLast, 
    calculate, 
    clearHistory 
  } = useCalculator();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const advancedButtons: CalculatorButton[] = [
    { label: '√', value: '√', type: 'scientific' },
    { label: 'x²', value: 'x²', type: 'scientific' },
    { label: 'xʸ', value: 'xʸ', type: 'scientific' },
    { label: '1/x', value: '1/x', type: 'scientific' },
    { label: '(', value: '(', type: 'scientific' },
    { label: ')', value: ')', type: 'scientific' },
    { label: 'Mod', value: 'Mod', type: 'scientific' },
    { label: '+/-', value: '+/-', type: 'scientific' },
  ];

  const mainButtons: CalculatorButton[] = [
    { label: 'C', value: 'C', type: 'action' },
    { label: '÷', value: '÷', type: 'operator' },
    { label: '×', value: '×', type: 'operator' },
    { label: '⌫', value: 'DEL', type: 'action' },
    
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '-', value: '-', type: 'operator' },

    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '+', value: '+', type: 'operator' },

    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '%', value: '%', type: 'operator' },

    { label: '.', value: '.', type: 'number' },
    { label: '0', value: '0', type: 'number' },
    { label: '=', value: '=', type: 'operator', className: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500' },
  ];

  const handleButtonClick = (value: string) => {
    if (value === 'C') {
      clear();
    } else if (value === 'DEL') {
      deleteLast();
    } else if (value === '=') {
      calculate();
    } else {
      handleInput(value);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 h-[850px] sm:h-auto flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-center bg-white dark:bg-slate-800 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
        </div>
        <h1 className="text-sm font-semibold tracking-widest text-slate-400 uppercase">Odia Calculator</h1>
        <div className="flex gap-3">
          <ThemeToggle />
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all shadow-sm"
          >
            <HistoryIcon size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col relative z-0">
        <Display expression={expression} result={result} />

        <div className="flex-1 flex flex-col gap-4">
          {/* Scientific Keypad Row 1 & 2 */}
          <div className="grid grid-cols-4 gap-3 mb-2">
            {advancedButtons.map((btn) => (
              <Button
                key={btn.value}
                label={btn.label}
                value={btn.value}
                type={btn.type}
                onClick={handleButtonClick}
                className="text-base"
              />
            ))}
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Main Keypad */}
          <div className="grid grid-cols-4 gap-3">
            {mainButtons.map((btn) => (
              <Button
                key={btn.value}
                label={btn.value === 'DEL' ? <Delete size={22} /> : btn.label}
                value={btn.value}
                type={btn.type}
                onClick={handleButtonClick}
                className={btn.value === '=' ? 'col-span-2 aspect-auto' : ''}
              />
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium opacity-70">
            Created by Benu
          </p>
        </div>
      </div>

      {/* History Overlay */}
      <History 
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onClear={clearHistory}
        onSelect={(expr) => setExpression(expr)}
      />
    </div>
  );
};

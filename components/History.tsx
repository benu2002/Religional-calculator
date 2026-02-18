import React from 'react';
import { HistoryItem } from '../types';
import { Trash2, X } from 'lucide-react';

interface HistoryProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onSelect: (expr: string) => void;
}

export const History: React.FC<HistoryProps> = ({ history, isOpen, onClose, onClear, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 rounded-3xl p-6 flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">History</h3>
        <div className="flex gap-2">
           {history.length > 0 && (
            <button 
              onClick={onClear}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              aria-label="Clear history"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Close history"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>No history yet</p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.expression);
                onClose();
              }}
              className="w-full text-right p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">{item.expression}</div>
              <div className="text-xl font-medium text-slate-800 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                = {item.result}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ButtonType } from '../types';

interface ButtonProps {
  label: React.ReactNode;
  value: string;
  type: ButtonType;
  onClick: (value: string) => void;
  className?: string;
  double?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, value, type, onClick, className = '', double }) => {
  
  const getBaseStyles = () => {
    switch (type) {
      case 'operator':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50';
      case 'action':
        return 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40';
      case 'scientific':
        return 'bg-slate-200/50 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm';
      case 'number':
      default:
        return 'bg-white text-slate-800 dark:bg-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600';
    }
  };

  const activeEffect = "active:scale-95 transition-all duration-150 ease-in-out shadow-sm hover:shadow-md";

  return (
    <button
      onClick={() => onClick(value)}
      className={`
        ${getBaseStyles()}
        ${activeEffect}
        ${double ? 'col-span-2 aspect-[2.1/1]' : 'aspect-square'}
        rounded-2xl flex items-center justify-center text-xl font-medium select-none
        ${className}
      `}
      aria-label={typeof label === 'string' ? label : value}
    >
      {label}
    </button>
  );
};

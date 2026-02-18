export type ButtonType = 'number' | 'operator' | 'action' | 'scientific';

export interface CalculatorButton {
  label: string;
  value: string;
  type: ButtonType;
  className?: string;
}

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

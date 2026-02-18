import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Delete, X, GripHorizontal, 
  Ruler, Weight, Thermometer, Box, 
  ChevronLeft, ChevronDown, ArrowRightLeft,
  Sun, Moon, Calculator as CalcIcon, 
  History, FlaskConical, Volume2, VolumeX, Trash2
} from 'lucide-react';

// --- SOUND UTILS ---
const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    // Ignore audio errors
  }
};

// --- LANGUAGE DATA (ODIA ONLY) ---
// Hardcoded to Odia to simplify logic
const ODIA_DIGITS = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];

const TRANSLATIONS = {
  calculator: 'କାଲକୁଲେଟର',
  converter: 'କନଭର୍ଟର',
  clear: 'AC',
  length: 'ଦୈର୍ଘ୍ୟ',
  weight: 'ଓଜନ',
  temp: 'ତାପମାତ୍ରା',
  data: 'ଡାଟା',
  error: 'ତ୍ରୁଟି',
  scientific: 'ବୈଜ୍ଞାନିକ',
  history: 'ଇତିହାସ',
  back: 'ଫେରନ୍ତୁ',
  noHistory: 'ଇତିହାସ ନାହିଁ',
  clearHistory: 'ସଫା କରନ୍ତୁ',
  appTitle: 'ଓଡ଼ିଆ କାଲକୁଲେଟର'
};

// --- UTILS ---
const localize = (str: string | number): string => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[0-9]/g, (char) => ODIA_DIGITS[parseInt(char)] || char);
};

// --- TYPES ---
type Tab = 'calculator' | 'converter';
type ConverterCategory = 'length' | 'weight' | 'temperature' | 'data' | null;

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

// --- CONVERSION LOGIC ---
const RATES: Record<string, number> = {
  // Length (base: meter)
  'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'ft': 0.3048, 'in': 0.0254,
  // Weight (base: gram)
  'g': 1, 'kg': 1000, 'mg': 0.001, 'lb': 453.592, 'oz': 28.3495,
  // Data (base: byte)
  'B': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824,
};

const convertValue = (val: number, from: string, to: string, type: string): number => {
  if (type === 'temperature') {
    let celsius = val;
    if (from === 'F') celsius = (val - 32) * 5/9;
    if (from === 'K') celsius = val - 273.15;
    
    if (to === 'C') return celsius;
    if (to === 'F') return (celsius * 9/5) + 32;
    if (to === 'K') return celsius + 273.15;
    return val;
  }
  
  const baseVal = val * RATES[from];
  return baseVal / RATES[to];
};

const evaluateExpression = (expression: string): string => {
  try {
    let evalExpr = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/\^/g, '**')
      .replace(/√\(/g, 'Math.sqrt(');

    // eslint-disable-next-line no-new-func
    const calcFunc = new Function(`return (${evalExpr})`);
    const rawResult = calcFunc();

    if (!isFinite(rawResult) || isNaN(rawResult)) {
      throw new Error('Math Error');
    }

    return parseFloat(rawResult.toFixed(10)).toString();
  } catch (error) {
    throw error;
  }
};

// --- HOOKS ---
const useCalculator = () => {
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isError, setIsError] = useState<boolean>(false);

  // Continuous Calculation Effect
  useEffect(() => {
    if (!expression || isError) {
      setPreview('');
      return;
    }
    // Only try to calculate if it looks like a complete expression (ends with digit or parenthesis)
    if (/[\d)]$/.test(expression)) {
      try {
        const res = evaluateExpression(expression);
        setPreview(res);
      } catch (e) {
        setPreview('');
      }
    } else {
      setPreview('');
    }
  }, [expression, isError]);

  const clear = useCallback(() => {
    setExpression('');
    setResult('');
    setPreview('');
    setIsError(false);
  }, []);

  const deleteLast = useCallback(() => {
    if (isError) {
      clear();
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  }, [isError, clear]);

  const calculate = useCallback(() => {
    if (!expression) return;
    try {
      const formattedResult = evaluateExpression(expression);
      setResult(formattedResult);
      setPreview(''); 
      
      setHistory(prev => [
        { id: Date.now().toString(), expression, result: formattedResult },
        ...prev
      ].slice(0, 50));

    } catch (error) {
      setResult(TRANSLATIONS.error); 
      setIsError(true);
      setPreview('');
    }
  }, [expression]);

  const handleInput = useCallback((value: string) => {
    if (isError) {
      setExpression(value);
      setResult('');
      setPreview('');
      setIsError(false);
      return;
    }
    if (result && !['+', '-', '×', '÷', '%'].includes(value)) {
       setExpression(value);
       setResult('');
       return;
    }
    if (result && ['+', '-', '×', '÷', '%'].includes(value)) {
       setExpression(result + value);
       setResult('');
       return;
    }

    setExpression((prev) => prev + value);
  }, [isError, result]);

  const loadHistoryItem = (item: HistoryItem) => {
    setExpression(item.result);
    setResult('');
    setPreview('');
  };

  const clearHistory = () => setHistory([]);

  return { expression, result, preview, history, clear, deleteLast, calculate, handleInput, loadHistoryItem, clearHistory };
};

// --- COMPONENTS ---

const Display: React.FC<{ expression: string; result: string; preview: string }> = ({ expression, result, preview }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [expression]);

  return (
    <div className="w-full flex-1 flex flex-col justify-end items-end p-6 pb-2 space-y-1 overflow-hidden shrink-0 min-h-[160px] z-10 relative">
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto no-scrollbar text-right whitespace-nowrap"
      >
        <span className={`font-oriya font-semibold tracking-wide transition-all duration-300 ${result ? 'text-3xl md:text-4xl opacity-60 text-gray-500 dark:text-gray-400' : 'text-6xl md:text-7xl text-gray-800 dark:text-white'}`}>
          {localize(expression) || localize('0')}
        </span>
      </div>
      
      <div className="w-full text-right overflow-hidden text-ellipsis h-20 md:h-24 flex items-center justify-end">
        {result ? (
          <span className="font-oriya text-6xl md:text-7xl font-bold text-brand-orange animate-slide-up block drop-shadow-sm">
            = {localize(result)}
          </span>
        ) : preview ? (
          <span className="font-oriya text-4xl md:text-5xl font-medium text-gray-400 dark:text-gray-600 block transition-opacity duration-200">
            {localize(preview)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

interface ButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'number' | 'operator' | 'action' | 'accent' | 'scientific';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'number', className = '', disabled }) => {
  const [isPressed, setIsPressed] = useState(false);

  let baseStyle = "font-oriya rounded-[2rem] text-2xl md:text-3xl font-bold flex items-center justify-center transition-all duration-150 select-none h-full w-full active:scale-95 relative overflow-hidden";
  let colorStyle = "";

  if (disabled) {
    return (
      <div className={`${baseStyle} opacity-0 pointer-events-none ${className}`}>
        {label}
      </div>
    );
  }

  switch (variant) {
    case 'number':
      colorStyle = "bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2c2c2e] shadow-sm hover:shadow active:shadow-inner";
      break;
    case 'operator':
      colorStyle = "bg-gray-100 dark:bg-[#1c1c1c] text-brand-orange hover:bg-gray-200 dark:hover:bg-[#2c2c2e] shadow-sm";
      break;
    case 'action':
      colorStyle = "bg-gray-200 dark:bg-[#2c2c2e] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#3a3a3c] shadow-sm"; 
      break;
    case 'accent':
      colorStyle = "bg-brand-orange text-white hover:bg-[#ffb03b] shadow-lg shadow-orange-500/30"; 
      break;
    case 'scientific':
      colorStyle = "bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] text-lg font-bold shadow-sm aspect-video";
      break;
  }

  return (
    <button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`${baseStyle} ${colorStyle} ${className}`}
    >
      {label}
    </button>
  );
};

const Header: React.FC<{ 
  activeTab: Tab; 
  onTabChange: (tab: Tab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isSound: boolean;
  toggleSound: () => void;
  toggleHistory: () => void;
  toggleScientific: () => void;
}> = ({ activeTab, onTabChange, isDark, toggleTheme, isSound, toggleSound, toggleHistory, toggleScientific }) => {

  return (
    <div className="flex flex-col w-full pt-4 px-4 md:pt-6 md:px-8 bg-white/80 dark:bg-black/80 backdrop-blur-xl transition-colors z-30 shrink-0 border-b border-gray-100 dark:border-gray-900 rounded-t-none md:rounded-t-[2.5rem]">
      
      {/* Top Bar with Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
            <div className="bg-brand-orange p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
                <CalcIcon size={18} className="text-white" />
            </div>
            <span className="font-oriya font-bold text-lg text-gray-800 dark:text-white tracking-wide">
                {TRANSLATIONS.appTitle}
            </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
           <button 
            onClick={toggleScientific}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] transition-all hover:scale-105 active:scale-95"
            aria-label="Toggle Scientific"
          >
            <FlaskConical size={18} />
          </button>
          
          <button 
            onClick={toggleHistory}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] transition-all hover:scale-105 active:scale-95"
            aria-label="History"
          >
            <History size={18} />
          </button>

          <button 
            onClick={toggleSound}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] transition-all hover:scale-105 active:scale-95"
            aria-label="Toggle Sound"
          >
            {isSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-[#2c2c2e] transition-all hover:scale-105 active:scale-95"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex justify-center items-center gap-1 p-1 bg-gray-100 dark:bg-[#1c1c1c] rounded-2xl mx-auto mb-4 w-full max-w-[280px]">
        <button 
          onClick={() => onTabChange('calculator')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold font-oriya transition-all duration-300 ${activeTab === 'calculator' ? 'bg-white dark:bg-[#2c2c2e] text-brand-orange shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          {TRANSLATIONS.calculator}
        </button>
        <button 
          onClick={() => onTabChange('converter')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold font-oriya transition-all duration-300 ${activeTab === 'converter' ? 'bg-white dark:bg-[#2c2c2e] text-brand-orange shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          {TRANSLATIONS.converter}
        </button>
      </div>
    </div>
  );
};

const HistoryView: React.FC<{ history: HistoryItem[]; onClose: () => void; onLoad: (item: HistoryItem) => void; onClear: () => void; }> = ({ history, onClose, onLoad, onClear }) => {
  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-black/90 z-50 flex flex-col p-6 animate-fade-in backdrop-blur-xl rounded-none md:rounded-[2.5rem]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-oriya text-gray-800 dark:text-white">{TRANSLATIONS.history}</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#1c1c1c] rounded-full text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-[#2c2c2e] transition-colors">
          <X size={24} />
        </button>
      </div>
      
      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg font-oriya">
          {TRANSLATIONS.noHistory}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {history.map((item) => (
            <button 
              key={item.id}
              onClick={() => { onLoad(item); onClose(); }}
              className="w-full bg-gray-50 dark:bg-[#1c1c1c] p-4 rounded-2xl text-right hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors border border-gray-100 dark:border-gray-800"
            >
              <div className="text-xl text-gray-500 mb-1 font-oriya">{localize(item.expression)}</div>
              <div className="text-3xl text-brand-orange font-bold font-oriya">= {localize(item.result)}</div>
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
         <button 
          onClick={onClear}
          className="mt-4 w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors font-oriya"
        >
          <Trash2 size={20}/> {TRANSLATIONS.clearHistory}
        </button>
      )}
    </div>
  );
};

// --- CONVERTER COMPONENT ---
interface ConverterProps {
  onBack: () => void;
  category: ConverterCategory;
  setCategory: (c: ConverterCategory) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
}

const Converter: React.FC<ConverterProps> = ({ category, setCategory, inputValue, setInputValue }) => {
  const [unitFrom, setUnitFrom] = useState<string>('');
  const [unitTo, setUnitTo] = useState<string>('');

  useEffect(() => {
    // Defaults
    if (category === 'length') { setUnitFrom('m'); setUnitTo('km'); }
    if (category === 'weight') { setUnitFrom('kg'); setUnitTo('g'); }
    if (category === 'temperature') { setUnitFrom('C'); setUnitTo('F'); }
    if (category === 'data') { setUnitFrom('MB'); setUnitTo('GB'); }
    setInputValue('');
  }, [category, setInputValue]);

  const getResult = () => {
    if (!inputValue) return '0';
    const val = parseFloat(inputValue);
    if (isNaN(val)) return '0';
    const res = convertValue(val, unitFrom, unitTo, category || '');
    return Number.isInteger(res) ? res.toString() : res.toFixed(4).replace(/\.?0+$/, '');
  };

  const swapUnits = () => {
    const temp = unitFrom;
    setUnitFrom(unitTo);
    setUnitTo(temp);
  };

  const renderUnitOptions = (cat: string) => {
    let units: string[] = [];
    if (cat === 'length') units = ['m', 'km', 'cm', 'mm', 'ft', 'in'];
    if (cat === 'weight') units = ['kg', 'g', 'mg', 'lb', 'oz'];
    if (cat === 'temperature') units = ['C', 'F', 'K'];
    if (cat === 'data') units = ['B', 'KB', 'MB', 'GB'];

    return units.map(u => <option key={u} value={u} className="bg-white dark:bg-black text-black dark:text-white">{u}</option>);
  };

  if (!category) {
    // Grid View
    const items = [
      { id: 'length', label: TRANSLATIONS.length, icon: <Ruler size={28}/> },
      { id: 'weight', label: TRANSLATIONS.weight, icon: <Weight size={28}/> },
      { id: 'temperature', label: TRANSLATIONS.temp, icon: <Thermometer size={28}/> },
      { id: 'data', label: TRANSLATIONS.data, icon: <Box size={28}/> },
    ];

    return (
      <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-start animate-fade-in">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as ConverterCategory)}
            className="aspect-square bg-gray-50 dark:bg-[#1c1c1c] rounded-3xl flex flex-col items-center justify-center text-brand-orange hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-all hover:scale-105 active:scale-95 gap-3 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            {item.icon}
            <div className="text-center">
              <div className="text-gray-800 dark:text-white font-bold font-oriya text-lg">{item.label}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Specific Converter View
  return (
    <div className="flex-1 p-6 flex flex-col animate-slide-up">
      <button 
        onClick={() => setCategory(null)}
        className="flex items-center text-brand-orange mb-6 self-start text-sm font-bold font-oriya hover:opacity-80 transition-opacity"
      >
        <ChevronLeft size={20} className="mr-1" /> {TRANSLATIONS.back}
      </button>

      {/* Input Area */}
      <div className="flex flex-col gap-6">
        <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-3xl p-6 flex justify-between items-center border border-gray-100 dark:border-gray-800 relative shadow-inner">
          <div className="text-4xl font-semibold text-gray-800 dark:text-white font-oriya">{localize(inputValue) || localize('0')}</div>
          
          <div className="relative flex items-center">
            <select 
              value={unitFrom} 
              onChange={(e) => setUnitFrom(e.target.value)}
              className="bg-transparent text-brand-orange font-bold text-xl outline-none text-right appearance-none pr-6 z-10 cursor-pointer font-sans"
            >
              {renderUnitOptions(category)}
            </select>
            <ChevronDown size={16} className="absolute right-0 text-brand-orange pointer-events-none" />
          </div>
        </div>

        <div className="flex justify-center -my-2 z-10">
           <button 
             onClick={swapUnits}
             className="p-3 rounded-full bg-white dark:bg-[#2c2c2e] text-gray-400 dark:text-gray-500 hover:text-brand-orange shadow-md border border-gray-100 dark:border-gray-700 hover:scale-110 transition-all"
           >
             <ArrowRightLeft size={24} className="rotate-90" />
           </button>
        </div>

        <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-3xl p-6 flex justify-between items-center border border-gray-100 dark:border-gray-800 relative shadow-inner">
          <div className="text-4xl font-semibold text-brand-orange font-oriya">{localize(getResult())}</div>
          
          <div className="relative flex items-center">
            <select 
              value={unitTo} 
              onChange={(e) => setUnitTo(e.target.value)}
              className="bg-transparent text-brand-orange font-bold text-xl outline-none text-right appearance-none pr-6 z-10 cursor-pointer font-sans"
            >
              {renderUnitOptions(category)}
            </select>
            <ChevronDown size={16} className="absolute right-0 text-brand-orange pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---
const Calculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [showScientific, setShowScientific] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDark, setIsDark] = useState(true); 
  const [isSound, setIsSound] = useState(true);
  
  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Calculator Hooks
  const { expression, result, preview, history, handleInput, clear, deleteLast, calculate, loadHistoryItem, clearHistory } = useCalculator();

  // Converter State
  const [convCategory, setConvCategory] = useState<ConverterCategory>(null);
  const [convInput, setConvInput] = useState<string>('');

  const handleKeypadClick = (val: string) => {
    if (isSound) playClickSound();

    if (activeTab === 'calculator') {
      if (val === 'AC') clear();
      else if (val === 'DEL') deleteLast();
      else if (val === '=') calculate();
      else handleInput(val);
    } else {
      // Converter logic
      if (convCategory) {
        if (val === 'AC') setConvInput('');
        else if (val === 'DEL') setConvInput(prev => prev.slice(0, -1));
        else if (['+', '-', '×', '÷', '%', '='].includes(val)) {
           // Do nothing for operators in converter
        }
        else {
           setConvInput(prev => prev + val);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-black transition-colors duration-300 relative rounded-none md:rounded-[2.5rem] overflow-hidden border-0 md:border md:border-gray-200 md:dark:border-gray-800 md:shadow-2xl">
      <Header 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setConvCategory(null); }}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        isSound={isSound}
        toggleSound={() => setIsSound(!isSound)}
        toggleHistory={() => setShowHistory(true)}
        toggleScientific={() => setShowScientific(!showScientific)}
      />
      
      {/* Content Area */}
      {activeTab === 'calculator' ? (
        <Display expression={expression} result={result} preview={preview} />
      ) : (
        <Converter 
          onBack={() => setConvCategory(null)}
          category={convCategory}
          setCategory={setConvCategory}
          inputValue={convInput}
          setInputValue={setConvInput}
        />
      )}

      {/* Grid Container */}
      <div className="p-4 pb-8 md:p-6 md:pb-8 flex-1 grid grid-cols-4 gap-3 bg-white dark:bg-black z-10 transition-colors">
        
        {/* Row 1 */}
        <Button label={TRANSLATIONS.clear} variant="action" onClick={() => handleKeypadClick('AC')} className="text-xl" />
        <Button label={<Delete size={24}/>} variant="action" onClick={() => handleKeypadClick('DEL')} />
        <Button 
          label="%" 
          variant="operator" 
          onClick={() => handleKeypadClick('%')} 
          disabled={activeTab === 'converter'}
        />
        <Button 
          label="÷" 
          variant="operator" 
          onClick={() => handleKeypadClick('÷')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 2 */}
        <Button label={localize('7')} onClick={() => handleKeypadClick('7')} />
        <Button label={localize('8')} onClick={() => handleKeypadClick('8')} />
        <Button label={localize('9')} onClick={() => handleKeypadClick('9')} />
        <Button 
          label="×" 
          variant="operator" 
          onClick={() => handleKeypadClick('×')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 3 */}
        <Button label={localize('4')} onClick={() => handleKeypadClick('4')} />
        <Button label={localize('5')} onClick={() => handleKeypadClick('5')} />
        <Button label={localize('6')} onClick={() => handleKeypadClick('6')} />
        <Button 
          label="-" 
          variant="operator" 
          onClick={() => handleKeypadClick('-')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 4 */}
        <Button label={localize('1')} onClick={() => handleKeypadClick('1')} />
        <Button label={localize('2')} onClick={() => handleKeypadClick('2')} />
        <Button label={localize('3')} onClick={() => handleKeypadClick('3')} />
        <Button 
          label="+" 
          variant="operator" 
          onClick={() => handleKeypadClick('+')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 5 */}
        <Button 
          label={<GripHorizontal size={24}/>} 
          variant="scientific" 
          onClick={() => activeTab === 'calculator' && setShowScientific(!showScientific)}
          disabled={activeTab === 'converter'}
        />
        <Button label={localize('0')} onClick={() => handleKeypadClick('0')} />
        <Button label="." onClick={() => handleKeypadClick('.')} />
        <Button 
          label="=" 
          variant="accent" 
          onClick={() => handleKeypadClick('=')} 
          disabled={activeTab === 'converter'}
        />
      </div>

      {/* Scientific Drawer Overlay (Only for Calculator) */}
      {showScientific && activeTab === 'calculator' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-[#1c1c1c] rounded-t-[2rem] p-6 shadow-2xl animate-slide-up z-20 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
             <span className="text-lg font-bold text-gray-500 dark:text-gray-400 font-oriya">{TRANSLATIONS.scientific}</span>
             <button onClick={() => setShowScientific(false)} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-700 dark:text-white"><X size={20}/></button>
          </div>
          <div className="grid grid-cols-4 gap-4">
             <Button label="sin" variant="scientific" onClick={() => handleInput('sin(')} />
             <Button label="cos" variant="scientific" onClick={() => handleInput('cos(')} />
             <Button label="tan" variant="scientific" onClick={() => handleInput('tan(')} />
             <Button label="log" variant="scientific" onClick={() => handleInput('log(')} />
             <Button label="√" variant="scientific" onClick={() => handleInput('√(')} />
             <Button label="^" variant="scientific" onClick={() => handleInput('^')} />
             <Button label="(" variant="scientific" onClick={() => handleInput('(')} />
             <Button label=")" variant="scientific" onClick={() => handleInput(')')} />
             <Button label="π" variant="scientific" onClick={() => handleInput('π')} />
             <Button label="e" variant="scientific" onClick={() => handleInput('e')} />
          </div>
        </div>
      )}

      {/* History View Overlay */}
      {showHistory && (
        <HistoryView 
          history={history} 
          onClose={() => setShowHistory(false)} 
          onLoad={loadHistoryItem}
          onClear={clearHistory}
        />
      )}

    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-[100dvh] w-screen bg-black md:bg-gray-100 md:dark:bg-[#111] flex items-center justify-center transition-colors duration-300">
      <div className="w-full h-full md:max-w-md md:h-[85vh] md:max-h-[900px] relative">
        <Calculator />
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
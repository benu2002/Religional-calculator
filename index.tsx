import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Delete, X, GripHorizontal, 
  Ruler, Weight, Thermometer, Box, 
  ChevronLeft, ArrowRightLeft,
  Sun, Moon, Languages, Check, ChevronDown,
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
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Ignore audio errors
  }
};

// --- LANGUAGE DATA ---
type LanguageCode = 'en' | 'hi' | 'od' | 'bn' | 'te' | 'ta' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa';

interface LanguageData {
  name: string;
  nativeName: string;
  digits: string[];
  translations: {
    calculator: string;
    converter: string;
    clear: string;
    length: string;
    weight: string;
    temp: string;
    data: string;
    error: string;
    scientific: string;
    history: string;
  };
}

const LANGUAGES: Record<LanguageCode, LanguageData> = {
  en: {
    name: 'English',
    nativeName: 'English',
    digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    translations: { calculator: 'Calculator', converter: 'Converter', clear: 'AC', length: 'Length', weight: 'Weight', temp: 'Temp', data: 'Data', error: 'Error', scientific: 'Scientific', history: 'History' }
  },
  od: {
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    digits: ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'],
    translations: { calculator: 'କାଲକୁଲେଟର', converter: 'କନଭର୍ଟର', clear: 'ସଫା', length: 'ଦୈର୍ଘ୍ୟ', weight: 'ଓଜନ', temp: 'ତାପମାତ୍ରା', data: 'ଡାଟା', error: 'ତ୍ରୁଟି', scientific: 'ବୈଜ୍ଞାନିକ', history: 'ଇତିହାସ' }
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    digits: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
    translations: { calculator: 'कैलकुलेटर', converter: 'कन्वर्टर', clear: 'साफ़', length: 'लंबाई', weight: 'वजन', temp: 'तापमान', data: 'डेटा', error: 'त्रुटि', scientific: 'वैज्ञानिक', history: 'इतिहास' }
  },
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    digits: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
    translations: { calculator: 'ক্যালকুলেটর', converter: 'কনভার্টার', clear: 'মুছুন', length: 'দৈর্ঘ্য', weight: 'ওজন', temp: 'তাপমাত্রা', data: 'ডেটা', error: 'ত্রুটি', scientific: 'বৈজ্ঞানিক', history: 'ইতিহাস' }
  },
  mr: {
    name: 'Marathi',
    nativeName: 'मराठी',
    digits: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
    translations: { calculator: 'कॅल्क्युलेटर', converter: 'कन्व्हर्टर', clear: 'साफ', length: 'लांबी', weight: 'वजन', temp: 'तापमान', data: 'डेटा', error: 'त्रुटी', scientific: 'वैज्ञानिक', history: 'इतिहास' }
  },
  gu: {
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    digits: ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'],
    translations: { calculator: 'કેલ્ક્યુલેટર', converter: 'કન્વર્ટર', clear: 'સાફ', length: 'લંબાઈ', weight: 'વજન', temp: 'તાપમાન', data: 'ડેટા', error: 'ભૂલ', scientific: 'વૈજ્ઞાનિક', history: 'ઇતિહાસ' }
  },
  te: {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    digits: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'],
    translations: { calculator: 'కాలిక్యులేటర్', converter: 'కన్వర్టర్', clear: 'క్లియర్', length: 'పొడవు', weight: 'బరువు', temp: 'ఉష్ణోగ్రత', data: 'డేటా', error: 'లోపం', scientific: 'శాస్త్రీయ', history: 'చరిత్ర' }
  },
  ta: {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    digits: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],
    translations: { calculator: 'கால்குலேட்டர்', converter: 'மாற்றி', clear: 'அழி', length: 'நீளம்', weight: 'எடை', temp: 'வெப்பம்', data: 'தரவு', error: 'பிழை', scientific: 'அறிவியல்', history: 'வரலாறு' }
  },
  kn: {
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    digits: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'],
    translations: { calculator: 'ಕ್ಯಾಲ್ಕುಲೇಟರ್', converter: 'ಪರಿವರ್ತಕ', clear: 'ಅಳಿಸು', length: 'ಉದ್ದ', weight: 'ತೂಕ', temp: 'ತಾಪಮಾನ', data: 'ಡೇಟಾ', error: 'ದೋಷ', scientific: 'ವೈಜ್ಞಾನಿಕ', history: 'ಇತಿಹಾಸ' }
  },
  ml: {
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    digits: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'],
    translations: { calculator: 'കാൽക്കുലേറ്റർ', converter: 'കൺവെർട്ടർ', clear: 'മായ്‌ക്കുക', length: 'നീളം', weight: 'ഭാരം', temp: 'താപനില', data: 'ഡാറ്റ', error: 'പിശക്', scientific: 'ശാസ്ത്രീയ', history: 'ചരിത്രം' }
  },
  pa: {
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    digits: ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'],
    translations: { calculator: 'ਕੈਲਕੁਲੇਟਰ', converter: 'ਕਨਵਰਟਰ', clear: 'ਸਾਫ', length: 'ਲੰਬਾਈ', weight: 'ਭਾਰ', temp: 'ਤਾਪਮਾਨ', data: 'ਡਾਟਾ', error: 'ਗਲਤੀ', scientific: 'ਵਿਗਿਆਨਕ', history: 'ਇਤਿਹਾਸ' }
  }
};

// --- UTILS ---
const localize = (str: string | number, lang: LanguageCode): string => {
  if (str === null || str === undefined) return '';
  const digits = LANGUAGES[lang].digits;
  return String(str).replace(/[0-9]/g, (char) => digits[parseInt(char)] || char);
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
const useCalculator = (lang: LanguageCode) => {
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
        // Silently fail for preview
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
      setPreview(''); // Clear preview when final result is shown
      
      // Add to history
      setHistory(prev => [
        { id: Date.now().toString(), expression, result: formattedResult },
        ...prev
      ].slice(0, 50));

    } catch (error) {
      setResult(LANGUAGES[lang].translations.error); 
      setIsError(true);
      setPreview('');
    }
  }, [expression, lang]);

  const handleInput = useCallback((value: string) => {
    if (isError) {
      setExpression(value);
      setResult('');
      setPreview('');
      setIsError(false);
      return;
    }
    // If we just calculated a result and user types a number, start fresh
    // If user types operator, continue with result
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

const Display: React.FC<{ expression: string; result: string; preview: string; lang: LanguageCode }> = ({ expression, result, preview, lang }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [expression]);

  return (
    <div className="w-full flex-1 flex flex-col justify-end items-end p-6 pb-2 space-y-1 min-h-[180px]">
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto no-scrollbar text-right whitespace-nowrap"
      >
        <span className={`text-gray-800 dark:text-white font-semibold tracking-wide font-sans transition-all duration-300 ${result ? 'text-4xl opacity-70' : 'text-6xl'}`}>
          {localize(expression, lang) || localize('0', lang)}
        </span>
      </div>
      
      <div className="w-full text-right overflow-hidden text-ellipsis h-16">
        {result ? (
          <span className="text-6xl font-bold text-brand-orange animate-slide-up font-sans block">
            = {localize(result, lang)}
          </span>
        ) : preview ? (
          <span className="text-4xl font-medium text-gray-400 dark:text-gray-500 font-sans block transition-opacity duration-200">
            {localize(preview, lang)}
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

  let baseStyle = "rounded-xl text-2xl md:text-3xl font-bold flex items-center justify-center transition-all duration-100 select-none h-14 md:h-16 active:scale-90 active:shadow-inner";
  let colorStyle = "";

  if (disabled) {
    return (
      <div className={`${baseStyle} bg-transparent text-transparent ${className}`}>
        {label}
      </div>
    );
  }

  switch (variant) {
    case 'number':
      colorStyle = "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-[#1c1c1c] dark:text-white dark:hover:bg-[#2d2d2d] shadow-sm";
      break;
    case 'operator':
      colorStyle = "bg-gray-100 text-brand-orange hover:bg-gray-200 dark:bg-[#1c1c1c] dark:text-[#ff9f0a] dark:hover:bg-[#2d2d2d] shadow-sm";
      break;
    case 'action':
      colorStyle = "bg-gray-200 text-brand-orange hover:bg-gray-300 dark:bg-[#1c1c1c] dark:text-[#ff9f0a] dark:hover:bg-[#2d2d2d] shadow-sm"; 
      break;
    case 'accent':
      colorStyle = "bg-[#ff9f0a] text-white hover:bg-[#ffb03b] shadow-md shadow-orange-500/20"; 
      break;
    case 'scientific':
      colorStyle = "bg-gray-100 text-brand-orange hover:bg-gray-200 dark:bg-[#1c1c1c] dark:text-[#ff9f0a] dark:hover:bg-[#2d2d2d] text-lg font-bold shadow-sm";
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
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isSound: boolean;
  toggleSound: () => void;
  toggleHistory: () => void;
  toggleScientific: () => void;
}> = ({ activeTab, onTabChange, lang, setLang, isDark, toggleTheme, isSound, toggleSound, toggleHistory, toggleScientific }) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col w-full pt-4 px-4 bg-white dark:bg-black transition-colors z-30">
      
      {/* Top Bar with Controls */}
      <div className="flex justify-between items-center mb-2">
         {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors shadow-sm"
          >
            <Languages size={18} />
            <span className="text-sm font-bold">{LANGUAGES[lang].nativeName}</span>
          </button>

          {isLangOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 max-h-80 overflow-y-auto bg-white dark:bg-[#1c1c1c] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50 custom-scrollbar">
              {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setIsLangOpen(false); }}
                  className="w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#2d2d2d] text-gray-800 dark:text-gray-200"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{LANGUAGES[code].nativeName}</span>
                    <span className="text-xs text-gray-500">{LANGUAGES[code].name}</span>
                  </div>
                  {lang === code && <Check size={14} className="text-brand-orange" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
           <button 
            onClick={toggleScientific}
            className="p-2 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors shadow-sm md:hidden"
            aria-label="Toggle Scientific"
          >
            <FlaskConical size={20} />
          </button>
          
          <button 
            onClick={toggleHistory}
            className="p-2 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors shadow-sm"
            aria-label="History"
          >
            <History size={20} />
          </button>

          <button 
            onClick={toggleSound}
            className="p-2 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors shadow-sm"
            aria-label="Toggle Sound"
          >
            {isSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors shadow-sm"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Watermark */}
      <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 font-bold mb-2 tracking-[0.2em] uppercase opacity-70">
        Created by Benu
      </div>
      
      {/* Tab Switcher */}
      <div className="flex justify-center items-center gap-8 text-lg font-bold relative pb-2">
        <button 
          onClick={() => onTabChange('calculator')}
          className={`transition-colors duration-300 ${activeTab === 'calculator' ? 'text-brand-orange' : 'text-gray-400 dark:text-gray-600'}`}
        >
          {LANGUAGES[lang].translations.calculator}
        </button>
        <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-800"></div>
        <button 
          onClick={() => onTabChange('converter')}
          className={`transition-colors duration-300 ${activeTab === 'converter' ? 'text-brand-orange' : 'text-gray-400 dark:text-gray-600'}`}
        >
          {LANGUAGES[lang].translations.converter}
        </button>
      </div>
    </div>
  );
};

const HistoryView: React.FC<{ history: HistoryItem[]; onClose: () => void; onLoad: (item: HistoryItem) => void; onClear: () => void; lang: LanguageCode }> = ({ history, onClose, onLoad, onClear, lang }) => {
  return (
    <div className="absolute inset-0 bg-white/95 dark:bg-black/95 z-50 flex flex-col p-6 animate-fade-in backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{LANGUAGES[lang].translations.history}</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#1c1c1c] rounded-full text-gray-800 dark:text-white">
          <X size={24} />
        </button>
      </div>
      
      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
          No history yet
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {history.map((item) => (
            <button 
              key={item.id}
              onClick={() => { onLoad(item); onClose(); }}
              className="w-full bg-gray-50 dark:bg-[#1c1c1c] p-4 rounded-xl text-right hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors border border-gray-100 dark:border-gray-800"
            >
              <div className="text-xl text-gray-500 font-sans mb-1">{localize(item.expression, lang)}</div>
              <div className="text-3xl text-brand-orange font-bold font-sans">= {localize(item.result, lang)}</div>
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
         <button 
          onClick={onClear}
          className="mt-4 w-full py-4 bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={20}/> Clear History
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
  lang: LanguageCode;
}

const Converter: React.FC<ConverterProps> = ({ category, setCategory, inputValue, setInputValue, lang }) => {
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
      { id: 'length', label: LANGUAGES[lang].translations.length, icon: <Ruler size={28}/> },
      { id: 'weight', label: LANGUAGES[lang].translations.weight, icon: <Weight size={28}/> },
      { id: 'temperature', label: LANGUAGES[lang].translations.temp, icon: <Thermometer size={28}/> },
      { id: 'data', label: LANGUAGES[lang].translations.data, icon: <Box size={28}/> },
    ];

    return (
      <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-start animate-fade-in">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as ConverterCategory)}
            className="aspect-square bg-gray-100 dark:bg-[#1c1c1c] rounded-2xl flex flex-col items-center justify-center text-brand-orange hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-colors gap-3 shadow-sm"
          >
            {item.icon}
            <div className="text-center">
              <div className="text-gray-800 dark:text-white font-bold text-lg">{item.label}</div>
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
        className="flex items-center text-brand-orange mb-6 self-start text-sm font-bold"
      >
        <ChevronLeft size={18} className="mr-1" /> BACK
      </button>

      {/* Input Area */}
      <div className="flex flex-col gap-6">
        <div className="bg-gray-100 dark:bg-[#1c1c1c] rounded-2xl p-4 flex justify-between items-center border border-gray-200 dark:border-gray-800 relative shadow-sm">
          <div className="text-3xl font-semibold text-gray-800 dark:text-white font-sans">{localize(inputValue, lang) || localize('0', lang)}</div>
          
          <div className="relative flex items-center">
            <select 
              value={unitFrom} 
              onChange={(e) => setUnitFrom(e.target.value)}
              className="bg-transparent text-brand-orange font-bold text-xl outline-none text-right appearance-none pr-6 z-10 cursor-pointer"
            >
              {renderUnitOptions(category)}
            </select>
            <ChevronDown size={16} className="absolute right-0 text-brand-orange pointer-events-none" />
          </div>
        </div>

        <div className="flex justify-center">
           <button 
             onClick={swapUnits}
             className="p-3 rounded-full bg-gray-100 dark:bg-[#1c1c1c] text-gray-400 dark:text-gray-500 hover:text-brand-orange hover:bg-gray-200 dark:hover:bg-[#2d2d2d] transition-all active:scale-95 shadow-sm"
           >
             <ArrowRightLeft size={24} className="rotate-90" />
           </button>
        </div>

        <div className="bg-gray-100 dark:bg-[#1c1c1c] rounded-2xl p-4 flex justify-between items-center border border-gray-200 dark:border-gray-800 relative shadow-sm">
          <div className="text-3xl font-semibold text-brand-orange font-sans">{localize(getResult(), lang)}</div>
          
          <div className="relative flex items-center">
            <select 
              value={unitTo} 
              onChange={(e) => setUnitTo(e.target.value)}
              className="bg-transparent text-brand-orange font-bold text-xl outline-none text-right appearance-none pr-6 z-10 cursor-pointer"
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
  const [lang, setLang] = useState<LanguageCode>('od'); // Default to Odia
  const [isDark, setIsDark] = useState(true); // Default to Dark
  const [isSound, setIsSound] = useState(true);
  
  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Calculator Hooks
  const { expression, result, preview, history, handleInput, clear, deleteLast, calculate, loadHistoryItem, clearHistory } = useCalculator(lang);

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
    <div className="flex flex-col h-full max-w-lg mx-auto bg-white dark:bg-black transition-colors duration-300 relative">
      <Header 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setConvCategory(null); }}
        lang={lang}
        setLang={setLang}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        isSound={isSound}
        toggleSound={() => setIsSound(!isSound)}
        toggleHistory={() => setShowHistory(true)}
        toggleScientific={() => setShowScientific(!showScientific)}
      />
      
      {/* Content Area */}
      {activeTab === 'calculator' ? (
        <Display expression={expression} result={result} preview={preview} lang={lang} />
      ) : (
        <Converter 
          onBack={() => setConvCategory(null)}
          category={convCategory}
          setCategory={setConvCategory}
          inputValue={convInput}
          setInputValue={setConvInput}
          lang={lang}
        />
      )}

      {/* Grid Container */}
      <div className="p-4 pb-8 grid grid-cols-4 gap-3 flex-none bg-white dark:bg-black z-10 transition-colors">
        
        {/* Row 1 */}
        <Button label={LANGUAGES[lang].translations.clear} variant="action" onClick={() => handleKeypadClick('AC')} className="text-lg" />
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
        <Button label={localize('7', lang)} onClick={() => handleKeypadClick('7')} />
        <Button label={localize('8', lang)} onClick={() => handleKeypadClick('8')} />
        <Button label={localize('9', lang)} onClick={() => handleKeypadClick('9')} />
        <Button 
          label="×" 
          variant="operator" 
          onClick={() => handleKeypadClick('×')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 3 */}
        <Button label={localize('4', lang)} onClick={() => handleKeypadClick('4')} />
        <Button label={localize('5', lang)} onClick={() => handleKeypadClick('5')} />
        <Button label={localize('6', lang)} onClick={() => handleKeypadClick('6')} />
        <Button 
          label="-" 
          variant="operator" 
          onClick={() => handleKeypadClick('-')} 
          disabled={activeTab === 'converter'}
        />

        {/* Row 4 */}
        <Button label={localize('1', lang)} onClick={() => handleKeypadClick('1')} />
        <Button label={localize('2', lang)} onClick={() => handleKeypadClick('2')} />
        <Button label={localize('3', lang)} onClick={() => handleKeypadClick('3')} />
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
        <Button label={localize('0', lang)} onClick={() => handleKeypadClick('0')} />
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
        <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-[#1c1c1c] rounded-t-3xl p-5 shadow-2xl animate-slide-up z-20 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{LANGUAGES[lang].translations.scientific}</span>
             <button onClick={() => setShowScientific(false)} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-700 dark:text-white"><X size={16}/></button>
          </div>
          <div className="grid grid-cols-4 gap-3">
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
          lang={lang}
        />
      )}

    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="h-full w-full bg-white dark:bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-md bg-white dark:bg-black shadow-2xl overflow-hidden">
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
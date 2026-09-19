import React, { useState, useEffect } from 'react';
import { UnitFormat, PrototypeStyle } from '../core/types';
import {
  parseMeasurement,
  toFractionalParts,
  formatInchesFraction,
  formatMeasurement,
  partsToInches,
} from '../core/units';
import { Check, X, ArrowRight, ArrowLeft, Keyboard, SlidersHorizontal, Target, Delete, CheckCircle2 } from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { triggerHaptic } from '../core/haptics';

interface FractionKeypadProps {
  isOpen: boolean;
  stationDistanceFt: number;
  currentReadingInches: number | null;
  datumOffsetInches?: number;
  targetReadingInches?: number | null;
  actionText?: string;
  unitFormat?: UnitFormat;
  fractionResolution?: 16 | 8 | 32;
  stationIndex?: number;
  totalStations?: number;
  tutorialHint?: string;
  tutorialSaveButtonLabel?: string;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
  onSave: (valInches: number | null) => void;
  onSaveAndNext?: (valInches: number | null) => void;
  onSaveAndPrev?: (valInches: number | null) => void;
  onClose: () => void;
}

const FRACTIONS_16 = [
  { label: '0', num: 0, den: 1 },
  { label: '1/16', num: 1, den: 16 },
  { label: '1/8', num: 1, den: 8 },
  { label: '3/16', num: 3, den: 16 },
  { label: '1/4', num: 1, den: 4 },
  { label: '5/16', num: 5, den: 16 },
  { label: '3/8', num: 3, den: 8 },
  { label: '7/16', num: 7, den: 16 },
  { label: '1/2', num: 1, den: 2 },
  { label: '9/16', num: 9, den: 16 },
  { label: '5/8', num: 5, den: 8 },
  { label: '11/16', num: 11, den: 16 },
  { label: '3/4', num: 3, den: 4 },
  { label: '13/16', num: 13, den: 16 },
  { label: '7/8', num: 7, den: 8 },
  { label: '15/16', num: 15, den: 16 },
];

const FRACTIONS_8 = [
  { label: '0', num: 0, den: 1 },
  { label: '1/8', num: 1, den: 8 },
  { label: '1/4', num: 1, den: 4 },
  { label: '3/8', num: 3, den: 8 },
  { label: '1/2', num: 1, den: 2 },
  { label: '5/8', num: 5, den: 8 },
  { label: '3/4', num: 3, den: 4 },
  { label: '7/8', num: 7, den: 8 },
];

export const FractionKeypad: React.FC<FractionKeypadProps> = ({
  isOpen,
  stationDistanceFt,
  currentReadingInches,
  datumOffsetInches,
  targetReadingInches,
  actionText,
  unitFormat = 'decimal_inches',
  fractionResolution = 16,
  stationIndex,
  totalStations,
  tutorialHint,
  tutorialSaveButtonLabel,
  prototypeStyle = 'nothing',
  isDarkMode: _isDarkMode = true,
  onSave,
  onSaveAndNext,
  onSaveAndPrev,
  onClose,
}) => {
  useBodyScrollLock(isOpen);
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [directText, setDirectText] = useState('');
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; id: number } | null>(null);
  const [pulseDistance, setPulseDistance] = useState(false);
  const prevDistRef = React.useRef(stationDistanceFt);
  const isFreshInputRef = React.useRef(false);

  // Track if user has entered/selected a measurement (starts false if station reading is null)
  const [hasEnteredValue, setHasEnteredValue] = useState(false);

  // Feet & Inches fractional state
  const [feet, setFeet] = useState(1);
  const [inches, setInches] = useState(0);
  const [totalInchesOnly, setTotalInchesOnly] = useState(12);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(1);

  // Decimal & Metric state (string for keypad typing)
  const [decimalInputStr, setDecimalInputStr] = useState('');
  const [metricInputStr, setMetricInputStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentReadingInches !== null && !isNaN(currentReadingInches)) {
        setHasEnteredValue(true);
        isFreshInputRef.current = true;
        const parts = toFractionalParts(currentReadingInches, fractionResolution);
        setFeet(parts.feet);
        setInches(parts.inches);
        setTotalInchesOnly(parts.feet * 12 + parts.inches);
        setNumerator(parts.numerator);
        setDenominator(parts.denominator);
        const str = currentReadingInches.toString();
        setDecimalInputStr(str.includes('.') && str.split('.')[1].length > 3 ? currentReadingInches.toFixed(3) : str);
        setMetricInputStr((currentReadingInches * 25.4).toFixed(1));
        setDirectText(formatMeasurement(currentReadingInches, unitFormat, fractionResolution));
      } else {
        // Default reading is blank: no selection until user taps a number
        setHasEnteredValue(false);
        isFreshInputRef.current = false;
        setFeet(1);
        setInches(0);
        setTotalInchesOnly(12);
        setNumerator(0);
        setDenominator(1);
        setDecimalInputStr('');
        setMetricInputStr('');
        setDirectText('');
      }
    }
  }, [isOpen, stationDistanceFt, currentReadingInches, unitFormat, fractionResolution]);

  // Pulse animation on distance change
  useEffect(() => {
    if (prevDistRef.current !== stationDistanceFt) {
      setPulseDistance(true);
      const timer = setTimeout(() => setPulseDistance(false), 400);
      prevDistRef.current = stationDistanceFt;
      return () => clearTimeout(timer);
    }
  }, [stationDistanceFt]);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      setToastMessage(null);
      setNavDirection(null);
    }
  }, [isOpen]);

  // Calculate current computed inches based on active unit mode
  let currentComputedInches: number | null = null;

  if (useDirectInput) {
    currentComputedInches = parseMeasurement(directText);
  } else if (unitFormat === 'decimal_inches') {
    if (hasEnteredValue && decimalInputStr.trim() !== '') {
      const val = parseFloat(decimalInputStr);
      currentComputedInches = !isNaN(val) ? val : null;
    }
  } else if (unitFormat === 'metric_mm') {
    if (hasEnteredValue && metricInputStr.trim() !== '') {
      const valMm = parseFloat(metricInputStr);
      currentComputedInches = !isNaN(valMm) ? valMm / 25.4 : null;
    }
  } else if (unitFormat === 'inches_fraction') {
    if (hasEnteredValue) {
      const frac = denominator > 0 ? numerator / denominator : 0;
      currentComputedInches = totalInchesOnly + frac;
    }
  } else {
    if (hasEnteredValue) {
      currentComputedInches = partsToInches(feet, inches, numerator, denominator);
    }
  }

  // Handle Nudges
  const handleNudge = (deltaInches: number) => {
    triggerHaptic('light');
    isFreshInputRef.current = false;
    setHasEnteredValue(true);
    const current = currentComputedInches ?? 12.0;
    const nextVal = Math.max(0, current + deltaInches);
    const parts = toFractionalParts(nextVal, fractionResolution);
    setFeet(parts.feet);
    setInches(parts.inches);
    setTotalInchesOnly(parts.feet * 12 + parts.inches);
    setNumerator(parts.numerator);
    setDenominator(parts.denominator);
    setDecimalInputStr(nextVal.toFixed(3));
    setMetricInputStr((nextVal * 25.4).toFixed(1));
    setDirectText(formatMeasurement(nextVal, unitFormat, fractionResolution));
  };

  // Touch & Keyboard Numeric Keypad typing for Decimal & Metric
  const handleKeypadDigit = (digit: string) => {
    triggerHaptic('selection');
    setHasEnteredValue(true);
    if (isFreshInputRef.current) {
      isFreshInputRef.current = false;
      if (unitFormat === 'decimal_inches') {
        setDecimalInputStr(digit === '.' ? '0.' : digit);
      } else if (unitFormat === 'metric_mm') {
        setMetricInputStr(digit === '.' ? '0.' : digit);
      }
      return;
    }
    if (unitFormat === 'decimal_inches') {
      setDecimalInputStr((prev) => {
        if (digit === '.') {
          if (prev.includes('.')) return prev;
          return prev === '' ? '0.' : prev + '.';
        }
        return prev === '0' || prev === '' ? digit : prev + digit;
      });
    } else if (unitFormat === 'metric_mm') {
      setMetricInputStr((prev) => {
        if (digit === '.') {
          if (prev.includes('.')) return prev;
          return prev === '' ? '0.' : prev + '.';
        }
        return prev === '0' || prev === '' ? digit : prev + digit;
      });
    }
  };

  const handleKeypadBackspace = () => {
    triggerHaptic('light');
    isFreshInputRef.current = false;
    if (unitFormat === 'decimal_inches') {
      if (decimalInputStr.length <= 1) {
        setDecimalInputStr('');
        setHasEnteredValue(false);
      } else {
        setDecimalInputStr((prev) => prev.slice(0, -1));
      }
    } else if (unitFormat === 'metric_mm') {
      if (metricInputStr.length <= 1) {
        setMetricInputStr('');
        setHasEnteredValue(false);
      } else {
        setMetricInputStr((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleKeypadClear = () => {
    triggerHaptic('warning');
    isFreshInputRef.current = false;
    setHasEnteredValue(false);
    setDecimalInputStr('');
    setMetricInputStr('');
    setDirectText('');
  };

  const handleSave = () => {
    triggerHaptic('success');
    onSave(currentComputedInches);
  };

  const handleSaveAndNext = () => {
    triggerHaptic('success');

    const savedFormatted = currentComputedInches !== null
      ? formatMeasurement(currentComputedInches, unitFormat, fractionResolution)
      : 'Cleared';

    setNavDirection('next');
    setToastMessage({
      text: `✓ Saved ${stationDistanceFt} ft (${savedFormatted})`,
      id: Date.now(),
    });

    if (onSaveAndNext) {
      onSaveAndNext(currentComputedInches);
    } else {
      onSave(currentComputedInches);
    }
  };

  const handleSaveAndPrev = () => {
    triggerHaptic('success');

    const savedFormatted = currentComputedInches !== null
      ? formatMeasurement(currentComputedInches, unitFormat, fractionResolution)
      : 'Cleared';

    setNavDirection('prev');
    setToastMessage({
      text: `✓ Saved ${stationDistanceFt} ft (${savedFormatted})`,
      id: Date.now(),
    });

    if (onSaveAndPrev) {
      onSaveAndPrev(currentComputedInches);
    } else {
      onSave(currentComputedInches);
    }
  };

  const fractionsList = fractionResolution === 8 ? FRACTIONS_8 : FRACTIONS_16;

  // Ref for keyboard event listener to avoid stale closures
  const stateRef = React.useRef({
    isOpen,
    useDirectInput,
    unitFormat,
    fractionResolution,
    currentComputedInches,
    handleSave,
    handleSaveAndNext,
    handleSaveAndPrev,
    handleKeypadDigit,
    handleKeypadBackspace,
    handleKeypadClear,
    handleNudge,
    onClose,
  });

  stateRef.current = {
    isOpen,
    useDirectInput,
    unitFormat,
    fractionResolution,
    currentComputedInches,
    handleSave,
    handleSaveAndNext,
    handleSaveAndPrev,
    handleKeypadDigit,
    handleKeypadBackspace,
    handleKeypadClear,
    handleNudge,
    onClose,
  };

  // Physical desktop keyboard & Numpad support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // Escape closes keypad
      if (e.key === 'Escape') {
        e.preventDefault();
        stateRef.current.onClose();
        return;
      }

      // Enter or NumpadEnter saves & advances
      if (e.key === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (onSaveAndNext) {
          stateRef.current.handleSaveAndNext();
        } else {
          stateRef.current.handleSave();
        }
        return;
      }

      // If user is focused inside a text input, let native text typing handle other keys
      if (isInputFocused) return;

      // Digits 0-9 (standard keyboard & numpad)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const { unitFormat } = stateRef.current;
        if (unitFormat === 'decimal_inches' || unitFormat === 'metric_mm') {
          stateRef.current.handleKeypadDigit(e.key);
        } else {
          // In fractional mode, switch to direct input and start typing
          setUseDirectInput(true);
          setDirectText(e.key);
          setHasEnteredValue(true);
        }
        return;
      }

      // Decimal point: '.' or ',' or NumpadDecimal
      if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        const { unitFormat } = stateRef.current;
        if (unitFormat === 'decimal_inches' || unitFormat === 'metric_mm') {
          stateRef.current.handleKeypadDigit('.');
        } else {
          setUseDirectInput(true);
          setDirectText('.');
          setHasEnteredValue(true);
        }
        return;
      }

      // Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        stateRef.current.handleKeypadBackspace();
        return;
      }

      // Delete or 'c' to clear
      if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        stateRef.current.handleKeypadClear();
        return;
      }

      // Nudge Up: '+' or '=' or NumpadAdd or ArrowUp
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || e.key === 'ArrowUp') {
        e.preventDefault();
        const { unitFormat, fractionResolution } = stateRef.current;
        if (unitFormat === 'metric_mm') {
          stateRef.current.handleNudge(1 / 25.4);
        } else if (unitFormat === 'decimal_inches') {
          stateRef.current.handleNudge(0.1);
        } else {
          stateRef.current.handleNudge(1 / fractionResolution);
        }
        return;
      }

      // Nudge Down: '-' or NumpadSubtract or ArrowDown
      if (e.key === '-' || e.code === 'NumpadSubtract' || e.key === 'ArrowDown') {
        e.preventDefault();
        const { unitFormat, fractionResolution } = stateRef.current;
        if (unitFormat === 'metric_mm') {
          stateRef.current.handleNudge(-1 / 25.4);
        } else if (unitFormat === 'decimal_inches') {
          stateRef.current.handleNudge(-0.1);
        } else {
          stateRef.current.handleNudge(-1 / fractionResolution);
        }
        return;
      }

      // Quick Station Navigation: ArrowLeft (Prev) / ArrowRight (Next)
      if (e.key === 'ArrowLeft' && onSaveAndPrev) {
        e.preventDefault();
        stateRef.current.handleSaveAndPrev();
        return;
      }

      if (e.key === 'ArrowRight' && onSaveAndNext) {
        e.preventDefault();
        stateRef.current.handleSaveAndNext();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isOpen, onSaveAndNext, onSaveAndPrev]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-3 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh] overscroll-contain touch-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Station & Target Measurement info */}
        <div className={`px-3.5 py-2 sm:px-4 sm:py-3 flex items-center justify-between border-b shrink-0 ${
          prototypeStyle === 'nothing'
            ? 'bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
            : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {prototypeStyle === 'nothing' && (
                <span className="w-2 h-2 rounded-full bg-[#D71921] shrink-0" />
              )}
              <span className={`text-[10px] uppercase tracking-wider font-bold whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-zinc-500' : 'text-zinc-500'
              }`}>
                {prototypeStyle === 'nothing' ? '[ RECORDING STATION ]' : 'Recording Station'}
              </span>
              {stationIndex !== undefined && totalStations !== undefined && (
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded whitespace-nowrap shrink-0 ${
                  prototypeStyle === 'nothing'
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 font-["Space_Mono"]'
                    : 'text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800'
                }`}>
                  Tie {stationIndex} of {totalStations}
                </span>
              )}
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing'
                  ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-200/60 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-["Space_Mono"]'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
              }`}>
                {unitFormat === 'decimal_inches'
                  ? 'Decimal In'
                  : unitFormat === 'metric_mm'
                  ? 'Metric mm'
                  : unitFormat === 'inches_fraction'
                  ? 'Inches Fraction'
                  : 'Feet & Inches'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xl font-extrabold inline-block rounded-md px-1 -ml-1 transition-all whitespace-nowrap shrink-0 ${
                prototypeStyle === 'nothing'
                  ? 'font-["Space_Mono"] text-zinc-950 dark:text-white tracking-wide'
                  : 'text-amber-500 dark:text-amber-400 font-mono'
              } ${pulseDistance ? 'animate-pulse-highlight bg-[#D71921]/20 ring-2 ring-[#D71921]' : ''}`}>
                {prototypeStyle === 'nothing' ? `[ STATION ${stationDistanceFt} FT ]` : `${stationDistanceFt} ft`}
              </span>
              {targetReadingInches !== null && targetReadingInches !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap shrink-0 ${
                  prototypeStyle === 'nothing'
                    ? 'text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 font-["Space_Mono"]'
                    : 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30'
                }`}>
                  <Target className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#D71921]' : 'text-sky-500'}`} />
                  <span>Target: {formatMeasurement(targetReadingInches, unitFormat, fractionResolution)}</span>
                  {actionText && <span className="font-sans font-normal opacity-80 whitespace-nowrap">({actionText})</span>}
                </div>
              )}
            </div>
          </div>
          {prototypeStyle === 'nothing' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-['Space_Mono'] font-bold tracking-wider uppercase rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-[#D71921] hover:text-[#D71921] transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Close"
            >
              [ Close ]
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Practice Tutorial Guidance Banner inside Keypad */}
        {tutorialHint && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-semibold shrink-0 animate-in fade-in">
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-mono font-black uppercase shrink-0">
              Tutorial
            </span>
            <span className="flex-1 leading-snug">{tutorialHint}</span>
          </div>
        )}

        {/* Animated Saved Toast Banner */}
        {toastMessage && (
          <div
            key={toastMessage.id}
            className="animate-station-toast bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Animated Station Content Container */}
        <div
          key={`${stationDistanceFt}-${navDirection || 'init'}`}
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            navDirection === 'next'
              ? 'animate-slide-in-right'
              : navDirection === 'prev'
              ? 'animate-slide-in-left'
              : ''
          }`}
        >
          {/* Live Readout Display */}
          <div className="bg-zinc-50 dark:bg-black p-2.5 sm:p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center shrink-0">
            <div className="flex items-center justify-between w-full max-w-xs mb-0.5 sm:mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span className={prototypeStyle === 'nothing' ? 'font-["Space_Mono"]' : ''}>
                {prototypeStyle === 'nothing' ? '[ ROD READING ]' : 'Tape / Rod Reading'}
              </span>
              {currentReadingInches !== null ? (
                <span className="font-mono text-zinc-600 dark:text-zinc-300 font-semibold normal-case text-[11px] sm:text-xs">
                  Last: {formatMeasurement(currentReadingInches, unitFormat, fractionResolution)}
                </span>
              ) : (
                <span className={`font-normal italic normal-case text-[11px] sm:text-xs ${prototypeStyle === 'nothing' ? 'text-zinc-400 font-["Space_Mono"]' : 'font-mono text-amber-600 dark:text-amber-400/80'}`}>
                  New Reading
                </span>
              )}
            </div>
          <div className={`text-2xl sm:text-4xl font-extrabold tracking-tight text-center min-h-[34px] sm:min-h-[44px] flex items-center justify-center ${
            prototypeStyle === 'nothing'
              ? 'font-["Doto",monospace] text-zinc-950 dark:text-white tracking-widest'
              : 'text-zinc-900 dark:text-zinc-100 font-mono'
          }`}>
            {currentComputedInches !== null ? (
              <>
                <span>{formatMeasurement(currentComputedInches, unitFormat, fractionResolution)}</span>
                {unitFormat === 'feet_inches_fraction' && (
                  <span className="text-sm sm:text-base text-zinc-500 font-normal ml-2 sm:ml-3">
                    ({formatInchesFraction(currentComputedInches, fractionResolution)})
                  </span>
                )}
                {unitFormat === 'metric_mm' && (
                  <span className="text-sm sm:text-base text-zinc-500 font-normal ml-2 sm:ml-3">
                    ({currentComputedInches.toFixed(3)}")
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 italic text-xl sm:text-2xl font-normal font-sans">
                Tap numbers to set
              </span>
            )}
          </div>

          {datumOffsetInches !== undefined && datumOffsetInches !== 0 && currentComputedInches !== null && (
            <div className={`mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-mono px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl border inline-block text-center max-w-full ${
              prototypeStyle === 'nothing'
                ? 'text-zinc-300 bg-zinc-900 border-zinc-700 font-["Space_Mono"]'
                : 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20'
            }`}>
              Normalized: <strong>{formatMeasurement(currentComputedInches - datumOffsetInches, unitFormat, fractionResolution)}</strong>{' '}
              <span className="whitespace-nowrap">
                ({datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(datumOffsetInches, unitFormat, fractionResolution)} shift)
              </span>
            </div>
          )}

          {/* Quick +/- Nudge Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-3 w-full justify-center flex-wrap">
            <span className={`text-[11px] sm:text-xs font-medium mr-0.5 sm:mr-1 ${prototypeStyle === 'nothing' ? 'font-["Space_Mono"] text-[10px] sm:text-[11px] text-zinc-500' : 'text-zinc-500'}`}>
              Nudge:
            </span>
            {unitFormat === 'metric_mm' ? (
              <>
                {[-10, -1, 1, 10].map(val => (
                  <button
                    key={val}
                    onClick={() => handleNudge(val / 25.4)}
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                      prototypeStyle === 'nothing'
                        ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {val > 0 ? `+${val}mm` : `${val}mm`}
                  </button>
                ))}
              </>
            ) : unitFormat === 'decimal_inches' ? (
              <>
                {[-1.0, -0.1, 0.1, 1.0].map(val => (
                  <button
                    key={val}
                    onClick={() => handleNudge(val)}
                    className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                      prototypeStyle === 'nothing'
                        ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {val > 0 ? `+${val.toFixed(1)}"` : `${val.toFixed(1)}"`}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNudge(-0.25)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                      : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  -1/4"
                </button>
                <button
                  onClick={() => handleNudge(-1 / fractionResolution)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                      : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  -1/{fractionResolution}"
                </button>
                <button
                  onClick={() => handleNudge(1 / fractionResolution)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                      : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  +1/{fractionResolution}"
                </button>
                <button
                  onClick={() => handleNudge(0.25)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg active:scale-95 transition cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                      : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  +1/4"
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleKeypadClear}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg active:scale-95 transition ml-0.5 sm:ml-1 cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 hover:text-[#D71921] hover:border-[#D71921] dark:text-zinc-400 font-["Space_Mono"]'
                  : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Clear measurement (set to blank)"
            >
              Clear
            </button>
            <button
              onClick={() => setUseDirectInput(!useDirectInput)}
              className={`ml-auto p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200 dark:bg-zinc-900'
              }`}
              title={useDirectInput ? 'Switch to Touch Keypad' : 'Switch to Direct Keyboard Typing'}
            >
              {useDirectInput ? <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Picker / Input Area - Adapts completely to selected unit format */}
        <div className="p-2.5 sm:p-4 modal-scroll-container flex-1 min-h-0 space-y-2 sm:space-y-3.5">
          {useDirectInput ? (
            <div className="space-y-2 py-3 sm:py-4">
              <label className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Type measurement (e.g. 1' 4 3/8", 16 3/8", 16.375, 360mm):
              </label>
              <input
                type="text"
                value={directText}
                onChange={(e) => {
                  setDirectText(e.target.value);
                  setHasEnteredValue(e.target.value.trim().length > 0);
                }}
                placeholder="e.g. 1' 2 3/8"
                autoFocus
                className="w-full text-lg sm:text-xl font-mono p-2.5 sm:p-3 rounded-xl border-2 border-amber-500 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 outline-none shadow-inner"
              />
              <p className="text-[11px] sm:text-xs text-zinc-500">
                Accepts feet & inches (`1' 4 3/8"`), fractional inches (`16 3/8`), decimals (`14.5`), or metric (`365mm`).
              </p>
            </div>
          ) : unitFormat === 'decimal_inches' ? (
            /* DECIMAL INCHES TOUCH KEYPAD */
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {prototypeStyle === 'nothing' ? '[ DECIMAL INCHES NUMPAD ]' : 'Decimal Inches Keypad'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {hasEnteredValue && decimalInputStr ? `Input: ${decimalInputStr}"` : 'Tap to enter'}
                </span>
              </div>

              {/* Number Touch Keypad */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(digit)}
                    className={`h-10 sm:h-12 rounded-lg text-lg font-bold transition shadow-xs active:scale-95 cursor-pointer ${
                      prototypeStyle === 'nothing'
                        ? 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 hover:border-[#D71921] hover:text-[#D71921] active:bg-[#D71921] active:text-white font-["Space_Mono"]'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-black border border-zinc-200 dark:border-zinc-800 font-mono'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className={`h-10 sm:h-12 rounded-lg text-base font-bold flex items-center justify-center transition shadow-xs active:scale-95 cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] active:bg-[#D71921] active:text-white font-["Space_Mono"]'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-500 hover:text-white'
                  }`}
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <div className="hidden sm:flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5">
                <span>⌨️ Desktop: type on Numpad/Keyboard • Enter to Save • Esc to Close</span>
              </div>
            </div>
          ) : unitFormat === 'metric_mm' ? (
            /* METRIC (MM) TOUCH KEYPAD */
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {prototypeStyle === 'nothing' ? '[ METRIC MM NUMPAD ]' : 'Millimeter Keypad'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {hasEnteredValue && metricInputStr ? `Input: ${metricInputStr} mm` : 'Tap to enter'}
                </span>
              </div>

              {/* Number Touch Keypad */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(digit)}
                    className={`h-10 sm:h-12 rounded-lg text-lg font-bold transition shadow-xs active:scale-95 cursor-pointer ${
                      prototypeStyle === 'nothing'
                        ? 'bg-zinc-100 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 hover:border-[#D71921] hover:text-[#D71921] active:bg-[#D71921] active:text-white font-["Space_Mono"]'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-black border border-zinc-200 dark:border-zinc-800 font-mono'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className={`h-10 sm:h-12 rounded-lg text-base font-bold flex items-center justify-center transition shadow-xs active:scale-95 cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-[#D71921] hover:text-[#D71921] active:bg-[#D71921] active:text-white font-["Space_Mono"]'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-500 hover:text-white'
                  }`}
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <div className="hidden sm:flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono pt-0.5">
                <span>⌨️ Desktop: type on Numpad/Keyboard • Enter to Save • Esc to Close</span>
              </div>
            </div>
          ) : unitFormat === 'inches_fraction' ? (
            /* TOTAL INCHES + FRACTION (No feet column) */
            <>
              {/* Whole Inches Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Total Inches
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTotalInchesOnly((prev) => Math.max(0, prev - 1));
                        setHasEnteredValue(true);
                      }}
                      className="px-2 py-0.5 text-xs font-bold rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      -1"
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTotalInchesOnly((prev) => prev + 1);
                        setHasEnteredValue(true);
                      }}
                      className="px-2 py-0.5 text-xs font-bold rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      +1"
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((inch) => {
                    const isSelected = hasEnteredValue && totalInchesOnly === inch;
                    return (
                      <button
                        key={inch}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setTotalInchesOnly(inch);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? prototypeStyle === 'nothing'
                              ? 'bg-[#D71921] text-white font-black shadow-sm font-["Space_Mono"]'
                              : 'bg-amber-500 text-black font-extrabold shadow-sm'
                            : prototypeStyle === 'nothing'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 border border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {inch}"
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fraction Grid */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Fraction (1/{fractionResolution}" increments)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {fractionsList.map((frac) => {
                    const isSelected =
                      hasEnteredValue &&
                      ((numerator === 0 && frac.num === 0) ||
                        (numerator === frac.num && denominator === frac.den));

                    return (
                      <button
                        key={frac.label}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setNumerator(frac.num);
                          setDenominator(frac.den);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-mono font-bold text-xs transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? prototypeStyle === 'nothing'
                              ? 'bg-[#D71921] text-white font-black shadow-md border border-[#D71921] font-["Space_Mono"]'
                              : 'bg-amber-500 text-black font-black shadow-md ring-2 ring-amber-400'
                            : prototypeStyle === 'nothing'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:border-zinc-500 border border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {frac.label === '0' ? '0 (even)' : frac.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* FEET & INCHES FRACTION KEYPAD */
            <>
              {/* Feet Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Feet (ft)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((f) => {
                    const isSelected = hasEnteredValue && feet === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setFeet(f);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? prototypeStyle === 'nothing'
                              ? 'bg-[#D71921] text-white font-black shadow-sm font-["Space_Mono"]'
                              : 'bg-amber-500 text-black font-extrabold shadow-sm'
                            : prototypeStyle === 'nothing'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 border border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {f}'
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inches Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Inches (in)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i).map((inch) => {
                    const isSelected = hasEnteredValue && inches === inch;
                    return (
                      <button
                        key={inch}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setInches(inch);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? prototypeStyle === 'nothing'
                              ? 'bg-[#D71921] text-white font-black shadow-sm font-["Space_Mono"]'
                              : 'bg-amber-500 text-black font-extrabold shadow-sm'
                            : prototypeStyle === 'nothing'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-500 border border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {inch}"
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fraction Grid */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Fraction (1/{fractionResolution}" increments)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {fractionsList.map((frac) => {
                    const isSelected =
                      hasEnteredValue &&
                      ((numerator === 0 && frac.num === 0) ||
                        (numerator === frac.num && denominator === frac.den));

                    return (
                      <button
                        key={frac.label}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setNumerator(frac.num);
                          setDenominator(frac.den);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-mono font-bold text-xs transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? prototypeStyle === 'nothing'
                              ? 'bg-[#D71921] text-white font-black shadow-md border border-[#D71921] font-["Space_Mono"]'
                              : 'bg-amber-500 text-black font-black shadow-md ring-2 ring-amber-400'
                            : prototypeStyle === 'nothing'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:border-zinc-500 border border-zinc-200 dark:border-zinc-800 font-["Space_Mono"]'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {frac.label === '0' ? '0 (even)' : frac.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        {/* End of Animated Station Content Container */}
        </div>

        {/* Footer Actions */}
        <div className={`p-2 sm:p-3 border-t flex items-center gap-2 shrink-0 ${
          prototypeStyle === 'nothing'
            ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
            : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
        }`}>
          {onSaveAndPrev && (
            <button
              onClick={handleSaveAndPrev}
              className={`group px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-lg font-bold transition active:scale-95 flex items-center justify-center cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:border-[#D71921] hover:text-[#D71921] font-["Space_Mono"]'
                  : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-800'
              }`}
              title="Save and go to previous station"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1 group-active:-translate-x-2" />
            </button>
          )}

          {tutorialSaveButtonLabel ? (
            <button
              onClick={onSaveAndNext ? handleSaveAndNext : handleSave}
              className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'bg-[#D71921] hover:bg-[#b01319] text-white font-["Space_Mono"]'
                  : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{tutorialSaveButtonLabel}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                  prototypeStyle === 'nothing'
                    ? 'bg-[#D71921] hover:bg-[#b01319] text-white font-["Space_Mono"]'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white text-sm'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {prototypeStyle === 'nothing' ? '[ Save ]' : 'Save'}
              </button>

              {onSaveAndNext && (
                <button
                  onClick={handleSaveAndNext}
                  className={`group flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                    prototypeStyle === 'nothing'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border border-zinc-700 dark:border-zinc-300 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-["Space_Mono"]'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-black font-extrabold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100'
                  }`}
                >
                  <span>{prototypeStyle === 'nothing' ? '[ Next Station ]' : 'Next Station'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 group-active:translate-x-2" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

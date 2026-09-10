import React, { useState, useEffect } from 'react';
import { UnitFormat } from '../core/types';
import {
  parseMeasurement,
  toFractionalParts,
  formatInchesFraction,
  formatMeasurement,
  partsToInches,
} from '../core/units';
import { Check, X, ArrowRight, ArrowLeft, Keyboard, SlidersHorizontal, Target, Delete, CheckCircle2 } from 'lucide-react';

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
  onSave,
  onSaveAndNext,
  onSaveAndPrev,
  onClose,
}) => {
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [directText, setDirectText] = useState('');
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; id: number } | null>(null);
  const [pulseDistance, setPulseDistance] = useState(false);
  const prevDistRef = React.useRef(stationDistanceFt);

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
  }, [isOpen, currentReadingInches, unitFormat, fractionResolution]);

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

  if (!isOpen) return null;

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

  // Touch Numeric Keypad typing for Decimal & Metric
  const handleKeypadDigit = (digit: string) => {
    setHasEnteredValue(true);
    if (unitFormat === 'decimal_inches') {
      if (digit === '.' && decimalInputStr.includes('.')) return;
      setDecimalInputStr((prev) => (prev === '0' || prev === '' ? digit : prev + digit));
    } else if (unitFormat === 'metric_mm') {
      if (digit === '.' && metricInputStr.includes('.')) return;
      setMetricInputStr((prev) => (prev === '0' || prev === '' ? digit : prev + digit));
    }
  };

  const handleKeypadBackspace = () => {
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
    setHasEnteredValue(false);
    setDecimalInputStr('');
    setMetricInputStr('');
    setDirectText('');
  };

  const handleSave = () => {
    onSave(currentComputedInches);
  };

  const handleSaveAndNext = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (_) {}
    }

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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (_) {}
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header with Station & Target Measurement info */}
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Recording Station</span>
              {stationIndex !== undefined && totalStations !== undefined && (
                <span className="text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                  Tie {stationIndex} of {totalStations}
                </span>
              )}
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
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
              <span className={`text-xl font-extrabold text-amber-500 dark:text-amber-400 font-mono inline-block rounded-md px-1 -ml-1 transition-all ${pulseDistance ? 'animate-pulse-highlight bg-amber-500/20 ring-2 ring-amber-400' : ''}`}>
                {stationDistanceFt} ft
              </span>
              {targetReadingInches !== null && targetReadingInches !== undefined && (
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-lg border border-sky-500/30">
                  <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Target: {formatMeasurement(targetReadingInches, unitFormat, fractionResolution)}</span>
                  {actionText && <span className="font-sans font-normal opacity-80">({actionText})</span>}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
          className={`flex-1 flex flex-col overflow-hidden ${
            navDirection === 'next'
              ? 'animate-slide-in-right'
              : navDirection === 'prev'
              ? 'animate-slide-in-left'
              : ''
          }`}
        >
          {/* Live Readout Display */}
          <div className="bg-zinc-50 dark:bg-black p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center shrink-0">
            <div className="flex items-center justify-between w-full max-w-xs mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <span>Tape / Rod Reading</span>
              {currentReadingInches !== null ? (
                <span className="font-mono text-zinc-600 dark:text-zinc-300 font-semibold normal-case">
                  Last: {formatMeasurement(currentReadingInches, unitFormat, fractionResolution)}
                </span>
              ) : (
                <span className="font-mono text-amber-600 dark:text-amber-400/80 font-normal italic normal-case">
                  New Reading
                </span>
              )}
            </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight text-center min-h-[44px] flex items-center justify-center">
            {currentComputedInches !== null ? (
              <>
                <span>{formatMeasurement(currentComputedInches, unitFormat, fractionResolution)}</span>
                {unitFormat === 'feet_inches_fraction' && (
                  <span className="text-base text-zinc-500 font-normal ml-3">
                    ({formatInchesFraction(currentComputedInches, fractionResolution)})
                  </span>
                )}
                {unitFormat === 'metric_mm' && (
                  <span className="text-base text-zinc-500 font-normal ml-3">
                    ({currentComputedInches.toFixed(3)}")
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 italic text-2xl font-normal">
                Tap numbers to set
              </span>
            )}
          </div>

          {datumOffsetInches !== undefined && datumOffsetInches !== 0 && currentComputedInches !== null && (
            <div className="mt-2 text-xs font-mono text-purple-700 dark:text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Normalized: <strong>{formatMeasurement(currentComputedInches - datumOffsetInches, unitFormat, fractionResolution)}</strong> ({datumOffsetInches >= 0 ? '+' : ''}{formatMeasurement(datumOffsetInches, unitFormat, fractionResolution)} shift)
            </div>
          )}

          {/* Quick +/- Nudge Toolbar */}
          <div className="flex items-center gap-1.5 mt-3 w-full justify-center flex-wrap">
            <span className="text-xs text-zinc-500 font-medium mr-1">Nudge:</span>
            {unitFormat === 'metric_mm' ? (
              <>
                <button
                  onClick={() => handleNudge(-10 / 25.4)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -10mm
                </button>
                <button
                  onClick={() => handleNudge(-1 / 25.4)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -1mm
                </button>
                <button
                  onClick={() => handleNudge(1 / 25.4)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +1mm
                </button>
                <button
                  onClick={() => handleNudge(10 / 25.4)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +10mm
                </button>
              </>
            ) : unitFormat === 'decimal_inches' ? (
              <>
                <button
                  onClick={() => handleNudge(-1.0)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -1.0"
                </button>
                <button
                  onClick={() => handleNudge(-0.1)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -0.1"
                </button>
                <button
                  onClick={() => handleNudge(0.1)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +0.1"
                </button>
                <button
                  onClick={() => handleNudge(1.0)}
                  className="px-2 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +1.0"
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNudge(-0.25)}
                  className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -1/4"
                </button>
                <button
                  onClick={() => handleNudge(-1 / fractionResolution)}
                  className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  -1/{fractionResolution}"
                </button>
                <button
                  onClick={() => handleNudge(1 / fractionResolution)}
                  className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +1/{fractionResolution}"
                </button>
                <button
                  onClick={() => handleNudge(0.25)}
                  className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
                >
                  +1/4"
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleKeypadClear}
              className="px-2.5 py-1 text-xs font-bold rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 active:scale-95 transition ml-1"
              title="Clear measurement (set to blank)"
            >
              Clear
            </button>
            <button
              onClick={() => setUseDirectInput(!useDirectInput)}
              className="ml-auto p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200 dark:bg-zinc-900 transition"
              title={useDirectInput ? 'Switch to Touch Keypad' : 'Switch to Direct Keyboard Typing'}
            >
              {useDirectInput ? <SlidersHorizontal className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Picker / Input Area - Adapts completely to selected unit format */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {useDirectInput ? (
            <div className="space-y-2 py-4">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
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
                className="w-full text-xl font-mono p-3 rounded-xl border-2 border-amber-500 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 outline-none shadow-inner"
              />
              <p className="text-xs text-zinc-500">
                Accepts feet & inches (`1' 4 3/8"`), fractional inches (`16 3/8`), decimals (`14.5`), or metric (`365mm`).
              </p>
            </div>
          ) : unitFormat === 'decimal_inches' ? (
            /* DECIMAL INCHES TOUCH KEYPAD */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Decimal Inches Input
                </label>
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Display Box */}
              <div className="w-full text-center text-2xl font-mono font-bold p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                {hasEnteredValue && decimalInputStr ? `${decimalInputStr}"` : <span className="text-zinc-400 dark:text-zinc-500 font-normal italic text-lg">Tap digits to enter...</span>}
              </div>

              {/* Number Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(digit)}
                    className="h-12 rounded-xl text-lg font-bold font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-black active:scale-95 transition shadow-sm border border-zinc-200 dark:border-zinc-800"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-12 rounded-xl text-base font-bold flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-500 hover:text-white active:scale-95 transition shadow-sm"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : unitFormat === 'metric_mm' ? (
            /* METRIC (MM) TOUCH KEYPAD */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Millimeter (mm) Input
                </label>
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Display Box */}
              <div className="w-full text-center text-2xl font-mono font-bold p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                {hasEnteredValue && metricInputStr ? `${metricInputStr} mm` : <span className="text-zinc-400 dark:text-zinc-500 font-normal italic text-lg">Tap digits to enter...</span>}
              </div>

              {/* Number Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadDigit(digit)}
                    className="h-12 rounded-xl text-lg font-bold font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-black active:scale-95 transition shadow-sm border border-zinc-200 dark:border-zinc-800"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-12 rounded-xl text-base font-bold flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-500 hover:text-white active:scale-95 transition shadow-sm"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
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
                          setTotalInchesOnly(inch);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-black font-extrabold shadow-sm'
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
                          setNumerator(frac.num);
                          setDenominator(frac.den);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-mono font-bold text-xs transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-black font-black shadow-md ring-2 ring-amber-400'
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
                          setFeet(f);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-black font-extrabold shadow-sm'
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
                          setInches(inch);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-black font-extrabold shadow-sm'
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
                          setNumerator(frac.num);
                          setDenominator(frac.den);
                          setHasEnteredValue(true);
                        }}
                        className={`h-10 rounded-lg font-mono font-bold text-xs transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-black font-black shadow-md ring-2 ring-amber-400'
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
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
          {onSaveAndPrev && (
            <button
              onClick={handleSaveAndPrev}
              className="group px-3 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 flex items-center justify-center"
              title="Save and go to previous station"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1 group-active:-translate-x-2" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Save
          </button>

          {onSaveAndNext && (
            <button
              onClick={handleSaveAndNext}
              className="group flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-extrabold text-sm shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Next Station</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 group-active:translate-x-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { parseMeasurement, toFractionalParts, formatFeetInches, formatInchesFraction, partsToInches } from '../core/units';
import { Check, X, ArrowRight, ArrowLeft, Keyboard, SlidersHorizontal } from 'lucide-react';

interface FractionKeypadProps {
  isOpen: boolean;
  stationDistanceFt: number;
  currentReadingInches: number | null;
  onSave: (valInches: number | null) => void;
  onSaveAndNext?: (valInches: number | null) => void;
  onSaveAndPrev?: (valInches: number | null) => void;
  onClose: () => void;
}

const FRACTIONS = [
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

export const FractionKeypad: React.FC<FractionKeypadProps> = ({
  isOpen,
  stationDistanceFt,
  currentReadingInches,
  onSave,
  onSaveAndNext,
  onSaveAndPrev,
  onClose,
}) => {
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [directText, setDirectText] = useState('');

  // Picker parts
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(12);
  const [numerator, setNumerator] = useState(0);
  const [denominator, setDenominator] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (currentReadingInches !== null && !isNaN(currentReadingInches)) {
        const parts = toFractionalParts(currentReadingInches, 16);
        setFeet(parts.feet);
        setInches(parts.inches);
        setNumerator(parts.numerator);
        setDenominator(parts.denominator);
        setDirectText(formatFeetInches(currentReadingInches));
      } else {
        setFeet(1);
        setInches(0);
        setNumerator(0);
        setDenominator(1);
        setDirectText('');
      }
    }
  }, [isOpen, currentReadingInches]);

  if (!isOpen) return null;

  const currentComputedInches = useDirectInput
    ? parseMeasurement(directText)
    : partsToInches(feet, inches, numerator, denominator);

  const handleNudge = (deltaInches: number) => {
    const current = currentComputedInches ?? 12.0;
    const nextVal = Math.max(0, current + deltaInches);
    const parts = toFractionalParts(nextVal, 16);
    setFeet(parts.feet);
    setInches(parts.inches);
    setNumerator(parts.numerator);
    setDenominator(parts.denominator);
    setDirectText(formatFeetInches(nextVal));
  };

  const handleSave = () => {
    onSave(currentComputedInches);
  };

  const handleSaveAndNext = () => {
    if (onSaveAndNext) {
      onSaveAndNext(currentComputedInches);
    } else {
      onSave(currentComputedInches);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Recording Station</span>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-amber-500 dark:text-amber-400 font-mono">{stationDistanceFt} ft</span>
              <span className="text-[11px] font-normal bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 px-2 py-0.5 rounded">
                Laser Measurement
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Readout Display */}
        <div className="bg-zinc-50 dark:bg-black p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            Tape / Rod Reading
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight text-center">
            {currentComputedInches !== null ? (
              <>
                <span>{formatFeetInches(currentComputedInches)}</span>
                <span className="text-base text-zinc-500 font-normal ml-3">
                  ({formatInchesFraction(currentComputedInches)})
                </span>
              </>
            ) : (
              <span className="text-zinc-500 italic">No measurement</span>
            )}
          </div>

          {/* Quick +/- Nudge Toolbar */}
          <div className="flex items-center gap-1.5 mt-3 w-full justify-center">
            <span className="text-xs text-zinc-500 font-medium mr-1">Nudge:</span>
            <button
              onClick={() => handleNudge(-0.25)}
              className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
            >
              -1/4"
            </button>
            <button
              onClick={() => handleNudge(-0.0625)}
              className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
            >
              -1/16"
            </button>
            <button
              onClick={() => handleNudge(0.0625)}
              className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
            >
              +1/16"
            </button>
            <button
              onClick={() => handleNudge(0.25)}
              className="px-2.5 py-1 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200 active:scale-95 transition"
            >
              +1/4"
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

        {/* Picker / Input Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {useDirectInput ? (
            <div className="space-y-2 py-4">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Type measurement (e.g. 1' 4 3/8", 16 3/8", 16.375):
              </label>
              <input
                type="text"
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder="e.g. 1' 2 3/8"
                autoFocus
                className="w-full text-xl font-mono p-3 rounded-xl border-2 border-amber-500 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 outline-none shadow-inner"
              />
              <p className="text-xs text-zinc-500">
                Supports feet & inches (`1' 4 3/8"`), inches (`16 3/8`), hyphenated (`1-4-3/8`), or decimals (`14.5`).
              </p>
            </div>
          ) : (
            <>
              {/* Feet Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Feet (ft)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeet(f)}
                      className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 ${
                        feet === f
                          ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {f}'
                    </button>
                  ))}
                </div>
              </div>

              {/* Inches Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Inches (in)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                    <button
                      key={inch}
                      type="button"
                      onClick={() => setInches(inch)}
                      className={`h-10 rounded-lg font-bold text-sm transition active:scale-95 ${
                        inches === inch
                          ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {inch}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Fraction Grid */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Fraction (1/16" increments)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                  {FRACTIONS.map((frac) => {
                    const isSelected =
                      (numerator === 0 && frac.num === 0) ||
                      (numerator === frac.num && denominator === frac.den);

                    return (
                      <button
                        key={frac.label}
                        type="button"
                        onClick={() => {
                          setNumerator(frac.num);
                          setDenominator(frac.den);
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

        {/* Footer Actions */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          {onSaveAndPrev && (
            <button
              onClick={() => onSaveAndPrev(currentComputedInches)}
              className="px-3 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 flex items-center justify-center"
              title="Save and go to previous station"
            >
              <ArrowLeft className="w-5 h-5" />
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
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-extrabold text-sm shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              Next Station
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

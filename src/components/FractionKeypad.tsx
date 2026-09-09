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
        // default starting point around 1 ft (12 in)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Recording Station</span>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-amber-400 font-mono">{stationDistanceFt} ft</span>
              <span className="text-xs font-normal bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                Laser Measurement
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Readout Display */}
        <div className="bg-slate-100 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tape / Rod Reading
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight text-center">
            {currentComputedInches !== null ? (
              <>
                <span>{formatFeetInches(currentComputedInches)}</span>
                <span className="text-lg text-slate-400 font-normal ml-3">
                  ({formatInchesFraction(currentComputedInches)})
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic">No measurement</span>
            )}
          </div>

          {/* Quick +/- Nudge Toolbar */}
          <div className="flex items-center gap-2 mt-3 w-full justify-center">
            <span className="text-xs text-slate-500 font-medium mr-1">Nudge:</span>
            <button
              onClick={() => handleNudge(-0.25)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 active:scale-95 transition"
            >
              -1/4"
            </button>
            <button
              onClick={() => handleNudge(-0.0625)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 active:scale-95 transition"
            >
              -1/16"
            </button>
            <button
              onClick={() => handleNudge(0.0625)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 active:scale-95 transition"
            >
              +1/16"
            </button>
            <button
              onClick={() => handleNudge(0.25)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 active:scale-95 transition"
            >
              +1/4"
            </button>
            <button
              onClick={() => setUseDirectInput(!useDirectInput)}
              className="ml-auto p-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200 dark:bg-slate-800 transition"
              title={useDirectInput ? 'Switch to Touch Keypad' : 'Switch to Direct Keyboard Typing'}
            >
              {useDirectInput ? <SlidersHorizontal className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Picker / Input Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {useDirectInput ? (
            <div className="space-y-2 py-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Type measurement (e.g. 1' 4 3/8", 16 3/8", 16.375):
              </label>
              <input
                type="text"
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder="e.g. 1' 2 3/8"
                autoFocus
                className="w-full text-xl font-mono p-3 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none shadow-inner"
              />
              <p className="text-xs text-slate-500">
                Supports feet & inches (`1' 4 3/8"`), inches (`16 3/8`), hyphenated (`1-4-3/8`), or decimals (`14.5`).
              </p>
            </div>
          ) : (
            <>
              {/* Feet Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Feet (ft)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeet(f)}
                      className={`h-11 rounded-lg font-bold text-base transition active:scale-95 ${
                        feet === f
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {f}'
                    </button>
                  ))}
                </div>
              </div>

              {/* Inches Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Inches (in)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                    <button
                      key={inch}
                      type="button"
                      onClick={() => setInches(inch)}
                      className={`h-11 rounded-lg font-bold text-base transition active:scale-95 ${
                        inches === inch
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {inch}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Fraction Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
                        className={`h-11 rounded-lg font-mono font-bold text-sm transition active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
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
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          {onSaveAndPrev && (
            <button
              onClick={() => onSaveAndPrev(currentComputedInches)}
              className="px-3 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition active:scale-95 flex items-center justify-center"
              title="Save and go to previous station"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex-1 py-3.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-base shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save
          </button>

          {onSaveAndNext && (
            <button
              onClick={handleSaveAndNext}
              className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
            >
              Next Station
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

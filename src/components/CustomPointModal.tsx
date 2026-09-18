import React, { useState, useEffect, useRef } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { PrototypeStyle } from '../core/types';

export interface CustomPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (distanceFt: number) => void;
  existingDistances: number[];
  defaultDistance?: number;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
}

export const CustomPointModal: React.FC<CustomPointModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  existingDistances,
  defaultDistance = 12.5,
  prototypeStyle = 'nothing',
  isDarkMode = true,
}) => {
  useBodyScrollLock(isOpen);

  const [distanceStr, setDistanceStr] = useState<string>(defaultDistance.toString());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isNothing = prototypeStyle === 'nothing';

  useEffect(() => {
    if (isOpen) {
      setDistanceStr(defaultDistance.toString());
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultDistance]);

  if (!isOpen) return null;

  const handleValidateAndSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const val = parseFloat(distanceStr.trim());
    if (isNaN(val)) {
      setError('Please enter a valid numeric station distance (in feet).');
      return;
    }

    // Check if station already exists at this exact distance (within 0.01 ft)
    const exists = existingDistances.some(d => Math.abs(d - val) < 0.01);
    if (exists) {
      setError(`A station point already exists at ${val} ft. Choose a unique distance.`);
      return;
    }

    onInsert(val);
    onClose();
  };

  const handleQuickOffset = (offset: number) => {
    const current = parseFloat(distanceStr.trim()) || 0;
    const updated = Math.round((current + offset) * 100) / 100;
    setDistanceStr(updated.toString());
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-point-title"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className={`border w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-all duration-150 animate-in fade-in zoom-in-95 ${
          isNothing
            ? isDarkMode
              ? 'bg-[#000000] border-zinc-800 text-white rounded-2xl font-["Space_Mono"]'
              : 'bg-[#F5F5F5] border-zinc-300 text-black rounded-2xl font-["Space_Mono"]'
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-3.5 flex items-center justify-between border-b shrink-0 ${
            isNothing
              ? isDarkMode
                ? 'bg-zinc-950 border-zinc-800'
                : 'bg-zinc-100 border-zinc-200'
              : 'bg-zinc-100 dark:bg-black border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                isNothing
                  ? 'rounded-lg border border-zinc-700 bg-zinc-900 text-[#D71921]'
                  : 'rounded-lg bg-amber-500/20 text-amber-500'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h2
                id="custom-point-title"
                className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                  isNothing ? 'text-white dark:text-white' : 'text-zinc-900 dark:text-white'
                }`}
              >
                {isNothing ? '[ INSERT CUSTOM POINT ]' : 'Insert Custom Station Point'}
              </h2>
              <p
                className={`text-[10px] sm:text-[11px] uppercase tracking-wide ${
                  isNothing ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Add intermediate tie, frog, or bridge point
              </p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleValidateAndSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label
              htmlFor="station-dist-input"
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                isNothing ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Station Distance (Feet along track):
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="station-dist-input"
                type="number"
                step="any"
                inputMode="decimal"
                value={distanceStr}
                onChange={(e) => {
                  setDistanceStr(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. 12.5, -5, 87.25"
                className={`w-full h-11 px-3 pr-10 text-sm font-bold rounded-lg border outline-none transition ${
                  isNothing
                    ? isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#D71921] focus:ring-1 focus:ring-[#D71921]'
                      : 'bg-white border-zinc-300 text-black focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:border-amber-500'
                }`}
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none uppercase ${
                  isNothing ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                ft
              </span>
            </div>
          </div>

          {/* Quick Increment Preset Chips */}
          <div>
            <span
              className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                isNothing ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Quick Adjustments:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '-5 ft', val: -5 },
                { label: '-1 ft', val: -1 },
                { label: '+1 ft', val: 1 },
                { label: '+2.5 ft', val: 2.5 },
                { label: '+5 ft', val: 5 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickOffset(preset.val)}
                  className={`proto-ignore px-2.5 py-1 text-[11px] font-bold rounded-md border transition cursor-pointer active:scale-95 ${
                    isNothing
                      ? isDarkMode
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-black hover:border-zinc-400'
                      : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Error Message */}
          {error && (
            <div
              className={`p-2.5 rounded-lg flex items-start gap-2 text-xs font-medium ${
                isNothing
                  ? 'border border-[#D71921]/40 bg-[#D71921]/10 text-[#D71921]'
                  : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Note */}
          <div
            className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
              isNothing
                ? isDarkMode
                  ? 'border-zinc-800/80 bg-zinc-950/60 text-zinc-400'
                  : 'border-zinc-300/80 bg-zinc-100/60 text-zinc-600'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500'
            }`}
          >
            Custom stations sort automatically by distance along the track, calculating precise target grade elevations and lift instructions.
          </div>

          {/* Footer Action Buttons */}
          <div
            className={`pt-3 border-t flex items-center justify-end gap-2 shrink-0 ${
              isNothing
                ? isDarkMode ? 'border-zinc-800' : 'border-zinc-300'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`proto-ignore px-4 py-2 text-xs font-bold uppercase transition rounded-lg cursor-pointer ${
                isNothing
                  ? isDarkMode
                    ? 'border border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                    : 'border border-zinc-300 bg-transparent text-zinc-600 hover:text-black hover:border-zinc-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`proto-ignore px-4 py-2 text-xs font-extrabold uppercase transition rounded-lg shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                isNothing
                  ? 'border border-[#D71921] bg-[#D71921] hover:bg-[#b5141b] text-white tracking-wider'
                  : 'bg-amber-500 hover:bg-amber-400 text-black'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Insert Point</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

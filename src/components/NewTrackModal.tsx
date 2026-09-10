import React, { useState } from 'react';
import { TrackProject } from '../core/types';
import {
  X,
  Compass,
  Layers,
  RotateCcw,
  Sparkles,
  Bookmark,
  Plus
} from 'lucide-react';

interface NewTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: TrackProject;
  onCreateNewTrack: (config: {
    name: string;
    mode: 'blank_zero' | 'empty_grid' | 'clear_readings';
    lengthFt: number;
    intervalFt: number;
    saveCurrentFirst: boolean;
  }) => void;
}

export const NewTrackModal: React.FC<NewTrackModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onCreateNewTrack,
}) => {
  const hasMeasuredReadings = currentProject.stations.some(s => s.readingInches !== null);

  const [name, setName] = useState<string>('New Track Section');
  const [mode, setMode] = useState<'blank_zero' | 'empty_grid' | 'clear_readings'>('blank_zero');
  const [lengthFt, setLengthFt] = useState<number>(50);
  const [intervalFt, setIntervalFt] = useState<number>(currentProject.stationIntervalFt || 5);
  const [saveCurrentFirst, setSaveCurrentFirst] = useState<boolean>(hasMeasuredReadings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNewTrack({
      name: name.trim() || 'New Track Section',
      mode,
      lengthFt,
      intervalFt,
      saveCurrentFirst,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-colors animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Start New Track Survey
              </h2>
              <p className="text-[11px] text-zinc-500">
                Clear current data and start fresh in the field
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Project Name Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Project / Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Curve Section 1"
              required
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Setup Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Select Starting Setup
            </label>

            {/* Option 1: Blank Zero */}
            <div
              onClick={() => setMode('blank_zero')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                mode === 'blank_zero'
                  ? 'bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-white ring-1 ring-amber-500/50'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${mode === 'blank_zero' ? 'bg-amber-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold">
                    Blank Track (Station 0 Only)
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Creates a single clean Station 0. Take your benchmark reading, then tap <strong>Add Next</strong> or <strong>+ Extend</strong> as you walk ties down the line.
                </p>
              </div>
            </div>

            {/* Option 2: Empty Grid */}
            <div
              onClick={() => setMode('empty_grid')}
              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-2.5 ${
                mode === 'empty_grid'
                  ? 'bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-white ring-1 ring-amber-500/50'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${mode === 'empty_grid' ? 'bg-amber-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-extrabold">
                    Pre-Generate Empty Grid ({lengthFt} ft @ {intervalFt}' intervals)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Pre-populates empty stations along a planned distance ({Math.floor(lengthFt / intervalFt) + 1} blank ties) ready for you to record readings.
                  </p>
                </div>
              </div>

              {/* Grid Controls (Visible when empty_grid is active) */}
              {mode === 'empty_grid' && (
                <div className="pl-11 pt-1 space-y-2 border-t border-zinc-200 dark:border-zinc-800/80">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Section Length:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[25, 50, 100, 200].map(len => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setLengthFt(len)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                            lengthFt === len
                              ? 'bg-amber-500 text-black shadow-xs'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          +{len} ft
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Tie Interval:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 5, 10].map(int => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setIntervalFt(int)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                            intervalFt === int
                              ? 'bg-amber-500 text-black shadow-xs'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {int} ft
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Option 3: Clear Readings Only */}
            <div
              onClick={() => setMode('clear_readings')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                mode === 'clear_readings'
                  ? 'bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-white ring-1 ring-amber-500/50'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${mode === 'clear_readings' ? 'bg-amber-500 text-black' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold">
                  Clear Readings Only (Keep Stations)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Preserves your existing station chainage ({currentProject.stations.length} ties), intervals, and notes, but clears all laser readings so you can re-survey the exact same stretch.
                </p>
              </div>
            </div>
          </div>

          {/* Safety Checkbox: Save active track first */}
          {hasMeasuredReadings && (
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2.5">
              <input
                type="checkbox"
                id="saveCurrentFirst"
                checked={saveCurrentFirst}
                onChange={(e) => setSaveCurrentFirst(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
              />
              <label htmlFor="saveCurrentFirst" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                <span>Save current track <strong>"{currentProject.name}"</strong> to Saved Tracks first</span>
              </label>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {mode === 'clear_readings' ? 'Clear All Readings' : 'Start New Track'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

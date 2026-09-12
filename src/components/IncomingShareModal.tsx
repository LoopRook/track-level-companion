import React from 'react';
import { QrCode, Download, X, AlertCircle } from 'lucide-react';
import { TrackProject } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

interface IncomingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TrackProject | null;
  onConfirmLoad: (project: TrackProject) => void;
}

export const IncomingShareModal: React.FC<IncomingShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmLoad,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen || !project) return null;

  const totalLengthFt = project.stations.length > 1
    ? Math.abs(project.stations[project.stations.length - 1].distanceFt - project.stations[0].distanceFt)
    : 0;

  const measuredCount = project.stations.filter(
    s => s.readingInches !== null && !isNaN(s.readingInches)
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col overscroll-contain touch-auto transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Shared Survey Received
              </h3>
              <p className="text-[11px] text-zinc-500">
                Incoming Track Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              {project.name}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">STATIONS:</span>
                <strong>{project.stations.length} ties ({totalLengthFt} ft)</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">MEASURED:</span>
                <strong>{measuredCount} / {project.stations.length}</strong>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">UNITS:</span>
                <span className="capitalize">{project.unitFormat.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block font-sans">TARGET:</span>
                <span>{project.gradeMode === 'end_to_end' ? 'End-to-End' : `${project.targetGradePercent.toFixed(2)}%`}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              Loading this survey will set it as your active track. Your current track will be automatically backed up in Saved Tracks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onConfirmLoad(project)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-sm active:scale-98"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Load Track Survey</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

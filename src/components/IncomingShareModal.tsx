import React from 'react';
import { QrCode, Download, X, AlertCircle } from 'lucide-react';
import { TrackProject, PrototypeStyle } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

interface IncomingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TrackProject | null;
  onConfirmLoad: (project: TrackProject) => void;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
}

export const IncomingShareModal: React.FC<IncomingShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmLoad,
  prototypeStyle = 'nothing',
  isDarkMode = true,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen || !project) return null;

  const isNothing = prototypeStyle === 'nothing';

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
        className={
          isNothing
            ? `border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col overscroll-contain touch-auto transition-colors ${
                isDarkMode
                  ? 'bg-black border-zinc-800 text-white font-["Space_Grotesk"]'
                  : 'bg-[#F2F2F2] border-zinc-300 text-zinc-900 font-["Space_Grotesk"]'
              }`
            : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col overscroll-contain touch-auto transition-colors'
        }
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={
            isNothing
              ? `px-4 py-3.5 flex items-center justify-between border-b shrink-0 ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
                }`
              : 'bg-zinc-100 dark:bg-black px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0'
          }
        >
          <div className="flex items-center gap-2">
            <div
              className={
                isNothing
                  ? `w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDarkMode
                        ? 'border border-zinc-700 bg-zinc-900 text-[#D71921]'
                        : 'border border-zinc-300 bg-zinc-100 text-[#D71921]'
                    }`
                  : 'w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500'
              }
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3
                className={
                  isNothing
                    ? 'text-xs sm:text-sm font-bold font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-sm font-extrabold text-zinc-900 dark:text-white'
                }
              >
                {isNothing ? '[ SHARED SURVEY RECEIVED ]' : 'Shared Survey Received'}
              </h3>
              <p
                className={
                  isNothing
                    ? 'text-[10px] text-zinc-500 font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-[11px] text-zinc-500'
                }
              >
                Incoming Track Data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={
              isNothing
                ? `px-2 py-1 rounded-lg border text-[11px] font-bold font-["Space_Mono"] uppercase tracking-wider transition cursor-pointer ${
                    isDarkMode
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500'
                      : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-black hover:border-zinc-500'
                  }`
                : 'p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer'
            }
            aria-label="Close"
          >
            {isNothing ? '[ Close ]' : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            className={
              isNothing
                ? `p-3 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  }`
                : 'p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2'
            }
          >
            <h4
              className={
                isNothing
                  ? 'font-bold text-xs uppercase font-["Space_Mono"] tracking-wider truncate'
                  : 'font-extrabold text-sm text-zinc-900 dark:text-zinc-100'
              }
            >
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

          <div
            className={
              isNothing
                ? `flex items-start gap-2 p-2.5 rounded-xl border text-xs font-["Space_Mono"] leading-relaxed ${
                    isDarkMode
                      ? 'bg-[#D71921]/10 border-[#D71921]/30 text-zinc-300'
                      : 'bg-red-50 border-red-200 text-zinc-800'
                  }`
                : 'flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300'
            }
          >
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
            <p>
              Loading this survey will set it as your active track. Your current track will be automatically backed up in Saved Tracks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onConfirmLoad(project)}
              className={
                isNothing
                  ? 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#D71921] hover:bg-[#b5141b] text-white font-bold font-["Space_Mono"] uppercase tracking-wider text-xs transition shadow-sm active:scale-98 cursor-pointer'
                  : 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-sm active:scale-98 cursor-pointer'
              }
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isNothing ? '[ Load Track Survey ]' : 'Load Track Survey'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={
                isNothing
                  ? `w-full py-2 px-4 rounded-lg border font-bold font-["Space_Mono"] uppercase tracking-wider text-xs transition cursor-pointer ${
                      isDarkMode
                        ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                        : 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black'
                    }`
                  : 'w-full py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer'
              }
            >
              {isNothing ? '[ Cancel ]' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

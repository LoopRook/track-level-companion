import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { APP_VERSION_LABEL } from '../core/version';

interface BetaNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaNoticeModal: React.FC<BetaNoticeModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('tlc_beta_notice_dismissed', 'true');
      } catch (err) {
        console.error('Failed to save beta notice dismissal preference', err);
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={handleDismiss}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col overscroll-contain touch-auto transition-colors animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.2] text-[#D71921]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Space_Mono'] uppercase tracking-wider">
                  [ Beta Software Notice ]
                </h3>
                <span className="text-[9px] font-['Space_Mono'] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-['Space_Mono'] uppercase tracking-wider">
                Track Level Companion field testing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[11px] font-bold font-['Space_Mono'] uppercase tracking-wider transition cursor-pointer"
            aria-label="Close"
          >
            [ Close ]
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div className="space-y-2">
            <p>
              Track Level Companion is currently in <strong>field beta testing</strong>. Calculations, leveling algorithms, and user workflows are actively being refined.
            </p>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="text-[#D71921] font-bold">•</span>
                <span>
                  <strong>Field Verification:</strong> Always cross-check detector rod readings, laser heights, and target elevations against your physical track conditions before making permanent track or ballast adjustments.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#D71921] font-bold">•</span>
                <span>
                  <strong>Data Storage:</strong> Survey data is stored locally in your browser cache. Use the <strong>Files / Export</strong> menu to save or export CSV backups regularly.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#D71921] font-bold">•</span>
                <span>
                  <strong>Feedback & Bug Reports:</strong> Please report any calculation discrepancies, display issues, or workflow suggestions.
                </span>
              </div>
            </div>
          </div>

          {/* Dismissal Checkbox */}
          <div className="pt-2 flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <input
              type="checkbox"
              id="dontShowBetaAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-[#D71921] focus:ring-[#D71921] border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <label htmlFor="dontShowBetaAgain" className="text-[11px] text-zinc-500 cursor-pointer select-none">
              Don't show this notice on launch
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold font-['Space_Mono'] uppercase tracking-wider rounded-lg text-xs transition active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>[ Continue to App ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
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
        <div className="bg-amber-500/10 dark:bg-amber-500/10 px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                  Beta Software Notice
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Track Level Companion field testing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
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
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Field Verification:</strong> Always cross-check detector rod readings, laser heights, and target elevations against your physical track conditions before making permanent track or ballast adjustments.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>
                  <strong>Data Storage:</strong> Survey data is stored locally in your browser cache. Use the <strong>Files / Export</strong> menu to save or export CSV backups regularly.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
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
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <label htmlFor="dontShowBetaAgain" className="text-[11px] text-zinc-500 cursor-pointer select-none">
              Don't show this notice on launch
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition active:scale-95 shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Continue to App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import {
  X,
  Play,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { ALL_TUTORIALS, TutorialDefinition } from '../core/tutorials';

interface TutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTutorial: (tutorialId: string) => void;
}

export const TutorialsModal: React.FC<TutorialsModalProps> = ({
  isOpen,
  onClose,
  onSelectTutorial,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overscroll-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorials-modal-title"
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-sm shrink-0">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="tutorials-modal-title"
                className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-tight"
              >
                Interactive Tutorials
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Hands-on field workflows to master track leveling, slopes, and laser relocation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition shrink-0"
            title="Close Tutorials"
            aria-label="Close Tutorials"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Tutorial Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y divide-zinc-100 dark:divide-zinc-900">
          {ALL_TUTORIALS.map((tutorial: TutorialDefinition) => {
            const Icon = tutorial.icon;
            const isGettingStarted = tutorial.id === 'getting-started';

            return (
              <div
                key={tutorial.id}
                className={`pt-3.5 first:pt-0 group p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                  isGettingStarted
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isGettingStarted
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {tutorial.category}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tutorial.duration}
                        </span>
                        {tutorial.badge && (
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isGettingStarted
                                ? 'bg-amber-500 text-black font-extrabold'
                                : 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {tutorial.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {tutorial.title}
                      </h3>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                        {tutorial.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTutorial(tutorial.id)}
                    data-tutorial-launch={tutorial.id}
                    className="self-end sm:self-center px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 bg-amber-500 hover:bg-amber-400 text-black"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start Tutorial</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">
              Starting a tutorial safely stashes your active survey and restores it when finished.
            </span>
            <span className="sm:hidden">
              Your active survey is safely preserved.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

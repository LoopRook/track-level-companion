import React, { useEffect } from 'react';
import {
  X,
  Play,
  Clock,
  Compass,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { ALL_TUTORIALS, TutorialDefinition } from '../core/tutorials';

interface TutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTutorial: (tutorialId: string) => void;
  onOpenGuide?: () => void;
  prototypeStyle?: string;
  isDarkMode?: boolean;
}

export const TutorialsModal: React.FC<TutorialsModalProps> = ({
  isOpen,
  onClose,
  onSelectTutorial,
  onOpenGuide,
  prototypeStyle = 'original',
  isDarkMode = true,
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

  const isNothing = prototypeStyle === 'nothing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overscroll-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorials-modal-title"
    >
      <div
        className={`border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isNothing
            ? isDarkMode
              ? 'bg-black text-white border-zinc-800 shadow-none font-["Space_Mono"]'
              : 'bg-white text-black border-zinc-300 shadow-none font-["Space_Mono"]'
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isNothing
            ? isDarkMode
              ? 'bg-zinc-950 border-zinc-800'
              : 'bg-zinc-50 border-zinc-200'
            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 flex items-center justify-center font-black shrink-0 ${
              isNothing
                ? 'rounded-full border border-zinc-700 bg-zinc-900 text-[#D71921]'
                : 'rounded-xl bg-amber-500 text-black shadow-sm'
            }`}>
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="tutorials-modal-title"
                className={`text-base sm:text-lg font-black leading-tight ${
                  isNothing ? 'uppercase tracking-wide' : 'text-zinc-900 dark:text-white'
                }`}
              >
                {isNothing ? '[ Interactive Tutorials ]' : 'Interactive Tutorials'}
              </h2>
              <p className={`text-xs font-medium ${
                isNothing ? 'uppercase text-[11px] tracking-wider text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                {isNothing ? 'Hands-on field workflows to master track leveling & laser' : 'Hands-on field workflows to master track leveling, slopes, and laser relocation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className={`h-8 px-2.5 border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isNothing
                    ? 'rounded-full border-zinc-700 bg-transparent text-zinc-300 hover:text-white hover:border-zinc-500 uppercase tracking-wider text-[11px]'
                    : 'rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white'
                }`}
                title="Switch to Field Guide & Handbook"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Field Handbook</span>
                <span className="sm:hidden">Guide</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`p-2 transition shrink-0 cursor-pointer ${
                isNothing
                  ? 'rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900'
                  : 'rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
              title="Close Tutorials"
              aria-label="Close Tutorials"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Tutorial Cards List */}
        <div className={`p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y ${
          isNothing
            ? isDarkMode ? 'divide-zinc-800/60' : 'divide-zinc-200'
            : 'divide-zinc-100 dark:divide-zinc-900'
        }`}>
          {ALL_TUTORIALS.map((tutorial: TutorialDefinition) => {
            const Icon = tutorial.icon;
            const isGettingStarted = tutorial.id === 'getting-started';

            return (
              <div
                key={tutorial.id}
                className={`pt-3.5 first:pt-0 group p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                  isNothing
                    ? isDarkMode
                      ? isGettingStarted
                        ? 'bg-zinc-900/60 border-zinc-700/80 hover:border-zinc-600'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                      : isGettingStarted
                      ? 'bg-zinc-100 border-zinc-300 hover:border-zinc-400'
                      : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                    : isGettingStarted
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 flex items-center justify-center shrink-0 font-bold ${
                        isNothing
                          ? isGettingStarted
                            ? 'rounded-full border border-zinc-700 bg-zinc-900 text-[#D71921]'
                            : 'rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-300'
                          : isGettingStarted
                          ? 'rounded-xl bg-amber-500 text-black shadow-sm'
                          : 'rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isNothing
                            ? 'border border-zinc-700 bg-transparent text-zinc-400 font-["Space_Mono"] uppercase text-[10px]'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {tutorial.category}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tutorial.duration}
                        </span>
                        {tutorial.badge && (
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isNothing
                                ? 'border border-[#D71921] text-[#D71921] bg-transparent rounded-full font-["Space_Mono"] text-[9px]'
                                : isGettingStarted
                                ? 'bg-amber-500 text-black font-extrabold'
                                : 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {tutorial.badge}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm sm:text-base font-bold ${
                        isNothing ? 'text-zinc-100 font-["Space_Mono"] uppercase' : 'text-zinc-900 dark:text-zinc-100'
                      }`}>
                        {tutorial.title}
                      </h3>

                      <p className={`text-xs leading-relaxed font-normal ${
                        isNothing ? 'text-zinc-400 font-["Space_Mono"]' : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {tutorial.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTutorial(tutorial.id)}
                    data-tutorial-launch={tutorial.id}
                    className={`self-end sm:self-center px-4 py-2 text-xs font-black transition-all duration-150 flex items-center gap-1.5 shrink-0 active:scale-95 ${
                      isNothing
                        ? 'border border-[#D71921] bg-[#D71921] hover:bg-[#b5141b] text-white rounded-full font-["Space_Mono"] uppercase tracking-wider'
                        : 'rounded-xl shadow-sm bg-amber-500 hover:bg-amber-400 text-black'
                    }`}
                  >
                    <Play className={`w-3.5 h-3.5 ${isNothing ? 'fill-white' : 'fill-black'}`} />
                    <span>Start Tutorial</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className={`px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3 text-xs shrink-0 ${
          isNothing
            ? isDarkMode
              ? 'bg-zinc-950 border-zinc-800'
              : 'bg-zinc-50 border-zinc-200'
            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={`hidden sm:inline ${isNothing ? 'font-["Space_Mono"] text-[11px] uppercase tracking-wider' : ''}`}>
              Starting a tutorial safely stashes your active survey and restores it when finished.
            </span>
            <span className={`sm:hidden ${isNothing ? 'font-["Space_Mono"] text-[10px] uppercase' : ''}`}>
              Your active survey is safely preserved.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
              isNothing
                ? 'border border-zinc-700 bg-transparent text-zinc-300 hover:text-white rounded-full font-["Space_Mono"] uppercase'
                : 'rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

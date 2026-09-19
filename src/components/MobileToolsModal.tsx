import React from 'react';
import { 
  Plus, 
  FolderOpen, 
  Play, 
  BookOpen, 
  Settings, 
  ChevronRight, 
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { PrototypeStyle } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

export interface MobileToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTrack: () => void;
  onOpenDataModal: () => void;
  onOpenTutorials: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  onOpenSetupGuide?: () => void;
  onToggleDarkMode?: () => void;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
}

export const MobileToolsModal: React.FC<MobileToolsModalProps> = ({
  isOpen,
  onClose,
  onOpenNewTrack,
  onOpenDataModal,
  onOpenTutorials,
  onOpenGuide,
  onOpenSettings,
  onOpenSetupGuide,
  onToggleDarkMode,
  prototypeStyle = 'nothing',
  isDarkMode = true,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const tools = [
    {
      id: 'new-track',
      title: 'Start New Track',
      desc: 'Blank track, 50ft/100ft tangent section, or reset readings',
      icon: Plus,
      badge: 'NEW',
      action: () => {
        onClose();
        onOpenNewTrack();
      },
    },
    {
      id: 'files',
      title: 'Project Files & Export',
      desc: 'Export CSV, load survey data, printable report, QR share',
      icon: FolderOpen,
      badge: 'DATA',
      action: () => {
        onClose();
        onOpenDataModal();
      },
    },
    {
      id: 'tutorials',
      title: 'Interactive Tutorials',
      desc: 'Guided field simulations for benchmarks, laser moves & grade',
      icon: Play,
      badge: 'LEARN',
      action: () => {
        onClose();
        onOpenTutorials();
      },
    },
    {
      id: 'guide',
      title: 'Field Guide & Handbook',
      desc: 'Full reference manual, laser setup, shimming math & tolerances',
      icon: BookOpen,
      badge: 'DOCS',
      action: () => {
        onClose();
        onOpenGuide();
      },
    },
    {
      id: 'settings',
      title: 'Leveling & App Settings',
      desc: 'Tolerances, unit format, keypad haptics, themes, mobile layout',
      icon: Settings,
      badge: 'CONFIG',
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    ...(onOpenSetupGuide ? [{
      id: 'setup-guide',
      title: 'First-Time Setup Guide',
      desc: 'Reconfigure default units, display theme, and tour settings',
      icon: Compass,
      badge: 'SETUP',
      action: () => {
        onClose();
        onOpenSetupGuide();
      },
    }] : []),
    ...(onToggleDarkMode ? [{
      id: 'theme',
      title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      desc: isDarkMode ? 'High-contrast bright daylight theme' : 'OLED deep black nocturnal theme',
      icon: isDarkMode ? Sun : Moon,
      badge: isDarkMode ? 'LIGHT' : 'DARK',
      action: () => {
        onToggleDarkMode();
      },
    }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 overscroll-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Field Tools & Project Menu"
    >
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 transition-colors ${
          prototypeStyle === 'nothing'
            ? isDarkMode
              ? 'bg-black text-white border-zinc-800 font-["Space_Grotesk"]'
              : 'bg-[#F2F2F2] text-zinc-900 border-zinc-300 font-["Space_Grotesk"]'
            : 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          prototypeStyle === 'nothing'
            ? isDarkMode
              ? 'bg-zinc-950 border-zinc-800'
              : 'bg-white border-zinc-300'
            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              prototypeStyle === 'nothing'
                ? isDarkMode
                  ? 'border border-zinc-700 bg-black text-[#D71921]'
                  : 'border border-zinc-400 bg-zinc-100 text-[#D71921]'
                : 'bg-amber-500/20 text-amber-500'
            }`}>
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-xs sm:text-sm tracking-wide truncate whitespace-nowrap ${
                prototypeStyle === 'nothing' ? 'font-["Space_Mono"] uppercase tracking-[0.08em]' : ''
              }`}>
                {prototypeStyle === 'nothing' ? (
                  <>
                    <span className="inline sm:hidden">[ TOOLS ]</span>
                    <span className="hidden sm:inline">[ FIELD TOOLS & SETTINGS ]</span>
                  </>
                ) : 'Tools & Settings'}
              </h3>
              <p className={`text-[10px] truncate ${
                prototypeStyle === 'nothing'
                  ? isDarkMode ? 'text-zinc-400 font-["Space_Mono"] uppercase tracking-wider' : 'text-zinc-600 font-["Space_Mono"] uppercase tracking-wider'
                  : 'text-zinc-400'
              }`}>
                Track project management & documentation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[11px] font-bold font-['Space_Mono'] uppercase tracking-wider transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center justify-center select-none"
            aria-label="Close tools menu"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Tools Menu List */}
        <div className="p-3 space-y-2 max-h-[75vh] overflow-y-auto">
          {tools.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] ${
                  prototypeStyle === 'nothing'
                    ? isDarkMode
                      ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/80 hover:bg-zinc-900/80'
                      : 'border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                    prototypeStyle === 'nothing'
                      ? isDarkMode
                        ? 'border border-zinc-800 bg-black text-white group-hover:border-zinc-600 group-hover:text-[#D71921]'
                        : 'border border-zinc-300 bg-zinc-100 text-black group-hover:border-zinc-500 group-hover:text-[#D71921]'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:text-amber-500'
                  }`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 ${
                        prototypeStyle === 'nothing' ? 'font-["Space_Mono"] tracking-tight' : ''
                      }`}>
                        {item.title}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        prototypeStyle === 'nothing'
                          ? 'border border-zinc-700 text-zinc-400 bg-zinc-900'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Footer with Large Tactile Close Button */}
        <div className={`p-3 border-t flex flex-col gap-2 shrink-0 ${
          prototypeStyle === 'nothing'
            ? isDarkMode
              ? 'border-zinc-800 bg-zinc-950'
              : 'border-zinc-300 bg-zinc-100'
            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl border font-['Space_Mono'] uppercase tracking-wider text-xs font-bold transition active:scale-[0.99] cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center justify-center select-none shadow-xs ${
              prototypeStyle === 'nothing'
                ? isDarkMode
                  ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white hover:border-zinc-500'
                  : 'border-zinc-400 bg-white hover:bg-zinc-200 text-black hover:border-zinc-600'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
            }`}
          >
            [ CLOSE TOOLS MENU ]
          </button>
          <div className={`text-center text-[9.5px] ${
            prototypeStyle === 'nothing' ? 'font-["Space_Mono"] uppercase tracking-wider text-zinc-500' : 'text-zinc-400'
          }`}>
            <span>TRACK LEVEL COMPANION • FIELD EDITION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MobileToolsModal;
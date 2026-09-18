import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Monitor, X, RefreshCw } from 'lucide-react';
import { PrototypeStyle } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

export interface MobileSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  mobileLayout: 'bottom_nav' | 'tabbed' | 'stacked';
  onChangeMobileLayout: (layout: 'bottom_nav' | 'tabbed' | 'stacked') => void;
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
}

const DEVICE_PRESETS = [
  { id: 'iphone', label: 'iPhone 15 / 14 Pro', width: 393, height: 852 },
  { id: 'pixel', label: 'Pixel 8 / Galaxy', width: 412, height: 915 },
  { id: 'compact', label: 'Compact Field Phone', width: 360, height: 780 },
];

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  isOpen,
  onClose,
  mobileLayout,
  onChangeMobileLayout,
  prototypeStyle = 'nothing',
  isDarkMode: _isDarkMode = true,
}) => {
  useBodyScrollLock(isOpen);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const device = DEVICE_PRESETS[selectedDeviceIndex];
  const isNothing = prototypeStyle === 'nothing';

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Send layout changes to iframe
  const handleSelectLayout = (layout: 'bottom_nav' | 'tabbed' | 'stacked') => {
    onChangeMobileLayout(layout);
    try {
      localStorage.setItem('tlc_mobile_layout', layout);
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'SET_MOBILE_LAYOUT', layout },
        '*'
      );
    } catch {
      // ignore
    }
  };

  const handleRefreshIframe = () => {
    setIframeKey(k => k + 1);
  };

  if (!isOpen) return null;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const iframeSrc = `${currentPath}?embedded_mobile=1`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Device Simulator"
    >
      {/* Top Floating Control Bar */}
      <div
        className={
          isNothing
            ? 'w-full max-w-4xl bg-black/95 border border-zinc-800 rounded-2xl px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-white shadow-2xl backdrop-blur-md shrink-0 font-["Space_Grotesk"]'
            : 'w-full max-w-4xl bg-zinc-900/90 border border-zinc-800 rounded-2xl px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-zinc-100 shadow-2xl backdrop-blur-md shrink-0'
        }
      >
        <div className="flex items-center gap-2">
          <div
            className={
              isNothing
                ? 'w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-900 text-[#D71921] flex items-center justify-center shrink-0'
                : 'w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0'
            }
          >
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={
                  isNothing
                    ? 'font-bold text-xs sm:text-sm font-["Space_Mono"] uppercase tracking-wider'
                    : 'font-bold text-xs sm:text-sm'
                }
              >
                {isNothing ? '[ Mobile Mode Simulator ]' : 'Mobile Mode Simulator'}
              </span>
              <span
                className={
                  isNothing
                    ? 'text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-["Space_Mono"] font-bold border border-zinc-700'
                    : 'text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-bold border border-amber-500/20'
                }
              >
                {device.width} × {device.height}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              Interactive mobile view without browser console. Test bottom dock & thumb zone directly.
            </p>
          </div>
        </div>

        {/* Device Preset Switcher */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-zinc-800 text-xs shrink-0">
          {DEVICE_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedDeviceIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                isNothing
                  ? selectedDeviceIndex === idx
                    ? 'bg-white text-black font-bold font-["Space_Mono"] uppercase tracking-wider shadow-xs'
                    : 'text-zinc-400 hover:text-white font-["Space_Mono"] uppercase tracking-wider'
                  : selectedDeviceIndex === idx
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p.label.split('/')[0].trim()}
            </button>
          ))}
        </div>

        {/* Mobile Layout Mode Quick Selector */}
        <div className="hidden md:flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-zinc-800 text-xs shrink-0">
          <span className={`text-[10px] text-zinc-500 uppercase px-1 ${isNothing ? 'font-["Space_Mono"]' : 'font-mono'}`}>
            Layout:
          </span>
          {(['bottom_nav', 'tabbed', 'stacked'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelectLayout(mode)}
              className={`px-2 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                isNothing
                  ? mobileLayout === mode
                    ? 'bg-white text-black font-bold font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-zinc-400 hover:text-white font-["Space_Mono"] uppercase tracking-wider'
                  : mobileLayout === mode
                  ? 'bg-zinc-200 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {mode === 'bottom_nav' ? 'Bottom Dock' : mode === 'tabbed' ? 'Top Tabs' : 'Stacked'}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRefreshIframe}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Reload phone frame"
            aria-label="Reload simulator"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={
              isNothing
                ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 text-white text-xs font-bold font-["Space_Mono"] uppercase tracking-wider transition cursor-pointer'
                : 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer'
            }
            title="Return to full desktop view (Esc)"
          >
            <Monitor className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{isNothing ? '[ Desktop View ]' : 'Desktop View'}</span>
            <X className="w-4 h-4 ml-0.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Realistic Centered Smartphone Hardware Chassis */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0 w-full">
        <div
          className="relative bg-black rounded-[48px] border-[10px] border-zinc-900 ring-1 ring-zinc-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-300"
          style={{
            width: `${device.width}px`,
            height: `${device.height}px`,
            maxHeight: 'calc(100vh - 85px)',
          }}
        >
          {/* Subtle Phone Speaker & Camera Slit */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-zinc-800/80 rounded-full z-30 pointer-events-none" />

          {/* Embedded Real Web App running at native mobile resolution */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            title="Mobile Screen Preview"
            className="w-full h-full bg-black rounded-[38px] border-none"
          />

          {/* Home Indicator Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-600/50 rounded-full z-30 pointer-events-none" />
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="text-[11px] text-zinc-500 font-mono text-center shrink-0">
        <span>Click inside the phone to interact with all mobile features. Press </span>
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px]">ESC</kbd>
        <span> to return to desktop.</span>
      </div>
    </div>
  );
};
export default MobileSimulator;

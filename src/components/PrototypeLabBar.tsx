import React, { useState, useEffect } from 'react';
import { PrototypeStyle, StyleColorMode } from '../core/types';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Layers, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Check,
  Type,
  Boxes,
  CircleDot
} from 'lucide-react';

export interface PrototypeLabBarProps {
  activeStyle: PrototypeStyle;
  onChangeStyle: (style: PrototypeStyle) => void;
  colorMode: StyleColorMode;
  onChangeColorMode: (mode: StyleColorMode) => void;
}

interface StyleMeta {
  id: PrototypeStyle;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  inspiration: string;
  palette: { dark: string; light: string; accent: string };
  features: string[];
}

export const STYLES_META: StyleMeta[] = [
  {
    id: 'nothing',
    label: 'Nothing OS',
    tagline: 'Official Nothing Design System: Space Grotesk/Mono, OLED black, flat surfaces & red accent',
    icon: CircleDot,
    inspiration: 'Nothing Phone (2a), Nothing OS 3.0 & Teenage Engineering',
    palette: { dark: '#000000', light: '#F5F5F5', accent: '#D71921' },
    features: ['Space Grotesk & Space Mono typography', 'Flat 14px surface cards (zero blur / zero shadow)', 'Nothing crimson red signal accent (#D71921)', '16px dot-matrix technical grid & LED glyph glow'],
  },
  {
    id: 'glass',
    label: 'Liquid Glass (Archived)',
    tagline: 'Spatial translucency with frosted glassmorphism & fluid blurs (original preserved)',
    icon: Layers,
    inspiration: 'Apple VisionOS & macOS Sequoia glassmorphism',
    palette: { dark: '#05060a', light: '#f5f7fc', accent: '#a855f7' },
    features: ['Multi-layer frosted glassmorphism', 'Specular light gradient borders', 'Prismatic edge highlights', 'Fluid layered elevation'],
  },
  {
    id: 'swiss',
    label: 'Swiss Typographic (Archived)',
    tagline: 'Die Neue Graphik: pure grid discipline, massive typographic contrast & SBB vermilion',
    icon: Type,
    inspiration: 'Josef Müller-Brockmann, Armin Hofmann, Max Bill & Zürich Kunstgewerbeschule',
    palette: { dark: '#09090b', light: '#ffffff', accent: '#eb0000' },
    features: ['Mathematical modular grid & zero drop-shadow fluff', 'Massive typographic contrast (giant numbers vs micro-labels)', 'Sharp 0px architectural structure rules', 'Iconic Swiss vermilion (#eb0000) focal anchors'],
  },
  {
    id: 'claymorphism',
    label: 'Tactile Claymorphism (Archived)',
    tagline: 'Puffy 3D volumetric plasticine tablets, dual inner-rim lighting & friendly pill shapes',
    icon: Boxes,
    inspiration: 'Modern 3D Clay & Plasticine UI, Apple Spatial Clay & Volumetric Design',
    palette: { dark: '#11141a', light: '#f1f4f9', accent: '#6366f1' },
    features: ['3D puffy volumetric clay surfaces', 'Dual inner-rim highlights (specular top + bevel bottom)', 'Floating diffuse drop shadows', 'Friendly, tactile squircle geometry'],
  },
  {
    id: 'cockpit',
    label: 'Tactile Cockpit (Archived)',
    tagline: 'Heavy equipment MOW cab avionics, physical 3D bevels & phosphor HUD',
    icon: Cpu,
    inspiration: 'Railroad tamper cab consoles, Teenage Engineering & NASA HUD',
    palette: { dark: '#090a0d', light: '#dce0e6', accent: '#ffb320' },
    features: ['Physical 3D beveled hardware panels', 'Amber phosphor CRT glow', 'Sunken telemetry gauge wells', 'Tactile mechanical press states'],
  },
  {
    id: 'original',
    label: 'Original System (Archived)',
    tagline: 'Standard high-contrast field leveling system',
    icon: Sparkles,
    inspiration: 'Track Level Companion Core Baseline',
    palette: { dark: '#000000', light: '#ffffff', accent: '#f59e0b' },
    features: ['Obsidian OLED battery saver', 'Bright Sunlight high contrast', 'Tested field ergonomics'],
  },
];

export const PrototypeLabBar: React.FC<PrototypeLabBarProps> = ({
  activeStyle,
  onChangeStyle,
  colorMode,
  onChangeColorMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Keyboard shortcut listener: P = cycle styles, L = toggle light/dark
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        const order: PrototypeStyle[] = [
          'nothing',
          'glass',
          'swiss',
          'claymorphism',
          'cockpit',
          'original'
        ];
        const nextIdx = (order.indexOf(activeStyle) + 1) % order.length;
        onChangeStyle(order[nextIdx]);
      } else if (e.key === 'l' || e.key === 'L') {
        onChangeColorMode(colorMode === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStyle, colorMode, onChangeStyle, onChangeColorMode]);

  const currentMeta = STYLES_META.find(s => s.id === activeStyle) || STYLES_META[0];

  return (
    <div className="w-full shrink-0 z-40 transition-all duration-200">
      {/* Main Bar */}
      <div className="bg-zinc-950/90 dark:bg-black/90 text-white backdrop-blur-xl border border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Brand & Active Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-pink-500/20 border border-white/15 text-xs font-black tracking-wide text-white">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>2026 Prototype Lab</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="View design philosophy and trend notes"
              aria-label="View style info"
            >
              <Info className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          {/* Style Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto modal-scroll-container py-0.5">
            {STYLES_META.map((meta) => {
              const Icon = meta.icon;
              const isActive = activeStyle === meta.id;
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => onChangeStyle(meta.id)}
                  className={`px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                    activeStyle === 'nothing'
                      ? isActive
                        ? 'rounded-full bg-white text-black shadow-none ring-1 ring-white/40 font-["Space_Mono"] uppercase tracking-wider'
                        : 'rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-["Space_Mono"] uppercase tracking-wider'
                      : isActive
                      ? 'rounded-xl bg-white text-black shadow-md ring-1 ring-white'
                      : 'rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                  }`}
                  title={meta.tagline}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span>{meta.label}</span>
                  {isActive && <Check className="w-3 h-3 text-black stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Dark/Light Mode Toggle + Collapse */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Dark / Light Toggle */}
            <div className={`flex p-0.5 border border-white/10 bg-white/10 ${activeStyle === 'nothing' ? 'rounded-full' : 'rounded-xl'}`}>
              <button
                type="button"
                onClick={() => onChangeColorMode('dark')}
                className={`px-2 py-1 text-xs font-bold transition flex items-center gap-1 ${
                  activeStyle === 'nothing'
                    ? colorMode === 'dark'
                      ? 'rounded-full bg-zinc-800 text-white shadow-none font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                      : 'rounded-full text-zinc-400 hover:text-white font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                    : colorMode === 'dark'
                    ? 'rounded-lg bg-zinc-800 text-white shadow-xs'
                    : 'rounded-lg text-zinc-400 hover:text-white'
                }`}
                title="Switch active style to Dark Mode"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] hidden sm:inline">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeColorMode('light')}
                className={`px-2 py-1 text-xs font-bold transition flex items-center gap-1 ${
                  activeStyle === 'nothing'
                    ? colorMode === 'light'
                      ? 'rounded-full bg-white text-black shadow-none font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                      : 'rounded-full text-zinc-400 hover:text-white font-["Space_Mono"] uppercase tracking-wider text-[10px]'
                    : colorMode === 'light'
                    ? 'rounded-lg bg-white text-black shadow-xs'
                    : 'rounded-lg text-zinc-400 hover:text-white'
                }`}
                title="Switch active style to Light Mode"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] hidden sm:inline">Light</span>
              </button>
            </div>

            {/* Collapse / Expand Info Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title={isExpanded ? 'Hide style details' : 'Show style details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Detailed Info Drawer (Expanded) */}
        {isExpanded && (
          <div className="pt-2 border-t border-white/10 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                {currentMeta.label.toUpperCase()}
              </span>
              <span className="text-zinc-300 text-xs font-medium">
                {currentMeta.tagline}
              </span>
              <span className="text-zinc-500 text-[11px] hidden md:inline">
                • Ref: <strong className="text-zinc-400">{currentMeta.inspiration}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 shrink-0 font-mono">
              <span className="hidden lg:inline bg-white/5 px-2 py-0.5 rounded">
                Key <kbd className="text-white font-bold">P</kbd> cycle styles
              </span>
              <span className="hidden lg:inline bg-white/5 px-2 py-0.5 rounded">
                Key <kbd className="text-white font-bold">L</kbd> toggle light/dark
              </span>
            </div>
          </div>
        )}

        {/* Deep Dive Modal / Popover when Info Icon Clicked */}
        {showInfo && (
          <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
            <div className="font-bold text-white flex items-center justify-between">
              <span>About {currentMeta.label} in 2026 UI Design</span>
              <button 
                type="button" 
                onClick={() => setShowInfo(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {currentMeta.tagline}. Designed based on design movements lauded in modern data & engineering platforms like {currentMeta.inspiration}.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
              {currentMeta.features.map((feat, idx) => (
                <div key={idx} className="p-1.5 rounded bg-white/5 border border-white/5 text-zinc-300">
                  ✓ {feat}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

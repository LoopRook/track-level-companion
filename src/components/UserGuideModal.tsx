import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Compass,
  Layers,
  RotateCcw,
  Sliders,
  Sun,
  Download,
  Play,
  Spline,
  Plus,
  Ruler
} from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Interactive state for Animation 1: Rod & Laser
  const [interactiveDip, setInteractiveDip] = useState<'dip' | 'level' | 'hump'>('dip');
  // Interactive state for Animation 2: Slope modes (Grade % vs End-to-End)
  const [activeSlopeDemo, setActiveSlopeDemo] = useState<'grade_percent' | 'end_to_end'>('grade_percent');

  if (!isOpen) return null;

  const steps = [
    {
      id: 'laser-rule',
      title: '1. The Laser Rule & Rod Math',
      shortTitle: 'Laser Math',
      icon: Compass,
    },
    {
      id: 'slope-modes',
      title: '2. The 2 Target Slope Modes',
      shortTitle: 'Slope Modes',
      icon: Sliders,
    },
    {
      id: 'laser-move',
      title: '3. Relocating Laser (Turning Point)',
      shortTitle: 'Laser Move',
      icon: RotateCcw,
    },
    {
      id: 'extend-chart',
      title: '4. Extending Track & Profile Chart',
      shortTitle: 'Extend & Chart',
      icon: Layers,
    },
    {
      id: 'field-tips',
      title: '5. Keypad, Checklist & Export',
      shortTitle: 'Keypad & Export',
      icon: CheckCircle2,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overscroll-contain touch-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Track Level Field Guide & Tutorial
              </h2>
              <p className="text-[11px] text-zinc-500">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].shortTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs Navigation - Desktop (sm and up) */}
        <div className="hidden sm:flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2 pt-2 gap-1 text-xs font-bold scrollbar-none shrink-0">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`px-3 py-2 rounded-t-xl transition whitespace-nowrap flex items-center gap-1.5 border-t border-x text-xs ${
                currentStep === idx
                  ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 -mb-px'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span>{s.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Step Navigation - Mobile (Zero horizontal scrolling: 5-column grid fitting 100% width) */}
        <div className="grid grid-cols-5 gap-1 p-1.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 sm:hidden shrink-0">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`py-1.5 px-0.5 rounded-lg text-center transition flex flex-col items-center justify-center gap-0.5 ${
                currentStep === idx
                  ? 'bg-amber-500 text-black font-extrabold shadow-xs'
                  : 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-semibold'
              }`}
            >
              <s.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] leading-tight truncate max-w-full">
                {idx === 0 ? 'Laser' : idx === 1 ? 'Slope' : idx === 2 ? 'Move' : idx === 3 ? 'Chart' : 'Tips'}
              </span>
            </button>
          ))}
        </div>

        {/* Step Content Body */}
        <div className="p-4 sm:p-5 modal-scroll-container flex-1 min-h-0 space-y-4 text-sm">
          
          {/* ================= STEP 0: LASER RULE & INTERACTIVE ROD ================= */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  The Golden Rule of Rotary Lasers
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  A rotary laser emits a perfectly level plane of light in the air. When you place a grade rod on the rail:
                </p>
              </div>

              {/* Interactive Rod / Laser Animation Simulator */}
              <div className="bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Play className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Interactive Simulator: Test Rail Elevation
                  </span>
                  <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-900 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      onClick={() => setInteractiveDip('dip')}
                      className={`px-2 py-1 rounded-md transition ${interactiveDip === 'dip' ? 'bg-sky-500 text-white shadow-sm' : 'text-zinc-500'}`}
                    >
                      Track Has Dip
                    </button>
                    <button
                      onClick={() => setInteractiveDip('level')}
                      className={`px-2 py-1 rounded-md transition ${interactiveDip === 'level' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-500'}`}
                    >
                      On Grade
                    </button>
                    <button
                      onClick={() => setInteractiveDip('hump')}
                      className={`px-2 py-1 rounded-md transition ${interactiveDip === 'hump' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-500'}`}
                    >
                      Track Has Hump
                    </button>
                  </div>
                </div>

                {/* Animated SVG Diagram */}
                <div className="relative w-full h-44 bg-zinc-100 dark:bg-zinc-900/70 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <svg viewBox="0 0 500 180" className="w-full h-full">
                    {/* Laser Tripod & Beam */}
                    <path d="M 40 120 L 55 60 L 70 120 M 55 60 L 55 120" stroke="#71717a" strokeWidth="2" fill="none" />
                    <rect x="47" y="45" width="16" height="15" rx="2" fill="#eab308" />
                    <circle x="55" y="50" r="3" fill="#ef4444" />
                    
                    {/* Level Laser Line across field */}
                    <line x1="55" y1="52" x2="480" y2="52" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="80" y="46" fill="#ef4444" fontSize="9" fontWeight="bold">LEVEL LASER PLANE</text>

                    {/* Ground Reference */}
                    <line x1="20" y1="160" x2="480" y2="160" stroke="#52525b" strokeWidth="2" />
                    <text x="25" y="172" fill="#71717a" fontSize="8">BALLAST / GROUND</text>

                    {/* Benchmark Station 0 (Fixed Reference) */}
                    <rect x="150" y="135" width="24" height="12" fill="#a1a1aa" rx="1" />
                    <rect x="157" y="120" width="10" height="15" fill="#71717a" />
                    {/* Benchmark Rod */}
                    <rect x="159" y="40" width="6" height="80" fill="#3b82f6" />
                    <circle cx="162" cy="52" r="2.5" fill="#ef4444" />
                    <text x="130" y="115" fill="#3b82f6" fontSize="8" fontWeight="bold">Station 0 (1' 2")</text>

                    {/* Active Station Tie & Rail - Animated Height */}
                    <g className="transition-all duration-500 ease-out" style={{
                      transform: interactiveDip === 'dip' ? 'translateY(15px)' : interactiveDip === 'hump' ? 'translateY(-15px)' : 'translateY(0px)',
                      transformOrigin: '350px 140px'
                    }}>
                      {/* Tie */}
                      <rect x="335" y="135" width="30" height="12" fill="#78350f" rx="1" />
                      {/* Rail Head */}
                      <rect x="345" y="120" width="10" height="15" fill="#52525b" />
                      {/* Rod sitting on rail */}
                      <rect x="347" y="20" width="6" height="100" fill="#f59e0b" />
                      {/* Measurement tick where laser intersects */}
                      <circle cx="350" cy={interactiveDip === 'dip' ? 37 : interactiveDip === 'hump' ? 67 : 52} r="3" fill="#ef4444" />
                    </g>

                    {/* Indicator Callout Box on right */}
                    <text x="320" y="15" fill="#f59e0b" fontSize="9" fontWeight="bold">Station 15 (Target)</text>
                  </svg>

                  {/* Overlay Result Badge */}
                  <div className="absolute right-3 top-3 bg-white/90 dark:bg-black/90 backdrop-blur border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-xl shadow-lg text-center font-mono">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Rod Reading</span>
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {interactiveDip === 'dip' ? `1' 2 3/4"` : interactiveDip === 'hump' ? `1' 1 1/4"` : `1' 2"`}
                    </span>
                    <div className={`mt-1 text-xs font-extrabold px-2 py-0.5 rounded-md flex items-center justify-center gap-1 ${
                      interactiveDip === 'dip'
                        ? 'bg-sky-500 text-white'
                        : interactiveDip === 'hump'
                        ? 'bg-amber-500 text-black'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {interactiveDip === 'dip' && <ArrowUp className="w-3 h-3 stroke-[3]" />}
                      {interactiveDip === 'hump' && <ArrowDown className="w-3 h-3 stroke-[3]" />}
                      {interactiveDip === 'level' && <CheckCircle2 className="w-3 h-3" />}
                      <span>
                        {interactiveDip === 'dip' ? 'LIFT 3/4"' : interactiveDip === 'hump' ? 'LOWER 3/4"' : 'ON GRADE ✓'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation bullets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                    <strong className="text-sky-600 dark:text-sky-400 block">Higher Rod Reading = Track is LOW</strong>
                    When track sags, the rod sinks down, so the laser hits higher on the rod's tape. The app tells you: <strong>LIFT</strong>.
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <strong className="text-amber-600 dark:text-amber-400 block">Lower Rod Reading = Track is HIGH</strong>
                    When track has a hump, the rod is pushed up, hitting lower on the rod's tape. The app tells you: <strong>LOWER</strong>.
                  </div>
                </div>

                {/* Unit Format Note */}
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 text-[11px] border border-zinc-200 dark:border-zinc-800">
                  <strong>Units & Decimals:</strong> Track Level Companion defaults to <strong>Decimal Inches</strong> (e.g. <code>6.28"</code>, <code>5.86"</code>), but seamlessly supports <strong>Fractional Inches (16ths)</strong>, <strong>Total Inches</strong>, and <strong>Metric (mm)</strong> via the header dropdown.
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: THE 2 TARGET SLOPE MODES ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  The 2 Target Slope Modes
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Choose between a continuous slope line or an anchor-based stringline in the alignment bar:
                </p>
              </div>

              {/* Mode Selector Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => setActiveSlopeDemo('grade_percent')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeSlopeDemo === 'grade_percent'
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 border-zinc-900 dark:border-zinc-700 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">1. [ Grade % ] Mode</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded font-mono">0.0%, 0.5%, 1.0%, 1.5%</span>
                  </div>
                  <span className="text-[11px] opacity-80 block mt-1">
                    Projects a continuous pitch from Station 0. Includes dead-flat 0.0% benchmark.
                  </span>
                </button>

                <button
                  onClick={() => setActiveSlopeDemo('end_to_end')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeSlopeDemo === 'end_to_end'
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 border-zinc-900 dark:border-zinc-700 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm">2. [ End-to-End ] Mode</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded font-mono">LOCKED 🔒 Anchors</span>
                  </div>
                  <span className="text-[11px] opacity-80 block mt-1">
                    Connects start to end with straight chords, automatically anchoring through Locked Ties.
                  </span>
                </button>
              </div>

              {/* Visual Diagram for Selected Slope Mode */}
              <div className="p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center">
                  <svg viewBox="0 0 450 140" className="w-full h-full p-2">
                    {/* Grid Lines */}
                    <line x1="40" y1="30" x2="420" y2="30" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="40" y1="70" x2="420" y2="70" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="40" y1="110" x2="420" y2="110" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />

                    {/* Measured Track (curved dip line) */}
                    <path d="M 50 70 Q 150 125 250 90 T 400 65" stroke="#71717a" strokeWidth="2.5" fill="none" />
                    
                    {/* Station markers */}
                    <circle cx="50" cy="70" r="4" fill="#eab308" />
                    <text x="45" y="60" fill="#eab308" fontSize="8" fontWeight="bold">0 ft</text>

                    <circle cx="150" cy="107" r="4" fill="#38bdf8" />
                    <text x="140" y="125" fill="#38bdf8" fontSize="8">Dip (Lift)</text>

                    {/* Intermediate Station 25 ft - Demonstrates locked tie in End-to-End mode */}
                    <circle cx="250" cy="90" r="4" fill={activeSlopeDemo === 'end_to_end' ? '#f59e0b' : '#38bdf8'} />
                    {activeSlopeDemo === 'end_to_end' && (
                      <g>
                        <circle cx="250" cy="90" r="9" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
                        <text x="230" y="80" fill="#f59e0b" fontSize="8" fontWeight="bold">LOCKED 🔒</text>
                      </g>
                    )}

                    <circle cx="400" cy="65" r="4" fill="#eab308" />
                    <text x="390" y="55" fill="#eab308" fontSize="8" fontWeight="bold">50 ft</text>

                    {/* Target Slope Line (Green Dash) */}
                    {activeSlopeDemo === 'grade_percent' ? (
                      <line x1="40" y1="70" x2="420" y2="70" stroke="#10b981" strokeWidth="3" strokeDasharray="6 3" />
                    ) : (
                      <polyline points="50,70 250,90 400,65" stroke="#10b981" strokeWidth="3" strokeDasharray="6 3" fill="none" />
                    )}

                    <text x="60" y="20" fill="#10b981" fontSize="9" fontWeight="bold">
                      --- GREEN DASH: TARGET LINE ({activeSlopeDemo === 'grade_percent' ? 'Grade % (0.0% Flat)' : 'End-to-End Chords via Locked Anchor'})
                    </text>
                  </svg>
                </div>

                {/* Explanation */}
                <div className="text-xs space-y-1.5 leading-relaxed">
                  {activeSlopeDemo === 'grade_percent' ? (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      <strong>Grade % Mode:</strong> Holds Station 0 as your benchmark. Tap <strong>0.0%</strong> for a dead-flat line across yard tracks, or choose <strong>0.5%</strong>, <strong>1.0%</strong>, or <strong>1.5%</strong>. You can also tap directly into the slope box to type any custom grade (e.g. <code>0.25%</code>, <code>-0.75%</code>), or use the <strong>"📐 Evaluate Grade"</strong> tool on the chart to apply a measured track section slope with one click.
                    </p>
                  ) : (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      <strong>End-to-End Mode:</strong> Stretches straight chords between your starting tie and ending tie, anchoring through any intermediate <strong>Locked Ties (🔒)</strong>. The app displays the resulting grade percentage in the top alignment bar and on-screen slope badges directly along each chord of the graph (e.g. <code>+0.67% ↗</code>, <code>-0.50% ↘</code>). If a locked obstacle sits high, expand your survey further down the line with <strong>+ Extend</strong> to feather the rise and fall across more ties.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: LASER RELOCATION (TURNING POINT) ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Relocating the Laser: Unified Active Scale
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  When you run out of line-of-sight or move your laser tripod down the track, here is the exact 3-step workflow:
                </p>
              </div>

              {/* Turning Point Workflow Card */}
              <div className="p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Pick a Benchmark Tie (e.g. Station 25 ft)
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Take your normal rod reading with <strong>Laser 1</strong> (e.g. <code>1' 2"</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Move Laser Tripod & Re-Shoot the Same Tie
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Set up the tripod further down the track. Place the rod back on Station 25 and read the beam on <strong>Laser 2</strong> (e.g. <code>1' 8"</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Tap "Move Laser (Datum)" in the Toolbar
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Tap the purple <strong>Move Laser (Datum)</strong> button in the checklist header, enter <code>1' 8"</code>, and tap <strong>Apply Laser Relocation</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Result Box */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1.5 text-xs">
                  <strong className="text-purple-800 dark:text-purple-300 flex items-center gap-1.5 font-bold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    What the App Does Automatically:
                  </strong>
                  <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-300 space-y-1 text-[11px]">
                    <li>
                      <strong>All earlier stations convert to Laser 2 (+6"):</strong> Station 0 updates from <code>1' 2"</code> to <code>1' 8"</code>. If you walk back to Station 0 with your rod right now, <strong>the number on your screen matches your rod receiver!</strong>
                    </li>
                    <li>
                      <strong>Zero mental math:</strong> Enter future ties directly on the active laser scale without subtracting offsets.
                    </li>
                    <li>
                      <strong>Revert Button:</strong> If you made an entry typo on the turning point, tap <strong>"Revert Laser Move"</strong> in the purple banner to undo.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EXTENDING & PROFILE CHART ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Extending Track & Profile Chart Controls
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Easily expand your survey in either direction, evaluate grades, and inspect the track profile:
                </p>
              </div>

              <div className="space-y-3">
                {/* Subset Grade Evaluation Tool */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-sky-500/30 dark:border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 stroke-[2.5]" />
                      <span>Subset Grade Evaluation Tool ("Evaluate Grade")</span>
                    </h4>
                    <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30 whitespace-nowrap shrink-0">
                      New Tool
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Evaluate the exact slope, elevation difference, and chord line between <strong>any two stations</strong> along the track:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <strong className="text-zinc-900 dark:text-zinc-100 block">How to Select Stations:</strong>
                      <span className="text-zinc-500 block">
                        Tap <strong>"Evaluate Grade"</strong> (or <strong>"Grade"</strong> on mobile) to pick Start & End from dropdowns, or simply tap two stations on the graph. On mobile, press and drag across ties to scrub with live preview!
                      </span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <strong className="text-zinc-900 dark:text-zinc-100 block">Live Calculations & 1-Click Apply:</strong>
                      <span className="text-zinc-500 block">
                        Displays <strong>Span</strong>, <strong>Rise / Fall</strong>, <strong>Chord Grade %</strong>, and <strong>Best-Fit Regression %</strong>. Tap <strong>"Apply as Target"</strong> to instantly set this slope as your survey target in Grade % mode.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Chart Controls & Mobile Touch Gestures */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Spline className="w-4 h-4 text-amber-500" />
                    <span>Vertical Profile Chart Controls & Touch Gestures</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <strong className="block text-zinc-900 dark:text-zinc-100 font-bold">Curve vs Straight</strong>
                      <span className="text-zinc-500">Toggle smooth Fritsch-Carlson monotone spline vs point-to-point chords.</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <strong className="block text-zinc-900 dark:text-zinc-100 font-bold">Zoom (1x / 3x / 8x / 15x)</strong>
                      <span className="text-zinc-500">1x is true scale. 3x is standard gentle view. 8x and 15x exaggerate micro-leveling.</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <strong className="block text-zinc-900 dark:text-zinc-100 font-bold">Touch Tap & Scrub</strong>
                      <span className="text-zinc-500">Full-height hit zones make tapping easy. Tap node to inspect or tap <strong>[✏️ Edit]</strong> to open keypad.</span>
                    </div>
                  </div>
                </div>

                {/* The + Extend Modal */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      The "+ Extend" Button Modal
                    </h4>
                    <p className="text-zinc-500 leading-relaxed">
                      Tap <strong>+ Extend</strong> in the checklist toolbar to add stations in bulk:
                    </p>
                    <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-0.5 text-[11px]">
                      <li><strong>Ahead (Forward →):</strong> Appends new stations after the end of your track (+25', +50', +100').</li>
                      <li><strong>Behind 0 (Backward ←):</strong> Inserts negative stations (<code>-5 ft, -10 ft...</code>) before Station 0 for feathering runouts into undisturbed track.</li>
                    </ul>
                  </div>
                </div>

                {/* Custom Pt & Add Next */}
                <div className="p-3 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">Quick Toolbar Additions:</span>
                    <p className="text-zinc-500 text-[11px]">
                      Use <strong>+ Custom Pt</strong> for irregular stations (e.g. <code>12.5 ft</code> at an insulated joint) or <strong>Add Next</strong> for one-click tie append.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: KEYPAD & EXPORT ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Rapid Keypad, Mobile Cards & Export
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Built specifically for rapid one-handed surveying with phone or tablet in the dirt:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Target Rod vs Elevation Toggle */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block">
                    Target Rod vs. Relative Elev
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Toggle between <strong>Target Rod</strong>, <strong>Relative Elev</strong>, or <strong>Both</strong>. Target Rod tells you exactly what reading your laser receiver should hit when the tie is leveled!
                  </p>
                </div>

                {/* Adaptive Keypad */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    ⚡ Adaptive Touch Keypad (Decimal Default)
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Defaults to <strong>Decimal Inches</strong> with rapid ±0.1" and ±1.0" steppers. Automatically adapts if you switch to 16th fractions, total inches, or metric mm.
                  </p>
                </div>

                {/* Station Advance Feedback */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Station Advance Feedback
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Tapping <strong>Next Station (→)</strong> provides immediate tactile visual feedback and glow transition so you always know your reading saved and you're at the next tie.
                  </p>
                </div>

                {/* Google Sheets & CSV Template */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    Google Sheets & CSV Template
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Download a clean spreadsheet template or 1-click copy TSV to paste directly into Google Sheets. Take readings trackside and re-upload in seconds.
                  </p>
                </div>

                {/* Sunlight Mode */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Bright Sunlight Mode
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Working under intense glare? Tap the Sun/Moon toggle in the header for high-contrast daylight visibility.
                  </p>
                </div>

                {/* + New Track / Start Fresh */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                    + New Track / Safety Backup
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Tap <strong>+ New Track</strong> in the header to start a blank survey at Station 0, generate an empty grid, or wipe readings with automatic safety backup.
                  </p>
                </div>
              </div>

              {/* Offline Support */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ <strong>100% Offline PWA:</strong> Track Level Companion operates completely offline without internet or cellular data. Install it to your home screen and survey deep in rail cuts with zero reception.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Navigation */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-5 bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-sm active:scale-95"
            >
              Got It!
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

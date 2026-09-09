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
  Lock,
  Download,
  Play
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Interactive state for Animation 1: Rod & Laser
  const [interactiveDip, setInteractiveDip] = useState<'dip' | 'level' | 'hump'>('dip');
  // Interactive state for Animation 2: Slope modes
  const [activeSlopeDemo, setActiveSlopeDemo] = useState<'flat' | 'grade' | 'best_fit' | 'chord'>('flat');

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
      title: '2. The 4 Slope Modes',
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
      id: 'extend-track',
      title: '4. Extending & Feathering Before 0',
      shortTitle: 'Extending',
      icon: Layers,
    },
    {
      id: 'field-tips',
      title: '5. Field Checklist, Keypad & Export',
      shortTitle: 'Field Guide',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
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

        {/* Step Tabs Navigation */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2 pt-2 gap-1 text-xs font-bold scrollbar-none">
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

        {/* Step Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
          
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
                      className={`px-2 py-1 rounded-md transition ${interactiveDip === 'dip' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-500'}`}
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
                      className={`px-2 py-1 rounded-md transition ${interactiveDip === 'hump' ? 'bg-blue-500 text-white shadow-sm' : 'text-zinc-500'}`}
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
                        ? 'bg-amber-500 text-black'
                        : interactiveDip === 'hump'
                        ? 'bg-blue-600 text-white'
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
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <strong className="text-amber-700 dark:text-amber-400 block">Big Number = Track is LOW</strong>
                    When track sags, the rod sinks down, so the laser hits higher on the rod. The app tells you: <strong>LIFT</strong>.
                  </div>
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <strong className="text-blue-700 dark:text-blue-400 block">Small Number = Track is HIGH</strong>
                    When track has a hump, the rod is pushed up, hitting lower on the rod. The app tells you: <strong>LOWER</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: THE 4 SLOPE MODES ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  The 4 Target Slope Modes
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  How does the app determine the target elevation for every tie? Choose the mode that fits your job:
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'flat', label: '1. Benchmark (0%)', desc: 'Dead Level' },
                  { id: 'grade', label: '2. Target Grade', desc: 'Climb / Fall %' },
                  { id: 'best_fit', label: '3. Best Fit', desc: 'Smoothing' },
                  { id: 'chord', label: '4. 2-Point Chord', desc: 'Start to End' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setActiveSlopeDemo(m.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      activeSlopeDemo === m.id
                        ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="block font-extrabold">{m.label}</span>
                    <span className="text-[10px] opacity-80 block">{m.desc}</span>
                  </button>
                ))}
              </div>

              {/* Visual Diagram for Selected Slope Mode */}
              <div className="p-4 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="h-36 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center">
                  <svg viewBox="0 0 450 140" className="w-full h-full p-2">
                    {/* Grid Lines */}
                    <line x1="40" y1="30" x2="420" y2="30" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="40" y1="70" x2="420" y2="70" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="40" y1="110" x2="420" y2="110" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 2" />

                    {/* Measured Track (curved dip line) */}
                    <path d="M 50 70 Q 150 120 250 85 T 400 60" stroke="#71717a" strokeWidth="2.5" fill="none" />
                    <circle cx="50" cy="70" r="3.5" fill="#eab308" />
                    <circle cx="150" cy="102" r="3.5" fill="#ef4444" />
                    <circle cx="250" cy="85" r="3.5" fill="#ef4444" />
                    <circle cx="400" cy="60" r="3.5" fill="#eab308" />

                    {/* Target Slope Line (Colored Dash) */}
                    {activeSlopeDemo === 'flat' && (
                      <line x1="40" y1="70" x2="420" y2="70" stroke="#10b981" strokeWidth="3" strokeDasharray="4 3" />
                    )}
                    {activeSlopeDemo === 'grade' && (
                      <line x1="40" y1="100" x2="420" y2="40" stroke="#10b981" strokeWidth="3" strokeDasharray="4 3" />
                    )}
                    {activeSlopeDemo === 'best_fit' && (
                      <line x1="40" y1="90" x2="420" y2="65" stroke="#10b981" strokeWidth="3" strokeDasharray="4 3" />
                    )}
                    {activeSlopeDemo === 'chord' && (
                      <line x1="50" y1="70" x2="400" y2="60" stroke="#10b981" strokeWidth="3" strokeDasharray="4 3" />
                    )}

                    <text x="60" y="20" fill="#10b981" fontSize="10" fontWeight="bold">
                      --- GREEN DASH: TARGET ELEVATION LINE
                    </text>
                    <text x="280" y="130" fill="#71717a" fontSize="9">
                      — Gray Line: Measured Track
                    </text>
                  </svg>
                </div>

                {/* Explanation of active mode */}
                <div className="text-xs space-y-1.5">
                  {activeSlopeDemo === 'flat' && (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <strong>Benchmark Mode (0.0%):</strong> Uses Station 0 as the reference elevation and keeps a dead-flat line across all ties. Best for yard tracks, sidings, and tangent track where no grade change is intended.
                    </p>
                  )}
                  {activeSlopeDemo === 'grade' && (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <strong>Target Grade Mode:</strong> Enter a specific slope like <strong>+0.50%</strong> (1/2" rise per 100 ft) or <strong>-1.0%</strong>. The target line rises or falls automatically at that exact pitch.
                    </p>
                  )}
                  {activeSlopeDemo === 'best_fit' && (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <strong>Best Fit (Smoothing):</strong> Uses statistical linear regression to find the natural average plane of your measured ties. It irons out dips and humps while minimizing total ballast lifting.
                    </p>
                  )}
                  {activeSlopeDemo === 'chord' && (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <strong>Two-Point Chord:</strong> Draws a straight stringline between Station 0 and your final tie. Perfect when tie-in elevations are already fixed at both ends (e.g. between two grade crossings).
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
                        Pick a Solid Benchmark Tie (e.g. Station 25 ft)
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
                        Set up the tripod further down the track. Place the rod back on Station 25 and shoot it with <strong>Laser 2</strong> (e.g. <code>1' 8"</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        Tap "Move Laser" in the App
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        On Station 25, tap <strong>Move Laser</strong> and enter <code>1' 8"</code>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Magic Result Box */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
                  <strong className="text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-bold">
                    <RotateCcw className="w-3.5 h-3.5" />
                    What the App Does Automatically:
                  </strong>
                  <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-300 space-y-1 text-[11px]">
                    <li>
                      <strong>All earlier stations convert to Laser 2 (+6"):</strong> Station 0 changes from <code>1' 2"</code> to <code>1' 8"</code>. If you walk back to Station 0 with your rod right now, <strong>the number on your phone matches your receiver!</strong>
                    </li>
                    <li>
                      <strong>Zero mental math:</strong> Enter future ties directly on the new laser without subtracting offsets.
                    </li>
                    <li>
                      <strong>Revert Button:</strong> If you made an entry typo on the turning point, tap <strong>"Revert Laser Move"</strong> at the top to undo.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: EXTENDING & BEFORE 0 ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Extending the Checklist & Feathering Before 0
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Never restart a survey just because you need more ties. You can extend in both directions:
                </p>
              </div>

              <div className="space-y-3">
                {/* Extending Forward */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      Extending Forward (+25 ft / +50 ft)
                    </h4>
                    <p className="text-zinc-500 mt-0.5 leading-relaxed">
                      At the bottom of the checklist, tap <strong>+25 ft</strong> or <strong>+50 ft</strong> to add the next batch of 5-foot stations. You can also tap <strong>+ Add Custom Station</strong> to drop an intermediate station (e.g. <code>12.5 ft</code> at an insulated joint).
                    </p>
                  </div>
                </div>

                {/* Extending Before 0 */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      Extending Before 0 (Feathering Runout)
                    </h4>
                    <p className="text-zinc-500 mt-0.5 leading-relaxed">
                      If you need to taper the lift back into undisturbed track before your Station 0 benchmark, tap <strong>Extend Before 0 (-25 ft)</strong> at the top of the table. It inserts <code>-5 ft, -10 ft, -15 ft...</code> without changing the name of your physical Station 0 tie!
                    </p>
                  </div>
                </div>

                {/* Locking Ties */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                  <div className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      Locking Immovable Ties (🔒 Lock Button)
                    </h4>
                    <p className="text-zinc-500 mt-0.5 leading-relaxed">
                      If a tie is over a bridge abutment, road crossing, or tree root and cannot be lifted or tamped, tap the <strong>Lock (🔒)</strong> icon. The app marks it fixed and will not instruct lifts on that tie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FIELD TIPS & EXPORT ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Field Tips, Keypad & Backup
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Pro-tips to move fast when working trackside with your phone or iPad:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Rapid Keypad */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    ⚡ Rapid Fraction Keypad
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Tap any station to open the big-button fraction keypad. Tap <strong>Save & Next</strong> to automatically jump straight to the next tie down the line.
                  </p>
                </div>

                {/* Sunlight Mode */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Bright Sunlight Mode
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Working at high noon? Tap the Sun/Moon toggle in the top header for high-contrast sunlight mode to prevent glare on your screen.
                  </p>
                </div>

                {/* 1/16" vs 1/8" Resolution */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block">
                    🎯 Fraction Resolution
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    In settings, switch between <strong>1/8"</strong> (standard production track tamping) and <strong>1/16"</strong> (precision bridge/switch surveying).
                  </p>
                </div>

                {/* Universal CSV Export */}
                <div className="p-3.5 bg-zinc-50 dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    Universal CSV Export
                  </span>
                  <p className="text-zinc-500 leading-relaxed">
                    Tap <strong>Files / Export</strong> to download a CSV, copy to clipboard, or send via AirDrop/messaging directly from your phone.
                  </p>
                </div>
              </div>

              {/* Complete Offline Support Note */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ <strong>100% Offline PWA:</strong> Track Level Companion runs completely offline in airplane mode. You can install it on your home screen and survey deep in cuts or tunnels with zero cell reception.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Navigation */}
        <div className="bg-zinc-100 dark:bg-black px-4 sm:px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
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

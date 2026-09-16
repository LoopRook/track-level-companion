import React from 'react';
import {
  Compass,
  Ruler,
  TrendingUp,
  Hammer,
  CheckCircle2,
  Share2,
  Lock,
  Flag,
  Sparkles,
} from 'lucide-react';
import { TrackProject } from './types';

export interface TutorialStepConfig {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  targetSelector: string;
  content: string;
  proTip?: string;
  actionHint?: string;
  autoFillOnNext?: () => void;
}

export interface TutorialDefinition {
  id: string;
  title: string;
  shortTitle: string;
  category: 'Basics' | 'Grade & Align' | 'Field Operations';
  duration: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  createProject: () => TrackProject;
  steps: TutorialStepConfig[];
}

export const TUTORIAL_GETTING_STARTED: TutorialDefinition = {
  id: 'getting-started',
  title: 'Getting Started: The Field Survey Cycle',
  shortTitle: 'Field Survey Cycle',
  category: 'Basics',
  duration: '2 min',
  badge: 'Recommended',
  description:
    'Learn how to record laser rod readings, understand the green tolerance margin, read the profile sag graph, verify lifted track, and share field data.',
  icon: Compass,
  createProject: () => ({
    id: 'tutorial-project-getting-started',
    name: 'Tutorial (25ft Section)',
    date: new Date().toISOString().split('T')[0],
    gauge: '7 1/4"',
    unitFormat: 'decimal_inches',
    fractionResolution: 16,
    toleranceInches: 0.05,
    stationIntervalFt: 5,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'target_grade',
    targetGradePercent: 0.0,
    stations: [
      { id: 'tut-0', distanceFt: 0, readingInches: null },
      { id: 'tut-5', distanceFt: 5, readingInches: null },
      { id: 'tut-10', distanceFt: 10, readingInches: null },
      { id: 'tut-15', distanceFt: 15, readingInches: null },
      { id: 'tut-20', distanceFt: 20, readingInches: null },
      { id: 'tut-25', distanceFt: 25, readingInches: null },
    ],
  }),
  steps: [
    {
      id: 'benchmark',
      stepNumber: 1,
      totalSteps: 7,
      title: '1. The Reference Benchmark (Station 0)',
      shortTitle: 'Benchmark',
      icon: Compass,
      targetSelector: '[data-tutorial="station-reading-0"]',
      content:
        'Every track leveling survey starts at Station 0. Imagine your rotary laser is set up on a tripod nearby. You place your grade rod on top of the rail head at Station 0 to establish your baseline elevation datum.',
      actionHint: 'Tap the cell to enter 5.25" with your keyboard/numpad or touch keys, or tap Next Step.',
      proTip: 'All other ties along your track will be compared against this reference datum.',
    },
    {
      id: 'survey-tie',
      stepNumber: 2,
      totalSteps: 7,
      title: '2. Surveying Ties Down the Line',
      shortTitle: 'Survey Tie',
      icon: Ruler,
      targetSelector: '[data-tutorial="station-reading-5"]',
      content:
        'Now walk 5 feet down the track to Station 5. Place the grade rod on the rail head and record the laser reading.',
      actionHint: 'Enter 5.625" (5-5/8") and press Enter or tap "Save & Analyze Track".',
      proTip:
        'Surveying rule: A LARGER rod reading (5.625" vs 5.25") means the detector slid lower—the rail head is physically dipped!',
    },
    {
      id: 'tolerance-margin',
      stepNumber: 3,
      totalSteps: 7,
      title: '3. The Tolerance Margin',
      shortTitle: 'Tolerance Margin',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="station-row-10"]',
      content:
        'Notice Station 10: The laser rod read 5.28"—which is 0.03" off your 5.25" target—yet its badge is green (ON GRADE ✓)! That is your tolerance margin (±0.05") in action. Railroad trackwork doesn\'t require millimeter perfection on every tie; staying within the green margin guarantees smooth running while saving hours of unnecessary shimming.',
      actionHint: 'Review Station 10\'s green ON GRADE status, then tap Next Step.',
      proTip:
        'You can customize your railroad\'s tolerance threshold (e.g., ±1/16" or ±1/8") in Settings anytime.',
    },
    {
      id: 'profile-graph',
      stepNumber: 4,
      totalSteps: 7,
      title: '4. Visualizing the Sag Dip',
      shortTitle: 'Profile Graph',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="profile-chart"]',
      content:
        'The Profile Graph plots your entire rail surface in real time. Notice the visible sag dip between 0 ft and 10 ft. The green dashed line is your target grade plane.',
      actionHint: 'Review the sag in the curve, then tap Next Step.',
      proTip:
        'Uncorrected sags collect ponding rainwater, trigger ballast mud-pumping, and create jarring equipment dips when trains pass.',
    },
    {
      id: 'level-track',
      stepNumber: 5,
      totalSteps: 7,
      title: '5. Verification Shot: Raise to Grade',
      shortTitle: 'Verification Shot',
      icon: Hammer,
      targetSelector: '[data-tutorial="station-reading-5"]',
      content:
        'Your crew placed the track jack at Station 5, raised the rail 3/8", and tamped ballast. Now record your verification shot! Tap Station 5\'s reading cell (5.625") and enter 5.25" to bring the tie onto target grade.',
      actionHint: 'Tap Station 5\'s reading cell and enter 5.25" using your keyboard, numpad, or touch keys.',
      proTip:
        'Taking a verification shot confirms the rail physically lifted to the target grade line and turns the tie green.',
    },
    {
      id: 'complete-check',
      stepNumber: 6,
      totalSteps: 7,
      title: '6. Crew Checkoff & Verification',
      shortTitle: 'Checkoff',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="station-complete-5"]',
      content:
        'With Station 5 raised to grade and verified green (ON GRADE ✓), tap the circle checkbox to mark Station 5 as finished work (LEVELED ✓).',
      actionHint: 'Tap the circle checkbox on Station 5 to mark it complete!',
      proTip:
        'Checking off completed ties keeps your track crew in sync so no one loses track of which ties are finished.',
    },
    {
      id: 'export-share',
      stepNumber: 7,
      totalSteps: 7,
      title: '7. Documenting & QR Sharing',
      shortTitle: 'Share & Export',
      icon: Share2,
      targetSelector: '[data-tutorial="header-actions"]',
      content:
        'Tap Files to download a CSV backup or print a clean inspection report for your railroad records. Or tap Share via QR Code to beam the track to a crew member\'s phone with zero internet!',
      actionHint: 'Tap Finish Tutorial to complete.',
      proTip: 'Track Level Companion works 100% offline out in the woods or at the track.',
    },
  ],
};

export const TUTORIAL_LOCKED_POINTS: TutorialDefinition = {
  id: 'locked-points',
  title: 'Locked Control Points: Fixed Obstacles',
  shortTitle: 'Locked Obstacles',
  category: 'Grade & Align',
  duration: '90 sec',
  badge: 'Advanced',
  description:
    'Handle immovable tree roots, road crossings, or bridge abutments. Lock a high spot to dynamically float the grade line and calculate minimum ballast lifts around it.',
  icon: Lock,
  createProject: () => ({
    id: 'tutorial-project-locked-points',
    name: 'Tutorial: Locked Obstacle (40ft Section)',
    date: new Date().toISOString().split('T')[0],
    gauge: '7 1/4"',
    unitFormat: 'decimal_inches',
    fractionResolution: 16,
    toleranceInches: 0.05,
    stationIntervalFt: 10,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'end_to_end',
    targetGradePercent: 0.0,
    stations: [
      { id: 'tut-lp-0', distanceFt: 0, readingInches: 6.0 },
      { id: 'tut-lp-10', distanceFt: 10, readingInches: 6.0 },
      { id: 'tut-lp-20', distanceFt: 20, readingInches: 5.2 },
      { id: 'tut-lp-30', distanceFt: 30, readingInches: 6.0 },
      { id: 'tut-lp-40', distanceFt: 40, readingInches: 6.0 },
    ],
  }),
  steps: [
    {
      id: 'lp-obstacle',
      stepNumber: 1,
      totalSteps: 4,
      title: '1. The Fixed Obstacle Dilemma',
      shortTitle: 'Obstacle Dilemma',
      icon: Sparkles,
      targetSelector: '[data-tutorial="station-row-20"]',
      content:
        'Station 20 sits atop an immovable tree root or fixed bridge abutment. Notice the yellow CUT badge (-0.80"): standard end-to-end leveling asks you to dig down, which is physically impossible through solid bridge concrete or heavy roots!',
      actionHint: 'Notice Station 20 requires cutting. We need to lock this station so the grade line lifts over it.',
      proTip:
        'In live steam and grand-scale railroading, you almost never dig down into settled roadbed; you raise the surrounding track up to clear high spots.',
    },
    {
      id: 'lp-toggle-lock',
      stepNumber: 2,
      totalSteps: 4,
      title: '2. Lock Station 20 as Fixed Anchor',
      shortTitle: 'Lock Tie',
      icon: Lock,
      targetSelector: '[data-tutorial="station-lock-20"]',
      content:
        'Click the Padlock icon on Station 20. This designates it as a fixed control point (ROOT / PIVOT) that cannot be lowered.',
      actionHint: 'Click the Padlock icon on Station 20 to lock it, or tap Next Step.',
      proTip:
        'Locked points stay exactly at their surveyed elevation, anchoring the calculated grade plane.',
    },
    {
      id: 'lp-profile-adjustment',
      stepNumber: 3,
      totalSteps: 4,
      title: '3. Grade Line Auto-Adjustment',
      shortTitle: 'Auto-Adjustment',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="profile-chart"]',
      content:
        'Observe the Profile Chart! The green grade plane instantly adjusted upward, pivoting cleanly through Station 20. Instead of cutting the fixed root, the app now calculates gentle, safe ballast lifts on the surrounding ties!',
      actionHint: 'Review the new lifted grade profile on the graph, then tap Next Step.',
      proTip:
        'You can lock multiple fixed points along a long track section. The app will calculate multi-chord grade breaks seamlessly.',
    },
    {
      id: 'lp-review-lifts',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Execute the Balanced Lifts',
      shortTitle: 'Balanced Lifts',
      icon: Hammer,
      targetSelector: '[data-tutorial="station-row-10"]',
      content:
        'Check Stations 10 and 30 in the checklist table: both now show smooth, manageable lifts (+0.40") that carry your train smoothly onto the bridge deck with zero jarring dips or clearance snags.',
      actionHint: 'Tap Finish Tutorial to complete.',
      proTip:
        'Locking high points prevents rail humps and kinked joints at grade crossings and bridge approaches.',
    },
  ],
};

export const TUTORIAL_EVALUATE_GRADE: TutorialDefinition = {
  id: 'evaluate-grade',
  title: 'Evaluate Grade: Checking Slopes',
  shortTitle: 'Evaluate Grade',
  category: 'Grade & Align',
  duration: '60 sec',
  badge: 'Essential',
  description:
    'Inspect localized track pitch, slope percentage, and elevation rise between any two stations on your line using the Profile Chart\'s Evaluate Grade tool.',
  icon: Ruler,
  createProject: () => ({
    id: 'tutorial-project-evaluate-grade',
    name: 'Tutorial: Evaluate Grade (85ft Section)',
    date: new Date().toISOString().split('T')[0],
    gauge: '7 1/4"',
    unitFormat: 'decimal_inches',
    fractionResolution: 16,
    toleranceInches: 0.05,
    stationIntervalFt: 5,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'end_to_end',
    targetGradePercent: 0.0,
    stations: [
      { id: 'tut-eg-0', distanceFt: 0, readingInches: 6.28 },
      { id: 'tut-eg-5', distanceFt: 5, readingInches: 6.22 },
      { id: 'tut-eg-10', distanceFt: 10, readingInches: 6.08 },
      { id: 'tut-eg-15', distanceFt: 15, readingInches: 5.94 },
      { id: 'tut-eg-20', distanceFt: 20, readingInches: 5.94 },
      { id: 'tut-eg-25', distanceFt: 25, readingInches: 5.86 },
      { id: 'tut-eg-30', distanceFt: 30, readingInches: 5.78 },
      { id: 'tut-eg-35', distanceFt: 35, readingInches: 5.63 },
      { id: 'tut-eg-40', distanceFt: 40, readingInches: 5.48 },
      { id: 'tut-eg-45', distanceFt: 45, readingInches: 5.2 },
      { id: 'tut-eg-50', distanceFt: 50, readingInches: 4.9 },
      { id: 'tut-eg-55', distanceFt: 55, readingInches: 4.74 },
      { id: 'tut-eg-60', distanceFt: 60, readingInches: 4.48 },
      { id: 'tut-eg-65', distanceFt: 65, readingInches: 4.18 },
      { id: 'tut-eg-70', distanceFt: 70, readingInches: 3.94 },
      { id: 'tut-eg-75', distanceFt: 75, readingInches: 3.76 },
      { id: 'tut-eg-80', distanceFt: 80, readingInches: 3.66 },
      { id: 'tut-eg-85', distanceFt: 85, readingInches: 3.42 },
    ],
  }),
  steps: [
    {
      id: 'eg-activate-btn',
      stepNumber: 1,
      totalSteps: 4,
      title: '1. Activate Evaluate Grade Tool',
      shortTitle: 'Activate Tool',
      icon: Ruler,
      targetSelector: '[data-tutorial="evaluate-grade-btn"]',
      content:
        'When maintaining scenic railroads or sidings, you often need to check whether a specific section (like a road crossing approach or switch lead) meets slope specifications. Click "Evaluate Grade" on the Profile Chart toolbar.',
      actionHint: 'Click "Evaluate Grade" on the graph toolbar, or tap Next Step.',
      proTip:
        'Evaluate Grade lets you measure pitch, span, and total rise between any subset of ties without altering your project settings.',
    },
    {
      id: 'eg-choose-stations',
      stepNumber: 2,
      totalSteps: 4,
      title: '2. Select Start & End Stations',
      shortTitle: 'Select Span',
      icon: Compass,
      targetSelector: '[data-tutorial="evaluate-grade-from"]',
      content:
        'The subset tool allows measuring between any two points along the track. By default, it spans the entire section, but you can choose any start and end station dropdown to inspect localized pitch.',
      actionHint: 'Review the subset station selectors, then tap Next Step.',
      proTip:
        'Inspecting 20-30 foot segments helps pinpoint localized grade spikes that could cause train stalls or coupler breaks.',
    },
    {
      id: 'eg-inspect-readout',
      stepNumber: 3,
      totalSteps: 4,
      title: '3. Inspect Pitch, Span & Rise',
      shortTitle: 'Inspect Readout',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="evaluate-grade-readout"]',
      content:
        'Look at the real-time readout: it displays the exact distance Span (85 ft), physical Rise/Fall (+2.86"), and computed slope (+0.28% grade ↗). This reveals the true slope of your track!',
      actionHint: 'Review the calculated grade and rise/fall readout, then tap Next Step.',
      proTip:
        'The app also displays the Best-Fit regression slope if intermediate stations deviate from a straight chord.',
    },
    {
      id: 'eg-apply-target',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Apply as Target Grade (Optional)',
      shortTitle: 'Apply Slope',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="evaluate-grade-apply"]',
      content:
        'If you want your entire track realignment target to adopt this measured slope, click "Apply as Target". This instantly sets your project\'s target slope without manual arithmetic!',
      actionHint: 'Tap Finish Tutorial to complete.',
      proTip:
        'Applying a measured grade sets your target slope to match existing terrain, minimizing the amount of ballast needed.',
    },
  ],
};

export const TUTORIAL_LASER_RELOCATION: TutorialDefinition = {
  id: 'laser-relocation',
  title: 'Laser Relocation & Turning Points',
  shortTitle: 'Laser Relocation',
  category: 'Field Operations',
  duration: '90 sec',
  badge: 'Field Work',
  description:
    'Move your rotary laser forward along a curve or long tangent without losing your elevation benchmark or introducing cumulative errors.',
  icon: Flag,
  createProject: () => ({
    id: 'tutorial-project-laser-relocation',
    name: 'Tutorial: Laser Relocation (50ft Section)',
    date: new Date().toISOString().split('T')[0],
    gauge: '7 1/4"',
    unitFormat: 'decimal_inches',
    fractionResolution: 16,
    toleranceInches: 0.05,
    stationIntervalFt: 10,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'end_to_end',
    targetGradePercent: 0.0,
    stations: [
      { id: 'tut-lr-0', distanceFt: 0, readingInches: 5.25 },
      { id: 'tut-lr-10', distanceFt: 10, readingInches: 5.3 },
      { id: 'tut-lr-20', distanceFt: 20, readingInches: 5.35 },
      { id: 'tut-lr-30', distanceFt: 30, readingInches: 5.4 },
      { id: 'tut-lr-40', distanceFt: 40, readingInches: 5.45 },
      { id: 'tut-lr-50', distanceFt: 50, readingInches: 5.5 },
      { id: 'tut-lr-60', distanceFt: 60, readingInches: null },
      { id: 'tut-lr-70', distanceFt: 70, readingInches: null },
    ],
  }),
  steps: [
    {
      id: 'lr-turning-point',
      stepNumber: 1,
      totalSteps: 4,
      title: '1. The Turning Point Benchmark',
      shortTitle: 'Benchmark Tie',
      icon: Flag,
      targetSelector: '[data-tutorial="station-row-50"]',
      content:
        'You have surveyed 50 feet of track with your rotary laser on Tripod Position 1. Ahead lies heavy brush or a curve that obstructs the laser beam. Before moving your tripod, pick an established tie—Station 50—to serve as your Turning Point (TP) benchmark.',
      actionHint: 'Station 50 is our benchmark tie with a recorded rod reading of 5.50". Tap Next Step.',
      proTip:
        'Always pick a solid, undisturbed tie or firm rail joint as your turning point benchmark.',
    },
    {
      id: 'lr-relocate-btn',
      stepNumber: 2,
      totalSteps: 4,
      title: '2. Relocate Laser Forward',
      shortTitle: 'Move Laser',
      icon: Flag,
      targetSelector: '[data-tutorial="move-laser-btn"]',
      content:
        'Pick up your tripod, move 50 feet forward down the line, and level it. Now place your rod back on Station 50. Because the tripod is at a different ground elevation, the detector will read a new number. Click "Move Laser" in the checklist toolbar.',
      actionHint: 'Click "Move Laser" in the toolbar, or tap Next Step.',
      proTip:
        'Never change your rod detector clamp setting when performing a turning point relocation shot.',
    },
    {
      id: 'lr-enter-reading',
      stepNumber: 3,
      totalSteps: 4,
      title: '3. Enter New Laser Reading',
      shortTitle: 'Datum Shift',
      icon: Sparkles,
      targetSelector: '[data-tutorial="tp-new-reading-input"]',
      content:
        'Suppose your new laser setup reads 7.50" (7-1/2") on Station 50 instead of 5.50". The app calculates a datum shift of +2.00".',
      actionHint: 'Enter 7.50 (or 7 1/2) in the new reading field and click "Apply Laser Relocation".',
      proTip:
        'The app takes care of the math: it shifts previously recorded ties so your active laser matches your survey seamlessly.',
    },
    {
      id: 'lr-continuity-banner',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Seamless Datum Continuity',
      shortTitle: 'Zero-Error Continuity',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="tp-active-banner"]',
      content:
        'Look at the purple banner! The app automatically converted all previously recorded stations to match your new active laser scale. All physical elevations, target grades, and lifts remain 100% accurate with zero cumulative error!',
      actionHint: 'Tap Finish Tutorial to return to your workspace.',
      proTip:
        'You can move the laser as many times as needed across hundreds of feet of track. Station 0\'s true elevation datum is never lost.',
    },
  ],
};

export const ALL_TUTORIALS: TutorialDefinition[] = [
  TUTORIAL_GETTING_STARTED,
  TUTORIAL_LOCKED_POINTS,
  TUTORIAL_EVALUATE_GRADE,
  TUTORIAL_LASER_RELOCATION,
];

export function getTutorialById(id: string): TutorialDefinition | undefined {
  return ALL_TUTORIALS.find((t) => t.id === id);
}

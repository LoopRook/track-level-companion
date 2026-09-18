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
  requiresAction?: boolean;
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
      actionHint: 'Tap the cell to enter 5.25" with your keyboard/numpad or touch keys.',
      requiresAction: true,
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
      actionHint: 'Enter 5.625" (5-5/8") and press Enter or tap "Save".',
      requiresAction: true,
      proTip:
        'Surveying rule: A LARGER rod reading (5.625" vs 5.25") means the detector slid lower—the rail head is physically dipped!',
    },
    {
      id: 'tolerance-margin',
      stepNumber: 3,
      totalSteps: 7,
      title: '3. The Tolerance Window (±0.05")',
      shortTitle: 'Tolerance Window',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="station-row-10"]',
      content:
        'Notice Station 10: The laser rod read 5.28"—which is 0.03" higher than your 5.25" target—yet its badge is green (ON GRADE ✓)! In track maintenance, shimming tiny fractions of a 16th inch wastes crew time. The app applies a customizable tolerance window (±0.05" or ~1/16") where the rail is smooth enough for safe train operations without needing jacks or shims.',
      actionHint: 'Station 10 is within ±0.05" of target, so it\'s marked ON GRADE. Tap Next Step.',
      requiresAction: false,
      proTip:
        'You can customize your railroad\'s tolerance threshold (e.g., ±1/16" or ±1/8") in Settings anytime.',
    },
    {
      id: 'profile-graph',
      stepNumber: 4,
      totalSteps: 7,
      title: '4. Profile Graph: Spotting Rail Sags',
      shortTitle: 'Profile Graph',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="profile-chart"]',
      content:
        'The Profile Graph shows a side view (elevation cross-section) of your rail line. The green dashed line represents your ideal, flat target grade. Notice how the solid rail line sags visibly between 0 ft and 10 ft (dipping at Station 5). This visualizes a physical dip in the ballast where rainwater puddles and rail cars rock.',
      actionHint: 'See how the rail line dips below the green target grade at Station 5? Tap Next Step.',
      requiresAction: false,
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
      requiresAction: true,
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
      actionHint: 'Tap the circle checkbox on Station 5 to mark it complete.',
      requiresAction: true,
      proTip:
        'Checking off completed ties keeps your track crew in sync so no one loses track of which ties are finished.',
    },
    {
      id: 'export-share',
      stepNumber: 7,
      totalSteps: 7,
      title: '7. Exporting, Printing & QR Sharing',
      shortTitle: 'Share & Export',
      icon: Share2,
      targetSelector: '[data-tutorial="header-actions"]',
      content:
        'Tap Files (or the bottom Tools menu on mobile) to download a CSV spreadsheet, print a track profile report, or beam the project to another phone using an offline QR code—no cell service needed!',
      actionHint: 'Tap Files or Tools to open data options and complete the tutorial, or tap Finish Tutorial.',
      requiresAction: false,
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
      title: '1. The Fixed Obstacle Problem',
      shortTitle: 'Fixed Obstacle',
      icon: Sparkles,
      targetSelector: '[data-tutorial="station-row-20"]',
      content:
        'Imagine Station 20 crosses over a fixed concrete bridge deck or large tree root that cannot be dug into or cut. Notice Station 20 shows an amber badge (LOWER -0.80"). Standard straight-line grade calculation tries to force the rail down through the solid obstacle—which is impossible on the job!',
      actionHint: 'Notice Station 20 is asking for an impossible -0.80" lower through solid ground. Tap Next Step.',
      requiresAction: false,
      proTip:
        'In live steam and grand-scale railroading, you cannot lower a solid bridge deck; you must lift the surrounding track up to meet it.',
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
        'Click the Padlock icon on Station 20. This designates it as an immovable control point (ROOT / PIVOT) that cannot be lowered.',
      actionHint: 'Click the Padlock icon on Station 20 to lock it as a fixed anchor.',
      requiresAction: true,
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
        'Look at the Profile Chart! By locking Station 20, the app automatically pivots the target grade line over the obstacle. Instead of lowering through the solid bridge tie, the app recalculates the grade so the track slopes smoothly up to Station 20 and back down, without any rail lowering.',
      actionHint: 'The grade line now pivots over the fixed obstacle at Station 20. Tap Next Step.',
      requiresAction: false,
      proTip:
        'Locking points creates smooth grade transitions (vertical curves) while eliminating impossible rail lowering.',
    },
    {
      id: 'lp-review-lifts',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Review the Lift Plan',
      shortTitle: 'Lift Plan',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="table-toolbar"]',
      content:
        'Look at Stations 10 and 30 in the checklist table: both now show gentle +0.40" ballast lifts (LIFT +0.40"). Your track crew only needs to jack and tamp ballast on the approach ties to create a smooth, rideable ramp over the root with zero digging!',
      actionHint: 'Stations 10 and 30 now show +0.40" lifts over the obstacle. Tap Finish Tutorial.',
      requiresAction: false,
      proTip:
        'You never need to edit ties manually after locking—the app automatically computes the exact ballast lift for each tie.',
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
      actionHint: 'Click "Evaluate Grade" on the graph toolbar.',
      requiresAction: true,
      proTip:
        'Evaluate Grade lets you measure pitch, span, and total rise between any subset of ties without altering your project settings.',
    },
    {
      id: 'eg-choose-stations',
      stepNumber: 2,
      totalSteps: 4,
      title: '2. Isolating a Track Span',
      shortTitle: 'Select Span',
      icon: Compass,
      targetSelector: '[data-tutorial="evaluate-grade-from"]',
      content:
        'Tracks often have localized slope changes—such as a steep bridge approach, a grade crossing, or a switch lead. The "From" and "To" buttons let you pick any two stations on your line to isolate and measure just that specific section of track.',
      actionHint: 'Tap "From" or "To" to pick stations, or tap Next Step to see the measurement readout.',
      requiresAction: false,
      proTip:
        'Measuring 20 to 50-foot segments reveals localized grade spikes that could cause train stalls or coupler breaks.',
    },
    {
      id: 'eg-inspect-readout',
      stepNumber: 3,
      totalSteps: 4,
      title: '3. Real-Time Slope Readout',
      shortTitle: 'Inspect Readout',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="evaluate-grade-readout"]',
      content:
        'Look at the real-time readout: it displays the exact distance Span (85 ft), physical Rise/Fall (+2.86"), and computed slope (+0.28% grade ↗). This reveals the true gradient of that track segment.',
      actionHint: 'Review the distance, elevation rise, and slope percentage, then tap Next Step.',
      requiresAction: false,
      proTip:
        'The app also displays the Best-Fit regression slope if intermediate stations deviate from a straight chord.',
    },
    {
      id: 'eg-apply-target',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Adopt Slope as Project Target',
      shortTitle: 'Apply Slope',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="evaluate-grade-apply"]',
      content:
        'If you want your entire track realignment target to adopt this measured slope, click "Apply as Target". This instantly sets your project\'s target slope without manual arithmetic!',
      actionHint: 'Tap "Apply as Target" to adopt this slope, or tap Finish Tutorial to complete.',
      requiresAction: false,
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
      title: '1. The Shared Turning Point (Station 50)',
      shortTitle: 'Turning Point Tie',
      icon: Flag,
      targetSelector: '[data-tutorial="station-row-50"]',
      content:
        'When track curves around trees or extends beyond laser range, you must move your tripod forward. To keep all elevations accurate without restarting from zero, pick a solid, already surveyed tie—Station 50—as your "Turning Point". Keep your grade rod planted on Station 50 while you pick up the laser tripod and move it down the line.',
      actionHint: 'Station 50 is our shared Turning Point tie. Review it, then tap Next Step.',
      requiresAction: false,
      proTip:
        'A Turning Point is simply a physical tie shot from both laser positions so the app knows the height difference between the two setups.',
    },
    {
      id: 'lr-relocate-btn',
      stepNumber: 2,
      totalSteps: 4,
      title: '2. Open Laser Relocation Tool',
      shortTitle: 'Move Laser',
      icon: Flag,
      targetSelector: '[data-tutorial="move-laser-btn"]',
      content:
        'After moving your tripod forward to Position 2 and leveling it, your laser sits at a different physical height. To connect the new setup to your survey, click "Move Laser" (or "[ ⚐ Laser ]" in the mobile bottom bar).',
      actionHint: 'Click "Move Laser" (or "[ ⚐ Laser ]" on mobile) to open the relocation tool.',
      requiresAction: true,
      proTip:
        'Crucial rule: Never move the detector clamp on your rod when relocating the laser—keep it at the exact same rod height!',
    },
    {
      id: 'lr-enter-reading',
      stepNumber: 3,
      totalSteps: 4,
      title: '3. Record New Reading at Station 50',
      shortTitle: 'Datum Shift',
      icon: Sparkles,
      targetSelector: '[data-tutorial="tp-new-reading-input"]',
      content:
        'With your rod still on Station 50, shoot the new laser beam. On Setup 1 it read 5.50", but from Setup 2 it reads 7.50". Tap the quick preset "[ 7.50" (Tutorial) ]" or type 7.50 into the box. The app detects a +2.00" shift between tripod heights.',
      actionHint: 'Tap the preset chip "[ 7.50" (Tutorial) ]" or type 7.50, then click "Apply Laser Relocation".',
      requiresAction: true,
      proTip:
        'The app shifts previously recorded ties so your active laser matches your survey seamlessly with zero manual arithmetic.',
    },
    {
      id: 'lr-continuity-banner',
      stepNumber: 4,
      totalSteps: 4,
      title: '4. Seamless Datum Shift Applied',
      shortTitle: 'Zero-Error Continuity',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="tp-active-banner"]',
      content:
        'Look at the purple banner! The app automatically adjusted all previous stations (0 to 50 ft) by +2.00" to match your new laser height. Station 50 now reads 7.50", and all your lifts, lowers, and elevations remain 100% continuous with zero math errors!',
      actionHint: 'Review the purple relocation banner and updated readings, then tap Finish Tutorial.',
      requiresAction: false,
      proTip:
        'You can move the laser as many times as needed across miles of track. Station 0\'s true elevation datum is never lost.',
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

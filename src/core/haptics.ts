/**
 * Refined Keypad Haptic Feedback Engine for Track Level Companion.
 *
 * Design Guidelines (Apple HIG & Material Design 3):
 * - Haptics should be used purposefully and sparingly. Apple HIG explicitly reserves
 *   haptics for virtual keypads/keyboards where physical mechanical dome switches are absent,
 *   and advises against haptics for standard buttons, list items, or checkboxes.
 * - On the web, the W3C Vibration API (navigator.vibrate) lacks amplitude/intensity control;
 *   the motor fires at 100% full power for the duration in milliseconds.
 * - Standard web pulses of 15–50ms, or multi-pulse sequences (e.g. [10, 30, 12]), hit the
 *   chassis with full acceleration and feel sharply metallic and buzzing.
 * - Ultra-soft single micro-pulses (4ms–6ms) allow Linear Resonant Actuators (LRAs) to just
 *   initiate movement before shutting off, producing a gentle, muffled mechanical "tick"
 *   without harshness, sharpness, or lingering frame vibration.
 * - Non-keypad UI elements (checkboxes, table rows, cards) remain silent and clean.
 * - Browser support: Native on Android (Chrome, Firefox, Edge, Opera, Samsung Internet).
 *   Safely degrades to a no-op on platforms that do not expose the W3C Vibration API (such as iOS Safari).
 */

export const HAPTIC_STORAGE_KEY = 'tlc_haptic_feedback';

export type HapticType = 'selection' | 'light' | 'nudge' | 'success' | 'warning';

export const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  // Ultra-soft 5ms mechanical tick for typing digits, decimal point, fractions, or inches
  selection: 5,
  // Whisper-light 4ms micro-pulse for +/- nudges
  light: 4,
  // 4ms micro-pulse for fine adjustments
  nudge: 4,
  // Single gentle 6ms confirmation tick for station advance (Save & Next)
  success: 6,
  // Soft 10ms tick for clear or reset
  warning: 10,
};

/**
 * Checks whether the current environment supports the W3C Vibration API.
 */
export function isVibrationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}

/**
 * Gets the user's haptic feedback preference from localStorage.
 * Defaults to true (enabled).
 */
export function getHapticPreference(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true;
    const saved = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (saved === null) return true; // Default ON
    return saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Persists the user's haptic feedback preference to localStorage.
 */
export function setHapticPreference(enabled: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save haptic feedback preference', err);
  }
}

/**
 * Triggers a refined haptic pulse if haptics are enabled and supported.
 *
 * @param type The type of haptic sensation to trigger ('selection', 'light', 'nudge', 'success', 'warning').
 *             Defaults to 'selection'.
 * @param force If true, bypasses the localStorage check (useful for "Test" buttons in Settings).
 * @returns boolean indicating whether vibration was successfully initiated.
 */
export function triggerHaptic(type: HapticType = 'selection', force = false): boolean {
  if (!force && !getHapticPreference()) {
    return false;
  }

  if (!isVibrationSupported()) {
    return false;
  }

  try {
    const pattern = HAPTIC_PATTERNS[type] ?? 10;
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

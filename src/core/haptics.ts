/**
 * Refined Haptic Feedback Engine for Track Level Companion.
 *
 * Design Guidelines:
 * - Modern smartphones utilize Linear Resonant Actuators (LRAs) or Taptic Engines.
 * - Traditional web vibrations of 35-100ms feel like a harsh, rattling buzzer that shakes the chassis.
 * - Refined micro-pulses between 8ms and 15ms produce a sharp, physical "click" or "tick"
 *   similar to mechanical micro-switches or native iOS/Android impact generators.
 * - Success patterns use a crisp double-pulse (e.g. [10ms, 30ms, 12ms]) to signify completion
 *   without prolonged vibration.
 * - Browser support: Native on Android (Chrome, Firefox, Edge, Opera, Samsung Internet).
 *   Safely degrades to a no-op on platforms that do not expose the W3C Vibration API (such as iOS Safari).
 */

export const HAPTIC_STORAGE_KEY = 'tlc_haptic_feedback';

export type HapticType = 'selection' | 'light' | 'nudge' | 'success' | 'warning';

export const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  // Ultra-crisp 10ms tick for typing digits, selecting fractions, or switching items
  selection: 10,
  // Gentle 8ms micro-pulse for +/- nudges and navigation
  light: 8,
  // 8ms micro-pulse for fine adjustments
  nudge: 8,
  // Refined double-tap [10ms pulse, 30ms pause, 12ms pulse] for station save & tie completion
  success: [10, 30, 12],
  // Dual-pulse [15ms pulse, 35ms pause, 15ms pulse] for clear, delete, or datum moves
  warning: [15, 35, 15],
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

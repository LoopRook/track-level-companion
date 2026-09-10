import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  HAPTIC_STORAGE_KEY,
  HAPTIC_PATTERNS,
  getHapticPreference,
  setHapticPreference,
  isVibrationSupported,
  triggerHaptic,
} from './haptics';

describe('Haptics Module', () => {
  const originalNavigator = global.navigator;
  const originalLocalStorage = global.localStorage;
  let mockStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => mockStore[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStore[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      mockStore = {};
    },
  };

  beforeEach(() => {
    mockStore = {};
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('Preferences', () => {
    it('defaults to true when localStorage has no entry', () => {
      expect(getHapticPreference()).toBe(true);
    });

    it('returns false when explicitly disabled in localStorage', () => {
      mockLocalStorage.setItem(HAPTIC_STORAGE_KEY, 'false');
      expect(getHapticPreference()).toBe(false);
    });

    it('returns true when explicitly enabled in localStorage', () => {
      mockLocalStorage.setItem(HAPTIC_STORAGE_KEY, 'true');
      expect(getHapticPreference()).toBe(true);
    });

    it('persists changes via setHapticPreference', () => {
      setHapticPreference(false);
      expect(mockLocalStorage.getItem(HAPTIC_STORAGE_KEY)).toBe('false');
      expect(getHapticPreference()).toBe(false);

      setHapticPreference(true);
      expect(mockLocalStorage.getItem(HAPTIC_STORAGE_KEY)).toBe('true');
      expect(getHapticPreference()).toBe(true);
    });

    it('handles missing localStorage gracefully', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(getHapticPreference()).toBe(true);
      expect(() => setHapticPreference(false)).not.toThrow();
    });
  });

  describe('Vibration Support Detection', () => {
    it('detects when navigator.vibrate is available', () => {
      const mockVibrate = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      expect(isVibrationSupported()).toBe(true);
    });

    it('detects when navigator.vibrate is missing', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(isVibrationSupported()).toBe(false);
    });
  });

  describe('triggerHaptic', () => {
    it('triggers the refined pattern when enabled and supported', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      // Default is 'selection' (5ms)
      expect(HAPTIC_PATTERNS.selection).toBe(5);
      const res = triggerHaptic('selection');
      expect(res).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(5);

      // 'success' pattern (single gentle 6ms tick)
      expect(HAPTIC_PATTERNS.success).toBe(6);
      triggerHaptic('success');
      expect(mockVibrate).toHaveBeenCalledWith(6);

      // 'light' pattern 4ms
      expect(HAPTIC_PATTERNS.light).toBe(4);
      triggerHaptic('light');
      expect(mockVibrate).toHaveBeenCalledWith(4);

      // 'warning' pattern 10ms
      expect(HAPTIC_PATTERNS.warning).toBe(10);
      triggerHaptic('warning');
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('does not trigger vibration when haptics are disabled', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      setHapticPreference(false);
      const res = triggerHaptic('selection');

      expect(res).toBe(false);
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('bypasses preference check when force is true', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      setHapticPreference(false);
      const res = triggerHaptic('selection', true);

      expect(res).toBe(true);
      expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.selection);
    });

    it('gracefully handles missing vibrate method without throwing', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      expect(() => triggerHaptic('selection')).not.toThrow();
      expect(triggerHaptic('selection')).toBe(false);
    });

    it('gracefully catches exceptions thrown by navigator.vibrate', () => {
      const mockVibrate = vi.fn().mockImplementation(() => {
        throw new Error('Permission denied');
      });
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      expect(() => triggerHaptic('selection')).not.toThrow();
      expect(triggerHaptic('selection')).toBe(false);
    });
  });
});

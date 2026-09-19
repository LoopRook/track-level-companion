import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  hasWaitingAppUpdate,
  applyAppUpdate,
  triggerAppUpdateCheck,
} from './UpdatePrompt';
import { APP_VERSION, APP_VERSION_LABEL } from '../core/version';

describe('App Update and Versioning Engine', () => {
  const originalNavigator = globalThis.navigator;
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    vi.restoreAllMocks();
    const eventListeners: Record<string, Function[]> = {};
    (globalThis as any).window = {
      addEventListener: vi.fn((event: string, cb: Function) => {
        eventListeners[event] = eventListeners[event] || [];
        eventListeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: Function) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter(fn => fn !== cb);
        }
      }),
      dispatchEvent: vi.fn((event: any) => {
        const type = event.type || event;
        if (eventListeners[type]) {
          eventListeners[type].forEach(fn => fn(event));
        }
        return true;
      }),
      location: { reload: vi.fn() },
    };
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    (globalThis as any).window = originalWindow;
  });

  it('reports correct SemVer 0.16.0', () => {
    expect(APP_VERSION).toBe('0.16.0');
    expect(APP_VERSION_LABEL).toBe('v0.16.0 Beta');
  });

  it('detects offline state during update check', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          getRegistration: vi.fn(),
        },
        onLine: false,
      },
      configurable: true,
      writable: true,
    });

    const res = await triggerAppUpdateCheck();
    expect(res).toBe('offline');
  });

  it('detects waiting service worker update when present', async () => {
    const mockPostMessage = vi.fn();
    const mockRegistration = {
      waiting: {
        postMessage: mockPostMessage,
      },
      update: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(mockRegistration),
          addEventListener: vi.fn(),
        },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    const hasWaiting = await hasWaitingAppUpdate();
    expect(hasWaiting).toBe(true);

    let eventFired = false;
    const handleUpdate = () => {
      eventFired = true;
    };
    window.addEventListener('tlc-update-available', handleUpdate);

    const checkRes = await triggerAppUpdateCheck();
    expect(checkRes).toBe('update_found');
    expect(eventFired).toBe(true);

    window.removeEventListener('tlc-update-available', handleUpdate);
  });

  it('triggers SKIP_WAITING on waiting worker during applyAppUpdate', async () => {
    const mockPostMessage = vi.fn();
    const mockRegistration = {
      waiting: {
        postMessage: mockPostMessage,
      },
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(mockRegistration),
          addEventListener: vi.fn(),
        },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    await applyAppUpdate();
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('returns up_to_date when no waiting or installing worker is found', async () => {
    const mockRegistration = {
      waiting: null,
      installing: null,
      update: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        serviceWorker: {
          getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        },
        onLine: true,
      },
      configurable: true,
      writable: true,
    });

    const checkRes = await triggerAppUpdateCheck();
    expect(checkRes).toBe('up_to_date');
  });
});

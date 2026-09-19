import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { PrototypeStyle } from '../core/types';

let globalSWRegistration: ServiceWorkerRegistration | null = null;
let globalUpdateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
let globalSetNeedRefresh: ((val: boolean) => void) | null = null;

/**
 * Checks whether an installed service worker update is currently waiting to activate.
 */
export const hasWaitingAppUpdate = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = globalSWRegistration || (await navigator.serviceWorker?.getRegistration());
    return Boolean(reg?.waiting);
  } catch {
    return false;
  }
};

/**
 * Activates any waiting service worker and reloads the application.
 */
export const applyAppUpdate = async (): Promise<void> => {
  try {
    if (globalUpdateServiceWorker) {
      await globalUpdateServiceWorker(true);
      return;
    }
    const reg = globalSWRegistration || (await navigator.serviceWorker?.getRegistration());
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.location.reload();
        },
        { once: true }
      );
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }
    window.location.reload();
  } catch (err) {
    console.error('Failed to apply app update:', err);
    window.location.reload();
  }
};

/**
 * Triggers an immediate network check for service worker updates.
 * Bypasses timer throttling and HTTP caches when invoked.
 * If an update was previously found/waiting and dismissed, re-opens the update prompt.
 */
export const triggerAppUpdateCheck = async (): Promise<'update_found' | 'up_to_date' | 'offline' | 'error'> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'up_to_date';
  }

  try {
    const reg = globalSWRegistration || (await navigator.serviceWorker?.getRegistration());
    if (!reg) return 'up_to_date';
    
    // 1. If an update was already downloaded and is waiting, re-notify and return 'update_found'
    if (reg.waiting) {
      globalSetNeedRefresh?.(true);
      window.dispatchEvent(new CustomEvent('tlc-update-available'));
      return 'update_found';
    }

    await reg.update();
    if (reg.waiting || reg.installing) {
      globalSetNeedRefresh?.(true);
      window.dispatchEvent(new CustomEvent('tlc-update-available'));
      return 'update_found';
    }
    return 'up_to_date';
  } catch (err) {
    console.error('App update check error:', err);
    return 'error';
  }
};

interface UpdatePromptProps {
  prototypeStyle?: PrototypeStyle;
  isDarkMode?: boolean;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  prototypeStyle = 'nothing',
  isDarkMode = true,
}) => {
  const dismissedRef = React.useRef(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        globalSWRegistration = r;

        // 1. Check immediately on startup
        r.update().catch(() => {});

        // 2. Check whenever user returns to the tab/PWA or screen unlocks
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            r.update().catch(() => {});
          }
        };

        const handleOnline = () => {
          r.update().catch(() => {});
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        // 3. Periodic poll every 2 minutes while active
        const intervalId = setInterval(() => {
          if (navigator.onLine) {
            r.update().catch(() => {});
          }
        }, 2 * 60 * 1000);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('focus', handleVisibilityChange);
          window.removeEventListener('online', handleOnline);
          clearInterval(intervalId);
        };
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  React.useEffect(() => {
    globalUpdateServiceWorker = updateServiceWorker;
    globalSetNeedRefresh = (val: boolean) => {
      dismissedRef.current = !val;
      setNeedRefresh(val);
    };

    const handleUpdateAvailable = () => {
      dismissedRef.current = false;
      setNeedRefresh(true);
    };
    window.addEventListener('tlc-update-available', handleUpdateAvailable);

    // Check if an update is already waiting upon mount
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => {
        if (r) globalSWRegistration = r;
        if (r?.waiting && !dismissedRef.current) {
          setNeedRefresh(true);
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('tlc-update-available', handleUpdateAvailable);
    };
  }, [updateServiceWorker, setNeedRefresh]);

  const handleDismiss = () => {
    dismissedRef.current = true;
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  const isNothing = prototypeStyle === 'nothing';

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={
          isNothing
            ? `p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transition-colors ${
                isDarkMode
                  ? 'bg-black text-white border-zinc-800 font-["Space_Grotesk"]'
                  : 'bg-[#F2F2F2] text-zinc-900 border-zinc-300 font-["Space_Grotesk"]'
              }`
            : 'bg-zinc-900 dark:bg-zinc-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-start gap-3'
        }
      >
        <div
          className={
            isNothing
              ? `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isDarkMode
                    ? 'border border-zinc-700 bg-zinc-900 text-[#D71921]'
                    : 'border border-zinc-300 bg-white text-[#D71921]'
                }`
              : 'w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5'
          }
        >
          <RefreshCw className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm flex items-center gap-1.5">
            {isNothing && <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0" />}
            <span className={isNothing ? 'font-["Space_Mono"] uppercase tracking-wider' : 'text-zinc-100'}>
              {isNothing ? '[ App Update Available ]' : 'App Update Available'}
            </span>
          </h4>
          <p
            className={
              isNothing
                ? `text-[11px] mt-1 leading-snug ${
                    isDarkMode
                      ? 'text-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
                      : 'text-zinc-600 font-["Space_Mono"] uppercase tracking-wider'
                  }`
                : 'text-xs text-zinc-400 mt-0.5 leading-relaxed'
            }
          >
            A new version is ready. You can update now or finish your active survey undisturbed.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className={
                isNothing
                  ? 'px-3.5 py-1.5 bg-[#D71921] hover:bg-[#b5141b] text-white text-[11px] font-bold font-["Space_Mono"] uppercase tracking-wider rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm'
                  : 'px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer'
              }
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isNothing ? '[ Update Now ]' : 'Update Now'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className={
                isNothing
                  ? `px-3 py-1.5 border text-[11px] font-bold font-["Space_Mono"] uppercase tracking-wider rounded-lg transition cursor-pointer ${
                      isDarkMode
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-zinc-500'
                    }`
                  : 'px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer'
              }
            >
              {isNothing ? '[ Later ]' : 'Later'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className={
            isNothing
              ? `px-2 py-1 rounded-lg border text-[10px] font-bold font-["Space_Mono"] uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  isDarkMode
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:text-black'
                }`
              : 'text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition cursor-pointer'
          }
          aria-label="Dismiss update notification"
        >
          {isNothing ? '[ Close ]' : <X className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

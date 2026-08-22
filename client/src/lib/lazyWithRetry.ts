/**
 * Production route resilience: recover once when a browser holds an outdated
 * hashed page chunk after a deployment, then allow the refreshed build to load.
 */
import { lazy, type ComponentType } from "react";

const STALE_BUILD_RELOAD_KEY = "magnetic-source:stale-build-reload";
const staleAssetPattern = /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk \d+ failed|unable to preload css/i;

export function isStaleAssetError(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return staleAssetPattern.test(message);
}

export function reloadForStaleAssets() {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(STALE_BUILD_RELOAD_KEY)) return false;
    window.sessionStorage.setItem(STALE_BUILD_RELOAD_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearStaleAssetRecoveryFlag() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STALE_BUILD_RELOAD_KEY);
  } catch {
    // Storage access is optional; a normal lazy-load success still completes.
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await factory();
      clearStaleAssetRecoveryFlag();
      return module;
    } catch (error) {
      if (isStaleAssetError(error) && reloadForStaleAssets()) {
        return new Promise<never>(() => undefined);
      }
      throw error;
    }
  });
}

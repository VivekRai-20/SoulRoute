/**
 * hooks/useAppIcons.ts
 *
 * Efficiently manages app icon fetching and caching.
 * Icons are fetched once from native as Base64 strings and stored in memory.
 */

import { useState, useCallback, useRef } from 'react';
import { getAppLogo } from '@/services/deviceStats';

// Global cache to persist icons across screen transitions in the current session
const iconCache: Record<string, string> = {};
// Store promises for in-flight requests to avoid redundant bridge calls
const pendingRequests: Record<string, Promise<string | null>> = {};

export function useAppIcons() {
  const [, forceUpdate] = useState({});

  const getIcon = useCallback(async (packageName: string): Promise<string | null> => {
    // 1. Check cache
    if (iconCache[packageName]) {
      return iconCache[packageName];
    }

    // 2. Check for in-flight request
    if (packageName in pendingRequests) {
      return pendingRequests[packageName];
    }

    // 3. Fetch from native
    const fetchJob = (async () => {
      try {
        const base64 = await getAppLogo(packageName);
        if (base64) {
          iconCache[packageName] = base64;
          return base64;
        }
        return null;
      } catch (e) {
        console.warn(`[useAppIcons] Failed to fetch icon for ${packageName}:`, e);
        return null;
      } finally {
        delete pendingRequests[packageName];
      }
    })();

    pendingRequests[packageName] = fetchJob;
    const result = await fetchJob;
    
    // Trigger re-render if we found a new icon
    if (result) forceUpdate({});
    
    return result;
  }, []);

  return {
    getIcon,
    getCachedIcon: (pkg: string) => iconCache[pkg] || null,
  };
}

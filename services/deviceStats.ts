/**
 * services/deviceStats.ts
 *
 * Typed wrapper over the DigitalWellbeing NativeModule.
 * All functions fall back gracefully when the module is unavailable
 * (e.g., running in Expo Go) so the app never crashes.
 */

import { NativeModules, Platform } from 'react-native';

const { DigitalWellbeing } = NativeModules;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawAppStat {
  packageName: string;
  appName: string;
  totalTimeInForeground: number; // milliseconds
}

export interface RawNotifStat {
  packageName: string;
  appName: string;
  count: number;
}

export interface WeeklyTrendData {
  date: string;
  screenTimeMs: number;
  unlockCount: number;
}

export interface WeeklyNotifData {
  date: string;
  count: number;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function isAndroid() {
  return Platform.OS === 'android';
}

function isModuleAvailable() {
  return isAndroid() && !!DigitalWellbeing;
}

// ─── Permission checks ────────────────────────────────────────────────────────

/**
 * Returns true if the user has granted PACKAGE_USAGE_STATS access.
 * This is a special permission that cannot be granted via runtime dialog —
 * the user must navigate to Settings > Apps > Special App Access > Usage Access.
 */
export async function hasUsagePermission(): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  try {
    return await DigitalWellbeing.hasUsagePermission();
  } catch {
    return false;
  }
}

/**
 * Returns true if SoulRouteNotificationService is enabled in
 * Settings > Apps > Special App Access > Notification Access.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  try {
    return await DigitalWellbeing.hasNotificationPermission();
  } catch {
    return false;
  }
}

// ─── Permission openers ───────────────────────────────────────────────────────

/**
 * Opens the Usage Access settings page.
 */
export function openUsageAccessSettings(): void {
  if (!isModuleAvailable()) return;
  DigitalWellbeing.openUsageAccessSettings();
}

/**
 * Opens Notification Listener settings page.
 */
export function openNotificationListenerSettings(): void {
  if (!isModuleAvailable()) return;
  DigitalWellbeing.openNotificationListenerSettings();
}

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Returns the total foreground screen time for today (midnight → now) in ms.
 */
export async function getTotalScreenTime(): Promise<number> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  return await DigitalWellbeing.getTotalScreenTime();
}

/**
 * Returns per-app usage stats for today, sorted by most used first.
 * Each entry includes packageName, appName (resolved), and totalTimeInForeground (ms).
 */
export async function getAppUsageStats(): Promise<RawAppStat[]> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  const raw: RawAppStat[] = await DigitalWellbeing.getUsageStats();
  return raw.sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);
}

/**
 * Returns the number of device unlocks (KEYGUARD_HIDDEN events) today.
 */
export async function getDeviceUnlocks(): Promise<number> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  return await DigitalWellbeing.getDeviceUnlockCount();
}

/**
 * Returns total screen time used between 22:00 and 06:00 last night (ms).
 */
export async function getNightUsage(): Promise<number> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  return await DigitalWellbeing.getNightUsage();
}

/**
 * Returns a real per-hour breakdown of user apps usage from 10 PM to 6 AM.
 */
export async function getNightUsageHourly(): Promise<{ hour: string; minutes: number }[]> {
  if (!isModuleAvailable()) return [];
  try {
    return await DigitalWellbeing.getNightUsageHourly();
  } catch {
    return [];
  }
}

/**
 * Returns the app's icon as a Base64 string.
 */
export async function getAppLogo(packageName: string): Promise<string> {
  if (!isModuleAvailable()) return '';
  try {
    return await DigitalWellbeing.getAppIcon(packageName);
  } catch (e) {
    return '';
  }
}

/**
 * Saves the list of packages to block during Focus sessions.
 */
export async function saveBlockedApps(packages: string[]): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  return await DigitalWellbeing.setBlockedApps(packages);
}

/**
 * Returns a list of all user-installed applications (package + name).
 */
export async function getAllApps(): Promise<{ packageName: string; appName: string }[]> {
  if (!isModuleAvailable()) return [];
  return await DigitalWellbeing.getAllApps();
}

/**
 * Starts the foreground blocking service.
 */
export async function startFocusBlocking(): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  return await DigitalWellbeing.startBlockingService();
}

/**
 * Stops the foreground blocking service.
 */
export async function stopFocusBlocking(): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  return await DigitalWellbeing.stopBlockingService();
}

/**
 * Returns notification counts per app since the listener service started.
 * Sorted by count descending.
 */
export async function getNotificationCounts(): Promise<RawNotifStat[]> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  const raw: RawNotifStat[] = await DigitalWellbeing.getNotificationCounts();
  return raw.sort((a, b) => b.count - a.count);
}

/**
 * Resets the notification counter. Call this at the start of each day.
 */
export async function clearNotificationCounts(): Promise<void> {
  if (!isModuleAvailable()) return;
  await DigitalWellbeing.clearNotificationCounts();
}

/**
 * Returns screen time and unlock counts for the last 7 days.
 */
export async function getWeeklyTrend(): Promise<WeeklyTrendData[]> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  return await DigitalWellbeing.getWeeklyTrend();
}

/**
 * Returns total notification counts for the last 7 days.
 */
export async function getWeeklyNotificationStats(): Promise<WeeklyNotifData[]> {
  if (!isModuleAvailable()) throw new Error('Module not available');
  return await DigitalWellbeing.getWeeklyNotificationStats();
}

/**
 * Returns true if the SoulRouteNotificationService is currently bound and active.
 */
export async function isNotificationServiceRunning(): Promise<boolean> {
  if (!isModuleAvailable()) return false;
  try {
    return await DigitalWellbeing.isNotificationServiceRunning();
  } catch {
    return false;
  }
}

/**
 * Returns true if the user has granted 'Display over other apps' permission.
 */
export async function getOverlayPermissionState(): Promise<boolean> {
  if (!isModuleAvailable()) return true;
  return await DigitalWellbeing.getOverlayPermissionState();
}

/**
 * Opens Android settings for 'Display over other apps'.
 */
export function openOverlaySettings(): void {
  if (!isModuleAvailable()) return;
  DigitalWellbeing.openOverlaySettings();
}

// ─── Expo Go guard ────────────────────────────────────────────────────────────

/**
 * Why Expo Go can't access this data:
 *
 * Expo Go is a pre-built app (com.expo.go) that sandboxes your JS bundle.
 * Because it doesn't include our native DigitalWellbeingModule or our
 * SoulRouteNotificationService, NativeModules.DigitalWellbeing will be
 * undefined at runtime.
 *
 * To run with real data, use a Development Build:
 *   npx expo run:android          -- one-time build + install on device
 *   npx expo start --dev-client   -- hot-reload against DevelopmentBuild
 *
 * Or for production / CI:
 *   eas build --platform android --profile preview
 */
export const EXPO_GO_WARNING =
  'Native device stats require a Development Build. ' +
  'Run: npx expo run:android';

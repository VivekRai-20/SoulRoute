package com.anonymous.mywellbeingapp;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DigitalWellbeingModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public DigitalWellbeingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "DigitalWellbeing";
    }

    // ─── Permission checks ────────────────────────────────────────────────────

    @ReactMethod
    public void hasUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager)
                    reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    reactContext.getPackageName());
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void hasNotificationPermission(Promise promise) {
        try {
            String enabledListeners = Settings.Secure.getString(
                    reactContext.getContentResolver(),
                    "enabled_notification_listeners");
            boolean granted = enabledListeners != null &&
                    enabledListeners.contains(reactContext.getPackageName());
            promise.resolve(granted);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    // ─── Settings openers ─────────────────────────────────────────────────────

    @ReactMethod
    public void openUsageAccessSettings() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void openNotificationListenerSettings() {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    // ─── Usage Stats ──────────────────────────────────────────────────────────

    @ReactMethod
    public void getUsageStats(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long endTime = System.currentTimeMillis();
            // Start of today (midnight)
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();

            List<UsageStats> usageStatsList = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, startTime, endTime);

            PackageManager pm = reactContext.getPackageManager();
            WritableArray resultArray = Arguments.createArray();

            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    if (stats.getTotalTimeInForeground() <= 0) continue;

                    WritableMap map = Arguments.createMap();
                    map.putString("packageName", stats.getPackageName());
                    map.putDouble("totalTimeInForeground",
                            (double) stats.getTotalTimeInForeground());

                    // Resolve human-readable app name
                    try {
                        ApplicationInfo ai = pm.getApplicationInfo(
                                stats.getPackageName(), PackageManager.GET_META_DATA);
                        String appName = (String) pm.getApplicationLabel(ai);
                        map.putString("appName", appName);
                    } catch (PackageManager.NameNotFoundException e) {
                        map.putString("appName", stats.getPackageName());
                    }

                    resultArray.pushMap(map);
                }
            }

            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("USAGE_STATS_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getTotalScreenTime(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long endTime = System.currentTimeMillis();
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();

            List<UsageStats> usageStatsList = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, startTime, endTime);

            double total = 0;
            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    total += stats.getTotalTimeInForeground();
                }
            }

            promise.resolve(total);
        } catch (Exception e) {
            promise.reject("SCREEN_TIME_ERROR", e.getMessage(), e);
        }
    }

    // ─── Unlock Count (via UsageEvents KEYGUARD_HIDDEN) ───────────────────────

    @ReactMethod
    public void getDeviceUnlockCount(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long endTime = System.currentTimeMillis();
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();

            UsageEvents events = usm.queryEvents(startTime, endTime);
            int unlockCount = 0;

            UsageEvents.Event event = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                // KEYGUARD_HIDDEN = user dismissed the lock screen (= an unlock)
                if (event.getEventType() == UsageEvents.Event.KEYGUARD_HIDDEN) {
                    unlockCount++;
                }
            }

            promise.resolve(unlockCount);
        } catch (Exception e) {
            promise.reject("UNLOCK_COUNT_ERROR", e.getMessage(), e);
        }
    }

    // ─── Night Usage (22:00 – 06:00) ─────────────────────────────────────────

    @ReactMethod
    public void getNightUsage(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            // Yesterday 22:00
            Calendar nightStart = Calendar.getInstance();
            nightStart.set(Calendar.HOUR_OF_DAY, 22);
            nightStart.set(Calendar.MINUTE, 0);
            nightStart.set(Calendar.SECOND, 0);
            nightStart.set(Calendar.MILLISECOND, 0);
            if (nightStart.getTimeInMillis() > System.currentTimeMillis()) {
                nightStart.add(Calendar.DAY_OF_YEAR, -1);
            }

            // Today 06:00
            Calendar nightEnd = Calendar.getInstance();
            nightEnd.set(Calendar.HOUR_OF_DAY, 6);
            nightEnd.set(Calendar.MINUTE, 0);
            nightEnd.set(Calendar.SECOND, 0);
            nightEnd.set(Calendar.MILLISECOND, 0);

            long startTime = nightStart.getTimeInMillis();
            long endTime = Math.min(nightEnd.getTimeInMillis(), System.currentTimeMillis());

            if (endTime <= startTime) {
                promise.resolve(0.0);
                return;
            }

            List<UsageStats> usageStatsList = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, startTime, endTime);

            double total = 0;
            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    total += stats.getTotalTimeInForeground();
                }
            }

            promise.resolve(total);
        } catch (Exception e) {
            promise.reject("NIGHT_USAGE_ERROR", e.getMessage(), e);
        }
    }

    // ─── Notification counts (from NotificationListenerService) ──────────────

    @ReactMethod
    public void getNotificationCounts(Promise promise) {
        try {
            Map<String, Integer> counts = SoulRouteNotificationService.getCounts();
            PackageManager pm = reactContext.getPackageManager();

            WritableArray resultArray = Arguments.createArray();
            for (Map.Entry<String, Integer> entry : counts.entrySet()) {
                WritableMap map = Arguments.createMap();
                map.putString("packageName", entry.getKey());
                map.putInt("count", entry.getValue());

                try {
                    ApplicationInfo ai = pm.getApplicationInfo(
                            entry.getKey(), PackageManager.GET_META_DATA);
                    map.putString("appName", (String) pm.getApplicationLabel(ai));
                } catch (PackageManager.NameNotFoundException e) {
                    map.putString("appName", entry.getKey());
                }

                resultArray.pushMap(map);
            }

            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("NOTIF_COUNT_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void clearNotificationCounts(Promise promise) {
        SoulRouteNotificationService.clearCounts();
        promise.resolve(true);
    }
}

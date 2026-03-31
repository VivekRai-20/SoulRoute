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

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.util.Base64;
import android.util.Log;
import android.app.ActivityManager;
import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.Set;
import com.facebook.react.bridge.ReadableArray;
import android.content.SharedPreferences;
import android.app.ActivityManager;

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

    /**
     * Determines if a package is a "User App" (usually one with a launcher icon).
     * This filters out system components, input methods, and some background processes
     * that inflate "Total Screen Time" calculations.
     */
    /**
     * Filter to match Android System Settings. 
     * Excludes launchers (Home Screen), keyboards, and core system UI.
     */
    private boolean isUserApp(String packageName) {
        if (packageName == null) return false;
        
        // Strictly exclude SoulRoute itself and core system packages that would break the phone
        if (packageName.equals(reactContext.getPackageName()) || 
            packageName.equals("android") || 
            packageName.equals("com.android.systemui")) {
            return false;
        }

        try {
            PackageManager pm = reactContext.getPackageManager();
            
            // Check if it has a launcher intent (truly a "user app" visible in drawer/home)
            // This is the best indicator of a blockable "App" vs a "System Service"
            if (pm.getLaunchIntentForPackage(packageName) == null) {
                return false;
            }

            // Exclude common input methods and launchers if detected by package name
            if (packageName.contains("inputmethod") || packageName.contains("launcher")) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
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
            String componentName = reactContext.getPackageName() + "/" + SoulRouteNotificationService.class.getName();
            boolean granted = enabledListeners != null && enabledListeners.contains(componentName);
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

    @ReactMethod
    public void openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        }
    }

    @ReactMethod
    public void getOverlayPermissionState(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext));
        } else {
            promise.resolve(true);
        }
    }

    // ─── Usage Stats ──────────────────────────────────────────────────────────

    /**
     * Returns app usage stats for today.
     * NOTE: UsageStatsManager.getTotalTimeInForeground() only increments
     * when the app is actually visible (Foreground). If multiple apps are
     * in the "background" (but open in recents), they do NOT record screen time.
     */
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

            Map<String, Long> aggregatedStats = getUsageStatsFromEvents(usm, startTime, endTime);

            PackageManager pm = reactContext.getPackageManager();
            WritableArray resultArray = Arguments.createArray();

            for (Map.Entry<String, Long> entry : aggregatedStats.entrySet()) {
                String pkg = entry.getKey();
                long totalTime = entry.getValue();

                WritableMap map = Arguments.createMap();
                map.putString("packageName", pkg);
                map.putDouble("totalTimeInForeground", (double) totalTime);

                try {
                    ApplicationInfo ai = pm.getApplicationInfo(pkg, PackageManager.GET_META_DATA);
                    String appName = (String) pm.getApplicationLabel(ai);
                    map.putString("appName", appName);
                } catch (PackageManager.NameNotFoundException e) {
                    map.putString("appName", pkg);
                }
                resultArray.pushMap(map);
            }

            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("USAGE_STATS_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getAllApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray resultArray = Arguments.createArray();

            for (ApplicationInfo app : apps) {
                // Check if it's a user app and has a launcher intent
                boolean result = isUserApp(app.packageName);
                if (result) {
                    WritableMap map = Arguments.createMap();
                    map.putString("packageName", app.packageName);
                    map.putString("appName", pm.getApplicationLabel(app).toString());
                    resultArray.pushMap(map);
                } else {
                    // android.util.Log.d("SoulRouteDebug", "Filtered out: " + app.packageName);
                }
            }
            android.util.Log.d("SoulRouteDebug", "Total apps found: " + resultArray.size());
            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("GET_ALL_APPS_ERROR", e.getMessage(), e);
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

            Map<String, Long> aggregatedStats = getUsageStatsFromEvents(usm, startTime, endTime);

            double total = 0;
            for (Long time : aggregatedStats.values()) {
                total += time;
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

            int unlockCount = countUnlocksInRange(usm, startTime, endTime);
            promise.resolve(unlockCount);
        } catch (Exception e) {
            promise.reject("UNLOCK_COUNT_ERROR", e.getMessage(), e);
        }
    }

    /**
     * More accurate screen time calculation using UsageEvents.
     * Prevents the midnight carryover bug seen with queryUsageStats(INTERVAL_DAILY).
     */
    private Map<String, Long> getUsageStatsFromEvents(UsageStatsManager usm, long start, long end) {
        Map<String, Long> statsMap = new HashMap<>();
        Map<String, Long> openTimeMap = new HashMap<>();
        
        UsageEvents events = usm.queryEvents(start, end);
        UsageEvents.Event event = new UsageEvents.Event();
        
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            
            // SECURITY: Only count events strictly within our requested range
            long time = event.getTimeStamp();
            if (time < start || time > end) continue;

            String pkg = event.getPackageName();
            if (!isUserApp(pkg)) continue;

            int type = event.getEventType();
            if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                openTimeMap.put(pkg, time);
            } else if (type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                if (openTimeMap.containsKey(pkg)) {
                    long startTime = openTimeMap.get(pkg);
                    long duration = time - startTime;
                    
                    // Cap duration to the query window for safety
                    if (duration > (end - start)) duration = (end - start);
                    if (duration < 0) duration = 0;

                    statsMap.put(pkg, statsMap.getOrDefault(pkg, 0L) + duration);
                    openTimeMap.remove(pkg);
                }
            }
        }

        // Handle apps still in foreground at query time
        for (Map.Entry<String, Long> entry : openTimeMap.entrySet()) {
            long duration = end - entry.getValue();
            if (duration > (end - start)) duration = (end - start);
            if (duration < 0) duration = 0;
            
            statsMap.put(entry.getKey(), statsMap.getOrDefault(entry.getKey(), 0L) + duration);
        }

        return statsMap;
    }

    /**
     * Counts KEYGUARD_HIDDEN events in a given time range.
     * Reused by both getDeviceUnlockCount (today) and getWeeklyTrend (per-day).
     */
    private int countUnlocksInRange(UsageStatsManager usm, long start, long end) {
        try {
            UsageEvents events = usm.queryEvents(start, end);
            int count = 0;
            UsageEvents.Event event = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.KEYGUARD_HIDDEN) {
                    count++;
                }
            }
            return count;
        } catch (Exception e) {
            android.util.Log.w("SoulRouteWellbeing", "countUnlocksInRange failed: " + e.getMessage());
            return 0;
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
                    if (isUserApp(stats.getPackageName())) {
                        total += stats.getTotalTimeInForeground();
                    }
                }
            }

            promise.resolve(total);
        } catch (Exception e) {
            promise.reject("NIGHT_USAGE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Returns a real per-hour breakdown of user apps usage from 10 PM to 6 AM.
     * Uses UsageEvents to ensure sub-day precision.
     */
    @ReactMethod
    public void getNightUsageHourly(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long now = System.currentTimeMillis();
            
            // Period: 10 PM yesterday to 6 AM today
            Calendar startCal = Calendar.getInstance();
            startCal.set(Calendar.HOUR_OF_DAY, 22);
            startCal.add(Calendar.DAY_OF_YEAR, -1);
            startCal.set(Calendar.MINUTE, 0);
            startCal.set(Calendar.SECOND, 0);
            startCal.set(Calendar.MILLISECOND, 0);

            Calendar endCal = Calendar.getInstance();
            endCal.set(Calendar.HOUR_OF_DAY, 6);
            endCal.set(Calendar.MINUTE, 0);
            endCal.set(Calendar.SECOND, 0);
            endCal.set(Calendar.MILLISECOND, 0);

            // Don't query into the future
            long queryEnd = Math.min(endCal.getTimeInMillis(), now);

            UsageEvents events = usm.queryEvents(startCal.getTimeInMillis(), queryEnd);
            
            // Hour index (0 = 10pm, 1 = 11pm ... 7 = 5am) -> MinutesUsed
            double[] hourlyMillis = new double[8];
            Map<String, Long> lastForegroundTime = new HashMap<>();

            UsageEvents.Event event = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                String pkg = event.getPackageName();
                if (!isUserApp(pkg)) continue;

                long timestamp = event.getTimeStamp();

                if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastForegroundTime.put(pkg, timestamp);
                } else if (event.getEventType() == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    if (lastForegroundTime.containsKey(pkg)) {
                        long start = lastForegroundTime.get(pkg);
                        distributeUsageIntoHours(start, timestamp, startCal.getTimeInMillis(), hourlyMillis);
                        lastForegroundTime.remove(pkg);
                    }
                }
            }

            // Close any still-open sessions
            for (Map.Entry<String, Long> entry : lastForegroundTime.entrySet()) {
                distributeUsageIntoHours(entry.getValue(), queryEnd, startCal.getTimeInMillis(), hourlyMillis);
            }

            WritableArray resultArray = Arguments.createArray();
            String[] labels = {"10pm", "11pm", "12am", "1am", "2am", "3am", "4am", "5am"};
            for (int i = 0; i < 8; i++) {
                WritableMap m = Arguments.createMap();
                m.putString("hour", labels[i]);
                m.putInt("minutes", (int) Math.round(hourlyMillis[i] / 60000.0));
                resultArray.pushMap(m);
            }

            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("NIGHT_HOURLY_ERROR", e.getMessage(), e);
        }
    }

    private void distributeUsageIntoHours(long start, long end, long startTimeOffset, double[] buckets) {
        long hourMs = 3600000;
        for (int i = 0; i < 8; i++) {
            long bucketStart = startTimeOffset + (i * hourMs);
            long bucketEnd = bucketStart + hourMs;

            long intersectStart = Math.max(start, bucketStart);
            long intersectEnd = Math.min(end, bucketEnd);

            if (intersectStart < intersectEnd) {
                buckets[i] += (intersectEnd - intersectStart);
            }
        }
    }

    // ─── Notification counts (from NotificationListenerService) ──────────────

    @ReactMethod
    public void getNotificationCounts(Promise promise) {
        try {
            Map<String, Integer> counts = SoulRouteNotificationService.getCounts(reactContext);
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

    /**
     * Uses Settings.Secure to check if our listener is enabled — survives process death.
     * Also falls back to the in-memory flag for extra accuracy.
     */
    @ReactMethod
    public void isNotificationServiceRunning(Promise promise) {
        try {
            // Primary: check Settings.Secure (survives process death)
            String enabledListeners = Settings.Secure.getString(
                    reactContext.getContentResolver(),
                    "enabled_notification_listeners");
            String componentName = reactContext.getPackageName() + "/" + SoulRouteNotificationService.class.getName();
            boolean enabledInSettings = enabledListeners != null &&
                    enabledListeners.contains(componentName);

            // Secondary: in-memory flag for current session
            boolean activeInMemory = SoulRouteNotificationService.isServiceActive();

            promise.resolve(enabledInSettings && activeInMemory);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void getWeeklyNotificationStats(Promise promise) {
        try {
            WritableArray finalArr = Arguments.createArray();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            SimpleDateFormat labelSdf = new SimpleDateFormat("EEE", Locale.US);
            
            for (int i = 6; i >= 0; i--) {
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.DAY_OF_YEAR, -i);
                String dateIso = sdf.format(cal.getTime());
                String label = labelSdf.format(cal.getTime());
                
                int total = SoulRouteNotificationService.getDayTotal(reactContext, dateIso);
                
                WritableMap m = Arguments.createMap();
                m.putString("date", label); // using short day name for chart
                m.putInt("count", total);
                finalArr.pushMap(m);
            }
            promise.resolve(finalArr);
        } catch (Exception e) {
            promise.reject("WEEKLY_NOTIF_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getWeeklyTrend(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                    reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            SimpleDateFormat displaySdf = new SimpleDateFormat("EEE", Locale.US);
            SimpleDateFormat groupSdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

            long now = System.currentTimeMillis();
            Calendar weekStart = Calendar.getInstance();
            weekStart.add(Calendar.DAY_OF_YEAR, -6);
            weekStart.set(Calendar.HOUR_OF_DAY, 0);
            weekStart.set(Calendar.MINUTE, 0);
            weekStart.set(Calendar.SECOND, 0);
            weekStart.set(Calendar.MILLISECOND, 0);

            // ── Single query to get all buckets ──────────────────────────────
            // This prevents duplicate counting of overlapping intervals that
            // hit multiple days.
            List<UsageStats> statsList = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, weekStart.getTimeInMillis(), now);

            // Map to store total per day: "yyyy-MM-dd" -> TotalScreenMs
            Map<String, Double> daySums = new HashMap<>();

            if (statsList != null) {
                for (UsageStats stats : statsList) {
                    if (!isUserApp(stats.getPackageName())) continue;

                    // Group by the bucket's start time day
                    String dayKey = groupSdf.format(new Date(stats.getFirstTimeStamp()));
                    double current = daySums.containsKey(dayKey) ? daySums.get(dayKey) : 0.0;
                    daySums.put(dayKey, current + stats.getTotalTimeInForeground());
                }
            }

            // ── Build final response for the last 7 days ────────────────────
            WritableArray resultArray = Arguments.createArray();
            for (int i = 6; i >= 0; i--) {
                Calendar dayStart = Calendar.getInstance();
                dayStart.add(Calendar.DAY_OF_YEAR, -i);
                dayStart.set(Calendar.HOUR_OF_DAY, 0);
                dayStart.set(Calendar.MINUTE, 0);
                dayStart.set(Calendar.SECOND, 0);
                dayStart.set(Calendar.MILLISECOND, 0);

                Calendar dayEnd = (Calendar) dayStart.clone();
                dayEnd.add(Calendar.DAY_OF_YEAR, 1);
                long endMs = Math.min(dayEnd.getTimeInMillis(), now);

                String dayKey = groupSdf.format(dayStart.getTime());
                String label = displaySdf.format(dayStart.getTime());

                double screenTimeMs = daySums.containsKey(dayKey) ? daySums.get(dayKey) : 0.0;
                
                // Unlock count still uses events (precise per day)
                int unlockCount = countUnlocksInRange(usm, dayStart.getTimeInMillis(), endMs);

                WritableMap m = Arguments.createMap();
                m.putString("date", label);
                m.putDouble("screenTimeMs", screenTimeMs);
                m.putInt("unlockCount", unlockCount);
                resultArray.pushMap(m);
            }

            promise.resolve(resultArray);
        } catch (Exception e) {
            promise.reject("WEEKLY_TREND_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void clearNotificationCounts(Promise promise) {
        SoulRouteNotificationService.clearCounts(reactContext);
        promise.resolve(true);
    }

    @ReactMethod
    public void getAppIcon(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            Drawable icon = pm.getApplicationIcon(packageName);
            Bitmap bitmap = drawableToBitmap(icon);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
            byte[] byteArray = outputStream.toByteArray();
            String encoded = Base64.encodeToString(byteArray, Base64.NO_WRAP);
            
            promise.resolve(encoded);
        } catch (Exception e) {
            promise.reject("ICON_ERROR", e.getMessage());
        }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
        if (drawable instanceof BitmapDrawable) {
            return ((BitmapDrawable) drawable).getBitmap();
        }
        
        int width = drawable.getIntrinsicWidth();
        int height = drawable.getIntrinsicHeight();
        
        // Handle cases where intrinsic dimensions are not set (e.g. Adaptive Icon with no fixed size)
        if (width <= 0) width = 120;
        if (height <= 0) height = 120;
        
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);
        return bitmap;
    }

    @ReactMethod
    public void setBlockedApps(ReadableArray packageNames, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("SoulRouteBlocking", Context.MODE_PRIVATE);
            Set<String> set = new HashSet<>();
            for (int i = 0; i < packageNames.size(); i++) {
                set.add(packageNames.getString(i));
            }
            prefs.edit().putStringSet("blocked_packages", set).apply();
            
            // Restart service if running to pick up changes
            if (isServiceRunning(SoulRouteBlockingService.class)) {
                startBlockingService(null);
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("BLOCK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, SoulRouteBlockingService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }
            if (promise != null) promise.resolve(true);
        } catch (Exception e) {
            if (promise != null) promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, SoulRouteBlockingService.class);
            reactContext.stopService(intent);
            if (promise != null) promise.resolve(true);
        } catch (Exception e) {
            if (promise != null) promise.reject("SERVICE_ERROR", e.getMessage());
        }
    }

    private boolean isServiceRunning(Class<?> serviceClass) {
        ActivityManager manager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
        if (manager == null) return false;
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}

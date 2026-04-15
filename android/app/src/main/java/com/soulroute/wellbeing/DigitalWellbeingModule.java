package com.soulroute.wellbeing;

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
import com.facebook.react.bridge.ReadableArray;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import android.content.SharedPreferences;

import com.soulroute.services.SoulRouteNotificationService;
import com.soulroute.services.SoulRouteBlockingService;
import com.soulroute.wellbeing.utils.UsageStatsHelper;
import com.soulroute.wellbeing.utils.IconHelper;

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
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, 
                android.os.Process.myUid(), reactContext.getPackageName());
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void hasNotificationPermission(Promise promise) {
        try {
            String enabledListeners = Settings.Secure.getString(reactContext.getContentResolver(), "enabled_notification_listeners");
            String componentName = reactContext.getPackageName() + "/" + SoulRouteNotificationService.class.getName();
            promise.resolve(enabledListeners != null && enabledListeners.contains(componentName));
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void requestRebind() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                ComponentName componentName = new ComponentName(reactContext, SoulRouteNotificationService.class);
                SoulRouteNotificationService.requestRebind(componentName);
            } catch (Exception e) {}
        }
    }

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

    // ─── Data Extraction ──────────────────────────────────────────────────────

    @ReactMethod
    public void getUsageStats(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            List<UsageStats> usageStatsList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, calendar.getTimeInMillis(), System.currentTimeMillis());
            PackageManager pm = reactContext.getPackageManager();
            WritableArray resultArray = Arguments.createArray();
            Map<String, Long> aggregatedStats = new HashMap<>();

            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    if (stats.getTotalTimeInForeground() <= 0) continue;
                    String pkg = stats.getPackageName();
                    if (!UsageStatsHelper.isUserApp(reactContext, pkg)) continue;
                    aggregatedStats.put(pkg, aggregatedStats.getOrDefault(pkg, 0L) + stats.getTotalTimeInForeground());
                }
            }

            for (Map.Entry<String, Long> entry : aggregatedStats.entrySet()) {
                WritableMap map = Arguments.createMap();
                map.putString("packageName", entry.getKey());
                map.putDouble("totalTimeInForeground", (double) entry.getValue());
                try {
                    ApplicationInfo ai = pm.getApplicationInfo(entry.getKey(), 0);
                    map.putString("appName", (String) pm.getApplicationLabel(ai));
                } catch (Exception e) {
                    map.putString("appName", entry.getKey());
                }
                resultArray.pushMap(map);
            }
            promise.resolve(resultArray);
        } catch (Exception e) { promise.reject("USAGE_ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getTotalScreenTime(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            List<UsageStats> list = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, cal.getTimeInMillis(), System.currentTimeMillis());
            double total = 0;
            if (list != null) {
                for (UsageStats s : list) {
                    if (UsageStatsHelper.isUserApp(reactContext, s.getPackageName())) total += s.getTotalTimeInForeground();
                }
            }
            promise.resolve(total);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getDeviceUnlockCount(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            promise.resolve(UsageStatsHelper.countUnlocksInRange(usm, cal.getTimeInMillis(), System.currentTimeMillis()));
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getNightUsage(Promise promise) {
        // ... Logic from original, delegated where possible ...
        // Re-implementing concisely for the refined module
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar nightStart = Calendar.getInstance();
            nightStart.set(Calendar.HOUR_OF_DAY, 22);
            nightStart.add(Calendar.DAY_OF_YEAR, -1);
            nightStart.set(Calendar.MINUTE, 0);
            nightStart.set(Calendar.SECOND, 0);
            nightStart.set(Calendar.MILLISECOND, 0);

            Calendar nightEnd = Calendar.getInstance();
            nightEnd.set(Calendar.HOUR_OF_DAY, 6);
            nightEnd.set(Calendar.MINUTE, 0);
            nightEnd.set(Calendar.SECOND, 0);
            nightEnd.set(Calendar.MILLISECOND, 0);

            long startMs = nightStart.getTimeInMillis();
            long endMs = Math.min(nightEnd.getTimeInMillis(), System.currentTimeMillis());
            if (endMs <= startMs) { promise.resolve(0.0); return; }

            UsageEvents events = usm.queryEvents(startMs, endMs);
            double total = 0;
            Map<String, Long> lastForegroundTime = new HashMap<>();
            UsageEvents.Event event = new UsageEvents.Event();

            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                String pkg = event.getPackageName();
                if (!UsageStatsHelper.isUserApp(reactContext, pkg)) continue;
                if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) lastForegroundTime.put(pkg, event.getTimeStamp());
                else if (event.getEventType() == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    if (lastForegroundTime.containsKey(pkg)) {
                        long s = lastForegroundTime.get(pkg);
                        long intersectStart = Math.max(s, startMs);
                        long intersectEnd = Math.min(event.getTimeStamp(), endMs);
                        if (intersectStart < intersectEnd) total += (intersectEnd - intersectStart);
                        lastForegroundTime.remove(pkg);
                    }
                }
            }
            promise.resolve(total);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getNightUsageHourly(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            Calendar startCal = Calendar.getInstance();
            startCal.set(Calendar.HOUR_OF_DAY, 22);
            startCal.add(Calendar.DAY_OF_YEAR, -1);
            startCal.set(Calendar.MINUTE, 0);
            startCal.set(Calendar.SECOND, 0);
            startCal.set(Calendar.MILLISECOND, 0);

            Calendar endCal = Calendar.getInstance();
            endCal.set(Calendar.HOUR_OF_DAY, 6);
            endCal.set(Calendar.MINUTE, 0);
            long queryEnd = Math.min(endCal.getTimeInMillis(), System.currentTimeMillis());

            UsageEvents events = usm.queryEvents(startCal.getTimeInMillis(), queryEnd);
            double[] hourlyMillis = new double[8];
            Map<String, Long> lastForegroundTime = new HashMap<>();
            UsageEvents.Event event = new UsageEvents.Event();

            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                String pkg = event.getPackageName();
                if (!UsageStatsHelper.isUserApp(reactContext, pkg)) continue;
                if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) lastForegroundTime.put(pkg, event.getTimeStamp());
                else if (event.getEventType() == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                    if (lastForegroundTime.containsKey(pkg)) {
                        UsageStatsHelper.distributeUsageIntoHours(lastForegroundTime.get(pkg), event.getTimeStamp(), startCal.getTimeInMillis(), hourlyMillis, reactContext);
                        lastForegroundTime.remove(pkg);
                    }
                }
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
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

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
                    ApplicationInfo ai = pm.getApplicationInfo(entry.getKey(), 0);
                    map.putString("appName", (String) pm.getApplicationLabel(ai));
                } catch (Exception e) { map.putString("appName", entry.getKey()); }
                resultArray.pushMap(map);
            }
            promise.resolve(resultArray);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
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
                WritableMap m = Arguments.createMap();
                m.putString("date", labelSdf.format(cal.getTime()));
                m.putInt("count", SoulRouteNotificationService.getDayTotal(reactContext, sdf.format(cal.getTime())));
                finalArr.pushMap(m);
            }
            promise.resolve(finalArr);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getAppIcon(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            promise.resolve(IconHelper.drawableToBase64(pm.getApplicationIcon(packageName)));
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void setBlockedApps(ReadableArray packageNames, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("SoulRouteBlocking", Context.MODE_PRIVATE);
            Set<String> set = new HashSet<>();
            for (int i = 0; i < packageNames.size(); i++) set.add(packageNames.getString(i));
            prefs.edit().putStringSet("blocked_packages", set).apply();
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void startBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, SoulRouteBlockingService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) reactContext.startForegroundService(intent);
            else reactContext.startService(intent);
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void stopBlockingService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, SoulRouteBlockingService.class);
            reactContext.stopService(intent);
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getWeeklyTrend(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            WritableArray trendArr = Arguments.createArray();
            SimpleDateFormat labelSdf = new SimpleDateFormat("EEE", Locale.US);
            
            for (int i = 6; i >= 0; i--) {
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.DAY_OF_YEAR, -i);
                cal.set(Calendar.HOUR_OF_DAY, 0);
                cal.set(Calendar.MINUTE, 0);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);
                long dayStart = cal.getTimeInMillis();
                
                cal.set(Calendar.HOUR_OF_DAY, 23);
                cal.set(Calendar.MINUTE, 59);
                cal.set(Calendar.SECOND, 59);
                long dayEnd = cal.getTimeInMillis();
                
                WritableMap dayMap = Arguments.createMap();
                dayMap.putString("date", labelSdf.format(new Date(dayStart)));
                dayMap.putDouble("screenTimeMs", (double) UsageStatsHelper.getScreenTimeFromEvents(usm, dayStart, dayEnd, reactContext));
                dayMap.putInt("unlockCount", UsageStatsHelper.countUnlocksInRange(usm, dayStart, dayEnd));
                trendArr.pushMap(dayMap);
            }
            promise.resolve(trendArr);
        } catch (Exception e) { promise.reject("TREND_ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void getAllApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray appList = Arguments.createArray();
            
            for (ApplicationInfo appInfo : packages) {
                if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
                    WritableMap map = Arguments.createMap();
                    map.putString("packageName", appInfo.packageName);
                    map.putString("appName", (String) pm.getApplicationLabel(appInfo));
                    appList.pushMap(map);
                }
            }
            promise.resolve(appList);
        } catch (Exception e) { promise.reject("APPS_ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void isNotificationServiceRunning(Promise promise) {
        promise.resolve(SoulRouteNotificationService.isServiceActive());
    }
}

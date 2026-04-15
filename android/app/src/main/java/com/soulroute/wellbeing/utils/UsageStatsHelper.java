package com.soulroute.wellbeing.utils;

import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UsageStatsHelper {

    public static boolean isUserApp(Context context, String packageName) {
        if (packageName == null) return false;
        if (packageName.equals(context.getPackageName())) return false;

        try {
            PackageManager pm = context.getPackageManager();
            return pm.getLaunchIntentForPackage(packageName) != null;
        } catch (Exception e) {
            return false;
        }
    }

    public static int countUnlocksInRange(UsageStatsManager usm, long start, long end) {
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
            return 0;
        }
    }

    public static long getScreenTimeFromEvents(UsageStatsManager usm, long start, long end, Context context) {
        UsageEvents events = usm.queryEvents(start, end);
        UsageEvents.Event event = new UsageEvents.Event();
        Map<String, Long> startTimes = new HashMap<>(); // Track when each app came to foreground
        long totalMs = 0;

        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            String pkg = event.getPackageName();
            int type = event.getEventType();

            if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                startTimes.put(pkg, event.getTimeStamp());
            } else if (type == UsageEvents.Event.MOVE_TO_BACKGROUND) {
                Long startTime = startTimes.remove(pkg);
                if (startTime != null && isUserApp(context, pkg)) {
                    totalMs += (event.getTimeStamp() - startTime);
                }
            }
        }

        // Handle apps that remained in foreground at the end of the window
        for (Map.Entry<String, Long> entry : startTimes.entrySet()) {
            if (isUserApp(context, entry.getKey())) {
                totalMs += (end - entry.getValue());
            }
        }

        return totalMs;
    }

    public static void distributeUsageIntoHours(long start, long end, long startTimeOffset, double[] buckets, Context context) {
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
}

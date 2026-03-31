package com.anonymous.mywellbeingapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * SoulRouteNotificationService
 *
 * A NotificationListenerService that counts notifications received per app.
 * Counts are persisted in SharedPreferences to survive process death.
 */
public class SoulRouteNotificationService extends NotificationListenerService {

    private static final String TAG = "SoulRouteNotiSvc";
    private static final String PREFS_NAME = "SoulRouteNotifications";
    private static final String CHANNEL_ID = "SoulRoute_Service_Channel";
    
    // Tracks the last app that sent a notification for debugging
    private static String sLastPkg = "none";
    private static volatile boolean sIsConnected = false;

    // In-memory cache for the current session
    private static final java.util.concurrent.ConcurrentHashMap<String, Integer> sessionCounts =
            new java.util.concurrent.ConcurrentHashMap<>();

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Scans existing unread notifications in the status bar and counts them.
     */
    private void scanExistingNotifications() {
        try {
            StatusBarNotification[] active = getActiveNotifications();
            if (active != null) {
                for (StatusBarNotification sbn : active) {
                    onNotificationPosted(sbn);
                }
                Log.d(TAG, "Initial scan completed: found " + active.length + " unread notifications");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to scan existing notifications: " + e.getMessage());
        }
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        sIsConnected = true;
        Log.d(TAG, "Notification listener connected successfully");
        
        // Notify the user that we are now tracking (Xiaomi context)
        createNotificationChannel();
        showServiceActiveNotification();

        // Scan existing notifications so count is not 0
        scanExistingNotifications();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SoulRoute Service Status",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows when SoulRoute is tracking your notifications");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showServiceActiveNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("SoulRoute Tracking Active")
                .setContentText("Notification tracking is running in the background.")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setAutoCancel(true);

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(999, builder.build());
        }
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        sIsConnected = false;
        Log.d(TAG, "Notification listener disconnected");
    }

    // ─── Notification events ───────────────────────────────────────────────────

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (pkg != null && !pkg.equals(getPackageName())) {
            sLastPkg = pkg;
            // Update session cache
            sessionCounts.merge(pkg, 1, Integer::sum);
            
            // Update persistent storage
            persistNotification(pkg);
            
            Log.d(TAG, "Notification received from app: " + pkg + ". Total Session Count: " + sessionCounts.get(pkg));
        } else if (pkg != null) {
            Log.d(TAG, "Ignored self-notification or null pkg");
        }
    }

    private void persistNotification(String pkg) {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        
        // Save per-app total (for today)
        String appKey = "count_" + today + "_" + pkg;
        int currentAppCount = prefs.getInt(appKey, 0);
        editor.putInt(appKey, currentAppCount + 1);

        // Save total for day (shortcut for the bar chart)
        String dayKey = "total_" + today;
        int currentDayTotal = prefs.getInt(dayKey, 0);
        editor.putInt(dayKey, currentDayTotal + 1);
        
        // Single atomic write instead of two separate .apply() calls
        editor.apply();
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Track totals received only
    }

    // ─── Public static API ───────────────────────────────────────────────────

    public static Map<String, Integer> getCounts(Context context) {
        // Merge SharedPreferences (persisted) + sessionCounts (in-memory, current process).
        // SharedPreferences is the source of truth (survives restarts); session cache
        // may have newer counts for the live process. We take the higher of the two
        // per package to avoid double-counting while ensuring nothing is lost.
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Map<String, ?> allEntries = prefs.getAll();
        Map<String, Integer> todayCounts = new HashMap<>();

        // 1. Load from SharedPreferences
        String prefix = "count_" + today + "_";
        for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
            if (entry.getKey().startsWith(prefix)) {
                String pkg = entry.getKey().substring(prefix.length());
                if (entry.getValue() instanceof Integer) {
                    todayCounts.put(pkg, (Integer) entry.getValue());
                }
            }
        }

        // 2. Merge in-memory session counts (take max to avoid double-counting)
        for (Map.Entry<String, Integer> entry : sessionCounts.entrySet()) {
            String pkg = entry.getKey();
            int sessionVal = entry.getValue();
            int storedVal  = todayCounts.containsKey(pkg) ? todayCounts.get(pkg) : 0;
            todayCounts.put(pkg, Math.max(storedVal, sessionVal));
        }

        return todayCounts;
    }

    public static int getDayTotal(Context context, String dateIso) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getInt("total_" + dateIso, 0);
    }

    public static void clearCounts(Context context) {
        sessionCounts.clear();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
    }

    /**
     * Returns true only when the OS has actually bound this listener.
     * The flag is set in onListenerConnected / onListenerDisconnected.
     */
    public static boolean isServiceActive() {
        return sIsConnected;
    }
}

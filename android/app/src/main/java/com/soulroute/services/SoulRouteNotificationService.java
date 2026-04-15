package com.soulroute.services;

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
    
    private static String sLastPkg = "none";
    private static volatile boolean sIsConnected = false;

    private static final java.util.concurrent.ConcurrentHashMap<String, Integer> sessionCounts =
            new java.util.concurrent.ConcurrentHashMap<>();

    private void scanExistingNotifications() {
        try {
            StatusBarNotification[] active = getActiveNotifications();
            if (active != null) {
                Log.d(TAG, "Initial scan starting: found " + active.length + " unread notifications");
                for (StatusBarNotification sbn : active) {
                    onNotificationPosted(sbn);
                }
                Log.d(TAG, "Initial scan completed.");
            } else {
                Log.d(TAG, "Initial scan: No active notifications found.");
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
        
        createNotificationChannel();
        showServiceActiveNotification();
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

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(getPackageName())) return;

        if (sbn.isOngoing()) {
            return;
        }

        if (sbn.getNotification() != null && (sbn.getNotification().flags & android.app.Notification.FLAG_GROUP_SUMMARY) != 0) {
            return;
        }

        sLastPkg = pkg;
        sessionCounts.merge(pkg, 1, Integer::sum);
        persistNotification(pkg);
    }

    private void persistNotification(String pkg) {
        try {
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            String appKey = "count_" + today + "_" + pkg;
            int currentAppCount = prefs.getInt(appKey, 0);
            editor.putInt(appKey, currentAppCount + 1);

            String dayKey = "total_" + today;
            int currentDayTotal = prefs.getInt(dayKey, 0);
            editor.putInt(dayKey, currentDayTotal + 1);
            
            editor.apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed to persist notification for " + pkg + ": " + e.getMessage());
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
    }

    public static Map<String, Integer> getCounts(Context context) {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Map<String, ?> allEntries = prefs.getAll();
        Map<String, Integer> todayCounts = new HashMap<>();

        String prefix = "count_" + today + "_";
        for (Map.Entry<String, ?> entry : allEntries.entrySet()) {
            if (entry.getKey().startsWith(prefix)) {
                String pkg = entry.getKey().substring(prefix.length());
                if (entry.getValue() instanceof Integer) {
                    todayCounts.put(pkg, (Integer) entry.getValue());
                }
            }
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

    public static boolean isServiceActive() {
        return sIsConnected;
    }
}

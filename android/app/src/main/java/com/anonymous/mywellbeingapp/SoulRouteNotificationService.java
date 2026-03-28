package com.anonymous.mywellbeingapp;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

/**
 * SoulRouteNotificationService
 *
 * A NotificationListenerService that counts notifications received per app.
 * The counts are stored in a static ConcurrentHashMap so DigitalWellbeingModule
 * can read them synchronously without IPC overhead.
 *
 * Registration: Declared in AndroidManifest.xml with
 *   android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
 * The user must manually enable it via:
 *   Settings > Apps & Notifications > Special App Access > Notification Access
 */
public class SoulRouteNotificationService extends NotificationListenerService {

    private static final String TAG = "SoulRouteNotiSvc";

    // Static map: packageName → total notification count since service started/reset
    private static final java.util.concurrent.ConcurrentHashMap<String, Integer> notifCounts =
            new java.util.concurrent.ConcurrentHashMap<>();

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "Notification listener connected");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.d(TAG, "Notification listener disconnected");
    }

    // ─── Notification events ───────────────────────────────────────────────────

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        // Skip our own app's notifications to avoid feedback loops
        if (pkg != null && !pkg.equals(getPackageName())) {
            notifCounts.merge(pkg, 1, Integer::sum);
            Log.d(TAG, "Notification from: " + pkg + " | count: " + notifCounts.get(pkg));
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // We intentionally don't decrement — we track total received count
    }

    // ─── Public static API (called by DigitalWellbeingModule) ─────────────────

    public static Map<String, Integer> getCounts() {
        return new HashMap<>(notifCounts);
    }

    public static void clearCounts() {
        notifCounts.clear();
    }
}

package com.soulroute.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import android.graphics.Color;
import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.LinearLayout;
import java.util.HashSet;
import java.util.Set;
import com.soulroute.MainActivity;

public class SoulRouteBlockingService extends Service {
    private static final String TAG = "SoulRouteBlockSvc";
    private static final String CHANNEL_ID = "SoulRoute_Blocker_Channel";
    private static final String PREFS_NAME = "SoulRouteBlocking";
    
    private Handler handler = new Handler();
    private Runnable monitorRunnable;
    private Set<String> blockedPackages = new HashSet<>();
    private boolean isRunning = false;
    
    private WindowManager windowManager;
    private View overlayView;
    private boolean isOverlayShowing = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(200, createNotification());
        
        loadBlockedApps();
        startMonitoring();
        
        return START_STICKY;
    }

    private void loadBlockedApps() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        blockedPackages = prefs.getStringSet("blocked_packages", new HashSet<String>());
        Log.d(TAG, "Loaded " + blockedPackages.size() + " blocked apps");
    }

    private void startMonitoring() {
        if (isRunning) return;
        isRunning = true;
        
        monitorRunnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                if (isRunning) {
                    handler.postDelayed(this, 400); // Check every 400ms
                }
            }
        };
        handler.post(monitorRunnable);
    }

    private void checkForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long now = System.currentTimeMillis();
        UsageEvents events = usm.queryEvents(now - 3000, now);
        UsageEvents.Event event = new UsageEvents.Event();
        
        String lastPackage = null;
        while (events.hasNextEvent()) {
            events.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                lastPackage = event.getPackageName();
            }
        }

        if (lastPackage != null) {
            if (blockedPackages.contains(lastPackage)) {
                showOverlay();
            } else {
                hideOverlay();
            }
        }
    }

    private void showOverlay() {
        if (isOverlayShowing) return;
        
        handler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.MATCH_PARENT,
                        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O 
                            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY 
                            : WindowManager.LayoutParams.TYPE_PHONE,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE 
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN 
                            | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                        PixelFormat.TRANSLUCENT
                    );
                    params.gravity = Gravity.CENTER;

                    LinearLayout layout = new LinearLayout(SoulRouteBlockingService.this);
                    layout.setBackgroundColor(Color.parseColor("#E0F2F1"));
                    layout.setOrientation(LinearLayout.VERTICAL);
                    layout.setGravity(Gravity.CENTER);
                    layout.setPadding(40, 40, 40, 40);

                    TextView title = new TextView(SoulRouteBlockingService.this);
                    title.setText("Focus Mode Active");
                    title.setTextSize(26);
                    title.setTextColor(Color.parseColor("#004D40"));
                    title.setGravity(Gravity.CENTER);

                    TextView sub = new TextView(SoulRouteBlockingService.this);
                    sub.setText("\nThis app is currently restricted.\nReturn to SoulRoute to finish your session.");
                    sub.setTextSize(16);
                    sub.setTextColor(Color.parseColor("#00796B"));
                    sub.setGravity(Gravity.CENTER);

                    layout.addView(title);
                    layout.addView(sub);

                    overlayView = layout;
                    windowManager.addView(overlayView, params);
                    isOverlayShowing = true;
                    Log.d(TAG, "Overlay shown");
                } catch (Exception e) {
                    Log.e(TAG, "Error showing overlay: " + e.getMessage());
                }
            }
        });
    }

    private void hideOverlay() {
        if (!isOverlayShowing || overlayView == null) return;
        
        handler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    windowManager.removeView(overlayView);
                    overlayView = null;
                    isOverlayShowing = false;
                    Log.d(TAG, "Overlay removed");
                } catch (Exception e) {
                    Log.e(TAG, "Error removing overlay: " + e.getMessage());
                }
            }
        });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Focus Mode Activity",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, 
                PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Focus Mode Active")
                .setContentText("SoulRoute is helping you stay focused.")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        handler.removeCallbacks(monitorRunnable);
        super.onDestroy();
    }
}

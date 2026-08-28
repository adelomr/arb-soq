package com.example.myapplication;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class SmsGatewayService extends Service {

    public static final String CHANNEL_ID = "sms_gateway_channel";
    public static final int NOTIF_ID = 10001;
    private SmsGatewayServer server;
    private PowerManager.WakeLock wakeLock;
    private boolean isServiceRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i("SmsGatewayService", "Service onCreate()");
        
        createChannel();
        acquireWakeLock();
        
        // Justify foreground service usage for Android 14+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // This service is required to maintain SMS gateway functionality
            // and ensure reliable message delivery in background
        }
        
        startForeground(NOTIF_ID, buildNotification("🔄 الخادم يعمل في الخلفية"));
        startServer();
        isServiceRunning = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i("SmsGatewayService", "Service onStartCommand() - START_STICKY");
        
        // إعادة تشغيل الخادم إذا توقف
        if (!isServiceRunning || server == null) {
            startServer();
            isServiceRunning = true;
        }
        
        // تحديث الإشعار
        updateNotification("🔄 الخادم يعمل في الخلفية");
        
        // إعادة تشغيل تلقائي عند توقف النظام
        return START_STICKY;
    }

    private void startServer() {
        int[] ports = {8088, 8765, 8080, 9090};
        for (int p : ports) {
            try {
                stopServer();
                server = new SmsGatewayServer(this, p);
                server.start();
                Log.i("SmsGatewayService", "Server started successfully on port " + p);
                updateNotification("تم تشغيل خادم الرسائل على المنفذ " + p);
                getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE).edit().putInt("server_port", p).apply();
                return;
            } catch (Exception e) {
                Log.w("SmsGatewayService", "Port " + p + " busy or failed: " + e.getMessage());
            }
        }
        Log.e("SmsGatewayService", "Failed to bind to any port");
        updateNotification("فشل تشغيل السيرفر - جميع المنافذ مشغولة");
    }

    private void stopServer() {
        try {
            if (server != null) {
                server.stop();
                server = null;
                Log.i("SmsGatewayService", "Server stopped");
            }
        } catch (Exception e) {
            Log.e("SmsGatewayService", "Error stopping server", e);
        }
    }

    @Override
    public void onDestroy() {
        Log.i("SmsGatewayService", "Service onDestroy()");
        isServiceRunning = false;
        stopServer();
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.i("SmsGatewayService", "Task removed - restarting service");
        // إعادة تشغيل الخدمة عند إزالة التطبيق من قائمة المهام
        Intent restartServiceIntent = new Intent(getApplicationContext(), this.getClass());
        restartServiceIntent.setPackage(getPackageName());
        startService(restartServiceIntent);
        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "SMSGateway", NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void acquireWakeLock() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "SmsGatewayService::WakeLock"
                );
                wakeLock.acquire(10*60*1000L /*10 minutes*/);
                Log.i("SmsGatewayService", "WakeLock acquired");
            }
        } catch (Exception e) {
            Log.e("SmsGatewayService", "Failed to acquire WakeLock", e);
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
                Log.i("SmsGatewayService", "WakeLock released");
            }
        } catch (Exception e) {
            Log.e("SmsGatewayService", "Error releasing WakeLock", e);
        }
    }

    private void updateNotification(String content) {
        try {
            Notification notification = buildNotification(content);
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(NOTIF_ID, notification);
            }
        } catch (Exception e) {
            Log.e("SmsGatewayService", "Failed to update notification", e);
        }
    }

    private Notification buildNotification(String content) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, openIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("🚀 بوابة الرسائل")
                .setContentText(content)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setShowWhen(true)
                .setAutoCancel(false)
                .build();
    }
}



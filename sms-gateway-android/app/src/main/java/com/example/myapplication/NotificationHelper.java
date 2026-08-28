package com.example.myapplication;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class NotificationHelper {
    private static final String TAG = "NotificationHelper";
    private static final String CHANNEL_ID = "sms_notification_channel";
    private static final String CHANNEL_NAME = "SMS Notifications";
    private static final int NOTIFICATION_ID = 20001;
    
    private Context context;
    private NotificationManager notificationManager;
    
    public NotificationHelper(Context context) {
        this.context = context;
        this.notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            
            // إعداد الصوت
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            
            channel.setSound(soundUri, audioAttributes);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            notificationManager.createNotificationChannel(channel);
            Log.i(TAG, "Notification channel created with sound");
        }
    }
    
    public void showSmsNotification(String phone, String code, String message) {
        try {
            // إنشاء Intent لفتح التطبيق
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            // إنشاء الإشعار
            Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("📱 رسالة تفعيل جديدة")
                .setContentText("من: " + phone + " - الكود: " + code)
                .setStyle(new NotificationCompat.BigTextStyle()
                    .bigText("📱 رسالة تفعيل جديدة\n\n" +
                            "📞 من: " + phone + "\n" +
                            "🔢 الكود: " + code + "\n" +
                            "💬 الرسالة: " + message + "\n\n" +
                            "⏰ " + getCurrentTime()))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setLights(0xFF00FF00, 1000, 1000)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .build();
            
            // عرض الإشعار
            notificationManager.notify(NOTIFICATION_ID, notification);
            Log.i(TAG, "SMS notification shown for: " + phone);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to show SMS notification", e);
        }
    }
    
    public void showSmsSentNotification(String phone, String code, boolean success) {
        try {
            String title = success ? "✅ تم إرسال الرسالة" : "❌ فشل إرسال الرسالة";
            String content = success ? 
                "تم إرسال كود التفعيل " + code + " إلى " + phone :
                "فشل إرسال كود التفعيل " + code + " إلى " + phone;
            
            Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(content)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setAutoCancel(true)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setVibrate(new long[]{0, 500, 250, 500})
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .build();
            
            notificationManager.notify(NOTIFICATION_ID + 1, notification);
            Log.i(TAG, "SMS sent notification shown: " + success);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to show SMS sent notification", e);
        }
    }
    
    public void showServerStatusNotification(String status) {
        try {
            Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("🖥️ حالة الخادم")
                .setContentText(status)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setAutoCancel(true)
                .setOngoing(false)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .build();
            
            notificationManager.notify(NOTIFICATION_ID + 2, notification);
            Log.i(TAG, "Server status notification shown: " + status);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to show server status notification", e);
        }
    }
    
    private String getCurrentTime() {
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault());
        return sdf.format(new java.util.Date());
    }
    
    public void cancelAllNotifications() {
        try {
            notificationManager.cancelAll();
            Log.i(TAG, "All notifications cancelled");
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel notifications", e);
        }
    }
    
    public void cancelNotification(int notificationId) {
        try {
            notificationManager.cancel(notificationId);
            Log.i(TAG, "Notification cancelled: " + notificationId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to cancel notification", e);
        }
    }
}

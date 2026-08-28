package com.example.myapplication;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BroadcastReceiver للاستماع لإعادة تشغيل الجهاز
 * ويقوم بتشغيل خدمة بوابة الرسائل تلقائياً
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.i(TAG, "Received broadcast: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            Log.i(TAG, "Device boot completed - starting SMS Gateway Service");
            startSmsGatewayService(context);
        }
    }

    private void startSmsGatewayService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, SmsGatewayService.class);
            context.startForegroundService(serviceIntent);
            Log.i(TAG, "SMS Gateway Service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start SMS Gateway Service", e);
        }
    }
}
package com.example.myapplication;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import java.net.URLEncoder;

public class WhatsAppHelper {

    private static final String TAG = "WhatsAppHelper";
    public static final String PACKAGE_WHATSAPP_BUSINESS = "com.whatsapp.w4b";
    public static final String PACKAGE_WHATSAPP = "com.whatsapp";

    public static boolean isWhatsAppInstalled(Context context) {
        return isPackageInstalled(context, PACKAGE_WHATSAPP_BUSINESS) || isPackageInstalled(context, PACKAGE_WHATSAPP);
    }

    public static String getInstalledWhatsAppPackage(Context context) {
        if (isPackageInstalled(context, PACKAGE_WHATSAPP_BUSINESS)) {
            return PACKAGE_WHATSAPP_BUSINESS;
        }
        if (isPackageInstalled(context, PACKAGE_WHATSAPP)) {
            return PACKAGE_WHATSAPP;
        }
        return null;
    }

    private static boolean isPackageInstalled(Context context, String packageName) {
        try {
            context.getPackageManager().getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    public static boolean isAccessibilityServiceEnabled(Context context) {
        int accessibilityEnabled = 0;
        final String serviceName = context.getPackageName() + "/" + WhatsAppAccessibilityService.class.getName();
        try {
            accessibilityEnabled = Settings.Secure.getInt(
                context.getContentResolver(),
                Settings.Secure.ACCESSIBILITY_ENABLED
            );
        } catch (Settings.SettingNotFoundException e) {
            Log.w(TAG, "Error finding setting: " + e.getMessage());
        }

        if (accessibilityEnabled == 1) {
            String settingValue = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            if (settingValue != null) {
                TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
                splitter.setString(settingValue);
                while (splitter.hasNext()) {
                    String accessibilityService = splitter.next();
                    if (accessibilityService.equalsIgnoreCase(serviceName)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public static void openAccessibilitySettings(Context context) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open accessibility settings", e);
        }
    }

    public static void wakeUpAndUnlockScreen(Context context) {
        try {
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                android.os.PowerManager.WakeLock wakeLock = pm.newWakeLock(
                    android.os.PowerManager.FULL_WAKE_LOCK |
                    android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    android.os.PowerManager.ON_AFTER_RELEASE,
                    "SmsGateway:WhatsAppWakeLock"
                );
                wakeLock.acquire(5000);
            }

            android.app.KeyguardManager km = (android.app.KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                @SuppressWarnings("deprecation")
                android.app.KeyguardManager.KeyguardLock kl = km.newKeyguardLock("SmsGateway:KeyguardLock");
                if (kl != null) {
                    kl.disableKeyguard();
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not wake up/unlock screen: " + e.getMessage());
        }
    }

    public static boolean sendWhatsAppMessage(Context context, String phone, String message) {
        try {
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            String encodedMessage = URLEncoder.encode(message, "UTF-8");
            
            String pkg = getInstalledWhatsAppPackage(context);
            if (pkg == null) {
                Log.e(TAG, "No WhatsApp app installed");
                return false;
            }

            // Wake up and unlock screen
            wakeUpAndUnlockScreen(context);

            // Flag automated send for accessibility service
            WhatsAppAccessibilityService.startAutomatedSend();

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse("https://api.whatsapp.com/send?phone=" + cleanPhone + "&text=" + encodedMessage));
            intent.setPackage(pkg);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            context.startActivity(intent);
            Log.i(TAG, "Launched WhatsApp message intent to " + cleanPhone + " via " + pkg);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch WhatsApp intent", e);
            WhatsAppAccessibilityService.isSendingAutomatedMessage = false;
            return false;
        }
    }
}

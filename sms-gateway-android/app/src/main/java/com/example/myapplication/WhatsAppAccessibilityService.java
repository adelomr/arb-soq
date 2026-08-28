package com.example.myapplication;

import android.accessibilityservice.AccessibilityService;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.List;

public class WhatsAppAccessibilityService extends AccessibilityService {

    private static final String TAG = "WhatsAppAccessibility";
    public static volatile boolean isSendingAutomatedMessage = false;
    public static volatile long lastAutomationTriggerTime = 0;
    private static WhatsAppAccessibilityService instance = null;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        Log.i(TAG, "WhatsAppAccessibilityService connected successfully");
    }

    public static boolean isRunning() {
        return instance != null;
    }

    public static void startAutomatedSend() {
        isSendingAutomatedMessage = true;
        lastAutomationTriggerTime = System.currentTimeMillis();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isSendingAutomatedMessage) {
            return;
        }

        // Auto timeout after 10 seconds to prevent unintended clicks
        if (System.currentTimeMillis() - lastAutomationTriggerTime > 10000) {
            isSendingAutomatedMessage = false;
            return;
        }

        CharSequence packageName = event.getPackageName();
        if (packageName == null) return;

        String pkg = packageName.toString();
        if (!pkg.equals("com.whatsapp.w4b") && !pkg.equals("com.whatsapp")) {
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return;

        try {
            boolean clicked = findAndClickSendButton(rootNode, pkg);
            if (clicked) {
                Log.i(TAG, "WhatsApp Send button clicked successfully!");
                isSendingAutomatedMessage = false;

                // Return to our Gateway app smoothly after sending
                mainHandler.postDelayed(() -> {
                    try {
                        performGlobalAction(GLOBAL_ACTION_BACK);
                    } catch (Exception ignored) { }
                }, 800);
            }
        } catch (Exception e) {
            Log.w(TAG, "Error clicking WhatsApp send button: " + e.getMessage());
        } finally {
            rootNode.recycle();
        }
    }

    private boolean findAndClickSendButton(AccessibilityNodeInfo root, String pkg) {
        if (root == null) return false;

        // 1. Try finding by resource ID
        String[] idList = {
            pkg + ":id/send",
            pkg + ":id/send_btn",
            pkg + ":id/btn_send"
        };

        for (String id : idList) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId(id);
            if (nodes != null && !nodes.isEmpty()) {
                for (AccessibilityNodeInfo node : nodes) {
                    if (node.isClickable() && node.isVisibleToUser()) {
                        node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                }
            }
        }

        // 2. Try finding by content description (Arabic / English / French / etc.)
        String[] descriptions = {"إرسال", "ارسال", "Send", "Envoyer", "Enviar"};
        for (String desc : descriptions) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(desc);
            if (nodes != null && !nodes.isEmpty()) {
                for (AccessibilityNodeInfo node : nodes) {
                    if (node.isClickable() && node.isVisibleToUser()) {
                        node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                    // Or check parent if clickable
                    AccessibilityNodeInfo parent = node.getParent();
                    if (parent != null && parent.isClickable() && parent.isVisibleToUser()) {
                        parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "WhatsAppAccessibilityService interrupted");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        Log.i(TAG, "WhatsAppAccessibilityService destroyed");
    }
}

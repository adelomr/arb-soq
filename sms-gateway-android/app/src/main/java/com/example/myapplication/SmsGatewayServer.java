package com.example.myapplication;

import android.content.Context;
import android.telephony.SmsManager;
import android.text.TextUtils;

import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

public class SmsGatewayServer extends NanoHTTPD {

    private static final String AUTH_TOKEN = "SECRET123";
    private final Context appContext;
    private NotificationHelper notificationHelper;

    public SmsGatewayServer(Context context, int port) {
        super(port);
        this.appContext = context.getApplicationContext();
        this.notificationHelper = new NotificationHelper(appContext);
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        if ("/health".equals(uri)) {
            Response r = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"up\"}");
            addCors(r);
            return r;
        }
        if ("/status".equals(uri)) {
            Response r = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"ok\",\"service\":\"SMS Gateway\",\"version\":\"1.0\"}");
            addCors(r);
            return r;
        }
        // CORS preflight support
        if (Method.OPTIONS.equals(session.getMethod())) {
            Response r = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "text/plain", "");
            addCors(r);
            return r;
        }
        if ("/send".equals(uri) || "/send-whatsapp".equals(uri) || "/send-sms".equals(uri)) {
            Map<String, String> params = session.getParms();
            String method = session.getMethod().name();

            String phone = null;
            String code = null;
            String simParam = null;
            String token = null;
            String idempotencyKey = null;
            String webhookUrl = null;
            String channel = null;

            Map<String, String> files = new java.util.HashMap<>();
            String body = null;
            if (Method.POST.equals(session.getMethod()) || Method.PUT.equals(session.getMethod())) {
                try {
                    session.parseBody(files);
                } catch (Exception e) {
                    android.util.Log.w("SmsGatewayServer", "parseBody warning: " + e.getMessage());
                }
                body = files.get("postData");
                if (body == null) {
                    body = params.get("postData");
                }
                if (body != null && !body.trim().isEmpty()) {
                    try {
                        org.json.JSONObject json = new org.json.JSONObject(body);
                        phone = json.optString("phone", null);
                        code = json.optString("code", null);
                        simParam = json.optString("sim", null);
                        token = json.optString("token", null);
                        idempotencyKey = json.optString("idempotencyKey", null);
                        webhookUrl = json.optString("webhook", null);
                        channel = json.optString("channel", null);
                    } catch (org.json.JSONException e) {
                        android.util.Log.w("SmsGatewayServer", "JSON parse warning: " + e.getMessage());
                    }
                }
            }

            if (phone == null) phone = params.get("phone");
            if (code == null) code = params.get("code");
            if (simParam == null) simParam = params.get("sim");
            if (token == null) token = params.get("token");
            if (idempotencyKey == null) idempotencyKey = params.get("idempotencyKey");
            if (webhookUrl == null) webhookUrl = params.get("webhook");
            if (channel == null) channel = params.get("channel");
            if ("/send-whatsapp".equals(uri)) channel = "whatsapp";

            android.content.SharedPreferences prefsToken = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
            String configuredToken = prefsToken.getString("api_token", AUTH_TOKEN);
            if (!TextUtils.equals(configuredToken, token)) {
                Response r = NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"status\":\"error\",\"message\":\"403 Unauthorized\"}");
                addCors(r);
                return r;
            }

            // Optional HMAC verification if headers provided
            String rawPayloadForSign;
            if (Method.POST.equals(session.getMethod())) {
                rawPayloadForSign = (body != null) ? body : "";
            } else {
                String qp = session.getQueryParameterString();
                rawPayloadForSign = (qp != null) ? qp : "";
            }
            Response hmacCheck = verifyHmacIfPresent(session, rawPayloadForSign);
            if (hmacCheck != null) {
                addCors(hmacCheck);
                return hmacCheck;
            }

            if (TextUtils.isEmpty(phone) || TextUtils.isEmpty(code)) {
                Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", "{\"status\":\"error\",\"message\":\"missing phone or code\"}");
                addCors(rr);
                return rr;
            }

            SmsLogDatabaseHelper dbHelper = new SmsLogDatabaseHelper(appContext);
            if (!TextUtils.isEmpty(idempotencyKey) && dbHelper.isIdempotencyProcessed(idempotencyKey)) {
                Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"duplicate\"}");
                addCors(rr);
                return rr;
            }

            // ── PRIORITIZE WHATSAPP (الأولوية لواتساب، فإن فشل يتم التحويل لـ SMS) ──
            boolean tryWhatsApp = "whatsapp".equalsIgnoreCase(channel) || "auto".equalsIgnoreCase(channel) || channel == null;
            if (tryWhatsApp && WhatsAppHelper.isWhatsAppInstalled(appContext)) {
                android.content.SharedPreferences prefs = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
                String template = prefs.getString("whatsapp_template", "رمز تفعيل سوق العرب الخاص بك هو: {code}");
                String message = template.replace("{code}", code);

                boolean sent = WhatsAppHelper.sendWhatsAppMessage(appContext, phone, message);
                if (sent) {
                    dbHelper.insertLog(phone, code, System.currentTimeMillis(), 0);
                    notificationHelper.showSmsSentNotification(phone, code, true);

                    if (!TextUtils.isEmpty(webhookUrl)) {
                        notifyWebhookAsync(webhookUrl, true, phone, code, 0, null);
                    }

                    // Usage Stats
                    UsageStatsDatabaseHelper usageHelper = new UsageStatsDatabaseHelper(appContext);
                    usageHelper.logUsage("whatsapp_client", "SEND_WHATSAPP", phone, true, 0);
                    usageHelper.updateDailyStats(true);

                    Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"ok\",\"channel\":\"whatsapp\"}");
                    addCors(rr);
                    return rr;
                } else {
                    android.util.Log.w("SmsGateway", "WhatsApp send skipped/failed, falling back to SMS automatically...");
                }
            }

            int sim = 1;
            try {
                if (!TextUtils.isEmpty(simParam)) {
                    sim = Integer.parseInt(simParam);
                }
                if (TextUtils.isEmpty(simParam)) {
                    android.content.SharedPreferences prefs = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
                    sim = prefs.getInt("default_sim", 1);
                }
            } catch (Exception ignored) { }

            int[] tryOrder = (sim == 2) ? new int[]{1, 0} : new int[]{0, 1};
            android.content.SharedPreferences prefs = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
            String template = prefs.getString("activation_template", "رمز التفعيل: {code}");
            // Check if we have the required permission
            if (appContext.checkSelfPermission(android.Manifest.permission.SEND_SMS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                android.util.Log.e("SmsGateway", "SEND_SMS permission not granted");
                Response errorResponse = NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"error\":\"SEND_SMS permission not granted\"}");
                addCors(errorResponse);
                return errorResponse;
            }
            
            android.util.Log.d("SmsGateway", "Attempting to send SMS to: " + phone + " with code: " + code + " using SIM: " + sim);
            
            // Check SIM availability
            try {
                android.telephony.SubscriptionManager sm = (android.telephony.SubscriptionManager) appContext.getSystemService(android.content.Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                java.util.List<android.telephony.SubscriptionInfo> activeSubs = sm != null ? sm.getActiveSubscriptionInfoList() : null;
                if (activeSubs == null || activeSubs.isEmpty()) {
                    android.util.Log.e("SmsGateway", "No active SIM cards found");
                    Response errorResponse = NanoHTTPD.newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{\"error\":\"No active SIM cards found\"}");
                    addCors(errorResponse);
                    return errorResponse;
                }
                android.util.Log.d("SmsGateway", "Found " + activeSubs.size() + " active SIM cards");
            } catch (Exception e) {
                android.util.Log.w("SmsGateway", "Could not check SIM status", e);
            }
            
            if (template == null || template.trim().isEmpty()) template = "رمز التفعيل: {code}";
            String message = template.replace("{code}", code);
            Throwable lastError = null;
            for (int subId : tryOrder) {
                try {
                    android.util.Log.d("SmsGateway", "Trying to send SMS via subId: " + subId);
                    SmsManager smsManager;
                    try {
                        smsManager = SmsManager.getSmsManagerForSubscriptionId(subId);
                        android.util.Log.d("SmsGateway", "Got SmsManager for subId: " + subId);
                    } catch (Throwable t) {
                        android.util.Log.w("SmsGateway", "Failed to get SmsManager for subId " + subId + ", using default", t);
                        smsManager = SmsManager.getDefault();
                    }
                    
                    android.util.Log.d("SmsGateway", "Sending message: " + message + " to: " + phone);
                    smsManager.sendTextMessage(phone, null, message, null, null);
                    android.util.Log.d("SmsGateway", "SMS sent successfully via subId: " + subId);

                    // Log success with actual SIM used (subId 0->sim1, 1->sim2)
                    int usedSim = (subId == 1) ? 2 : 1;
                    SmsLogDatabaseHelper db = new SmsLogDatabaseHelper(appContext);
                    db.insertLog(phone, code, System.currentTimeMillis(), usedSim);
                    if (!TextUtils.isEmpty(idempotencyKey)) db.markIdempotencyProcessed(idempotencyKey);
                    
                    // إظهار إشعار نجاح الإرسال
                    notificationHelper.showSmsSentNotification(phone, code, true);

                    if (!TextUtils.isEmpty(webhookUrl)) {
                        notifyWebhookAsync(webhookUrl, true, phone, code, usedSim, null);
                    }
                    
                    // Log usage statistics
                    String clientIp = session.getHeaders().get("remote-addr");
                    if (clientIp == null) clientIp = "unknown";
                    String appId = clientIp + "_" + System.currentTimeMillis();
                    String appName = "Client_" + clientIp.substring(clientIp.lastIndexOf('.') + 1);
                    
                    UsageStatsDatabaseHelper usageHelper = new UsageStatsDatabaseHelper(appContext);
                    usageHelper.recordAppConnection(appId, appName, clientIp);
                    usageHelper.updateAppLastSeen(appId);
                    usageHelper.incrementAppRequests(appId);
                    usageHelper.logUsage(appId, "SEND_SMS", phone, true, System.currentTimeMillis() - System.currentTimeMillis());
                    usageHelper.updateDailyStats(true);
                    
                    Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"ok\"}");
                    addCors(rr);
                    return rr;
                } catch (SecurityException e) {
                    lastError = e;
                    android.util.Log.e("SmsGateway", "SecurityException sending via subId " + subId + ": " + e.getMessage());
                    android.util.Log.e("SmsGateway", "This usually means SMS permission is not granted or SIM is not available");
                } catch (Throwable t) {
                    lastError = t;
                    android.util.Log.e("SmsGateway", "Failed to send via subId " + subId, t);
                    android.util.Log.e("SmsGateway", "Error details: " + t.getClass().getSimpleName() + " - " + t.getMessage());
                }
            }

            String err = (lastError != null && lastError.getMessage() != null) ? lastError.getMessage() : "unknown error";
            
            // إظهار إشعار فشل الإرسال
            notificationHelper.showSmsSentNotification(phone, code, false);
            
            if (!TextUtils.isEmpty(webhookUrl)) {
                notifyWebhookAsync(webhookUrl, false, phone, code, sim, err);
            }
            Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{\"status\":\"error\",\"message\":\"" + err.replace("\"","'") + "\"}");
            addCors(rr);
            return rr;
        }

        Response rr = NanoHTTPD.newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not Found");
        addCors(rr);
        return rr;
    }

    private void addCors(Response r) {
        r.addHeader("Access-Control-Allow-Origin", "*");
        r.addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        r.addHeader("Access-Control-Allow-Headers", "Content-Type,X-Timestamp,X-Signature,X-Signature-Alg");
    }

    private Response verifyHmacIfPresent(IHTTPSession session, String payload) {
        Map<String, String> headers = session.getHeaders();
        String ts = headers.get("x-timestamp");
        String sig = headers.get("x-signature");
        if ((ts == null || ts.isEmpty()) && (sig == null || sig.isEmpty())) {
            return null; // HMAC not used
        }

        if (ts == null || sig == null) {
            return NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"status\":\"error\",\"message\":\"missing hmac headers\"}");
        }

        try {
            long tsLong = Long.parseLong(ts);
            long now = System.currentTimeMillis() / 1000L;
            if (Math.abs(now - tsLong) > 300) { // 5 minutes skew
                return NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"status\":\"error\",\"message\":\"timestamp skew\"}");
            }
        } catch (Throwable ignored) {
            return NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"status\":\"error\",\"message\":\"invalid timestamp\"}");
        }

        String method = session.getMethod().name();
        String path = session.getUri();
        String stringToSign = ts + "\n" + method + "\n" + path + "\n" + (payload == null ? "" : payload);

        android.content.SharedPreferences prefs = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
        String secret = prefs.getString("hmac_secret", "HMACSECRET123");
        String expected = hmacSha256Hex(secret, stringToSign);
        if (!expected.equalsIgnoreCase(sig)) {
            return NanoHTTPD.newFixedLengthResponse(Response.Status.FORBIDDEN, "application/json", "{\"status\":\"error\",\"message\":\"invalid signature\"}");
        }
        return null;
    }

    private String hmacSha256Hex(String secret, String data) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec keySpec = new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] raw = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return bytesToHex(raw);
        } catch (Exception e) {
            return "";
        }
    }

    private String bytesToHex(byte[] bytes) {
        char[] hexArray = "0123456789abcdef".toCharArray();
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }

    private void notifyWebhookAsync(final String webhookUrl, final boolean success, final String phone, final String code, final int sim, final String error) {
        new Thread(() -> {
            try {
                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("success", success);
                payload.put("phone", phone);
                payload.put("code", code);
                payload.put("sim", sim);
                if (!success) payload.put("error", error);

                java.net.URL url = new java.net.URL(webhookUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setRequestMethod("POST");
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json");
                // Sign webhook using HMAC as well
                String ts = String.valueOf(System.currentTimeMillis() / 1000L);
                android.content.SharedPreferences prefs = appContext.getSharedPreferences("sms_gateway_prefs", android.content.Context.MODE_PRIVATE);
                String secret = prefs.getString("hmac_secret", "HMACSECRET123");
                String toSign = ts + "\nPOST\n/webhook\n" + payload.toString();
                String signature = hmacSha256Hex(secret, toSign);
                conn.setRequestProperty("X-Timestamp", ts);
                conn.setRequestProperty("X-Signature", signature);
                conn.setRequestProperty("X-Signature-Alg", "HMAC-SHA256");
                byte[] out = payload.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                conn.getOutputStream().write(out);
                conn.getOutputStream().flush();
                conn.getOutputStream().close();
                conn.getResponseCode();
                conn.disconnect();
            } catch (Throwable ignored) { }
        }).start();
    }
}



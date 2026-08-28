package com.example.myapplication;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private SmsGatewayServer smsGatewayServer;
    private SmsLogAdapter smsLogAdapter;
    private SmsLogDatabaseHelper databaseHelper;
    private UsageStatsDatabaseHelper usageStatsHelper;
    
    // Failover servers list
    private java.util.List<String> backupServers = new java.util.ArrayList<>();
    private String currentServerIP = "127.0.0.1";
    private DrawerLayout drawerLayout;
    private RecyclerView navigationDrawer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Apply saved language before setting content view
        LanguageHelper.applySavedLanguage(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        databaseHelper = new SmsLogDatabaseHelper(this);
        usageStatsHelper = new UsageStatsDatabaseHelper(this);

        // Initialize drawer layout
        drawerLayout = findViewById(R.id.drawer_layout);
        navigationDrawer = findViewById(R.id.navigation_drawer);
        setupNavigationDrawer();

        RecyclerView recyclerView = findViewById(R.id.recyclerView);
        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        recyclerView.setLayoutManager(layoutManager);
        smsLogAdapter = new SmsLogAdapter(new ArrayList<>());
        recyclerView.setAdapter(smsLogAdapter);
        
        // إضافة تمرير تلقائي للسجلات
        setupAutoScroll(recyclerView, layoutManager);
        
        reloadLogs();

        // Menu button
        findViewById(R.id.buttonMenu).setOnClickListener(v -> drawerLayout.openDrawer(navigationDrawer));

        findViewById(R.id.buttonTest).setOnClickListener(v -> runTestRequest());
        findViewById(R.id.buttonShowCode).setOnClickListener(v -> showIntegrationCode());
        findViewById(R.id.buttonEditTemplate).setOnClickListener(v -> showEditTemplateDialog());
        findViewById(R.id.buttonClearLogs).setOnClickListener(v -> confirmClearLogs());
        findViewById(R.id.buttonSecuritySettings).setOnClickListener(v -> showSecuritySettings());
        findViewById(R.id.buttonToggleServer).setOnClickListener(v -> toggleServer());
        findViewById(R.id.buttonHealth).setOnClickListener(v -> checkHealth());
        findViewById(R.id.buttonSimStatus).setOnClickListener(v -> showSimStatus());
        findViewById(R.id.buttonCopyEndpoint).setOnClickListener(v -> copyEndpoint());
        findViewById(R.id.buttonSetDefaultSim).setOnClickListener(v -> showSetDefaultSimDialog());
        findViewById(R.id.buttonCopyExamples).setOnClickListener(v -> copyExamples());
        findViewById(R.id.buttonCheckServer).setOnClickListener(v -> checkServerStatusDialog());
        findViewById(R.id.buttonUsageStats).setOnClickListener(v -> showUsageStats());
        findViewById(R.id.buttonBackgroundWork).setOnClickListener(v -> toggleBackgroundWork());
        findViewById(R.id.buttonTestSms).setOnClickListener(v -> testSmsSending());
        findViewById(R.id.buttonAdvancedTest).setOnClickListener(v -> showAdvancedTestDialog());
        
        // WhatsApp Business bindings
        View cardWa = findViewById(R.id.cardWhatsAppStatus);
        if (cardWa != null) {
            cardWa.setOnClickListener(v -> WhatsAppHelper.openAccessibilitySettings(this));
        }
        View btnTestWa = findViewById(R.id.buttonTestWhatsApp);
        if (btnTestWa != null) {
            btnTestWa.setOnClickListener(v -> showTestWhatsAppDialog());
        }
        
        // Initialize backup servers
        initializeBackupServers();
        
        // Request battery optimization exemption
        requestBatteryOptimizationExemption();

        requestPermissionsIfNeeded();
        startServer();
        updateServerStatus();
        updateBackgroundWorkButton();
        updateWhatsAppStatus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        reloadLogs();
        updateBackgroundWorkButton();
        updateWhatsAppStatus();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (smsGatewayServer != null) {
            smsGatewayServer.stop();
        }
    }

    private void reloadLogs() {
        List<SmsLog> logs = databaseHelper.getAllLogs();
        smsLogAdapter.setItems(logs);
        
        // تمرير تلقائي للأعلى عند إعادة تحميل السجلات (لرؤية أحدث الرسائل)
        RecyclerView recyclerView = findViewById(R.id.recyclerView);
        if (recyclerView != null && logs.size() > 0) {
            recyclerView.post(() -> {
                recyclerView.smoothScrollToPosition(0);
            });
        }
        
        android.util.Log.i("MainActivity", "Logs reloaded, count: " + logs.size());
    }

    private void startServer() {
        try {
            if (smsGatewayServer == null) {
                smsGatewayServer = new SmsGatewayServer(this, 8765);
                smsGatewayServer.start();
                Toast.makeText(this, getString(R.string.server_started), Toast.LENGTH_LONG).show();
                // Also start foreground service to keep running reliably if background work is enabled
                android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
                boolean backgroundEnabled = prefs.getBoolean("background_work_enabled", true);
                if (backgroundEnabled) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        startForegroundService(new android.content.Intent(this, SmsGatewayService.class));
                    } else {
                        startService(new android.content.Intent(this, SmsGatewayService.class));
                    }
                }
            }
        } catch (Exception e) {
            Toast.makeText(this, getString(R.string.server_start_failed, e.getMessage()), Toast.LENGTH_LONG).show();
        }
    }

    private void stopServer() {
        try {
            if (smsGatewayServer != null) {
                smsGatewayServer.stop();
                smsGatewayServer = null;
                Toast.makeText(this, getString(R.string.server_stopped), Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, getString(R.string.server_start_failed, e.getMessage()), Toast.LENGTH_LONG).show();
        }
        updateServerStatus();
    }

    private void toggleServer() {
        if (smsGatewayServer == null) {
            startServer();
        } else {
            stopServer();
        }
        updateServerStatus();
    }

    private void requestPermissionsIfNeeded() {
        boolean sendSmsGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean readPhoneStateGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED;
        if (!sendSmsGranted || !readPhoneStateGranted) {
            // These permissions are required for core SMS Gateway functionality only
            // We do not use these permissions for ads or non-core functionality
            ActivityCompat.requestPermissions(this, new String[]{
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.READ_PHONE_STATE
            }, PERMISSION_REQUEST_CODE);
        }
    }
    

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, getString(R.string.permissions_required), Toast.LENGTH_LONG).show();
            }
        }
    }

    private void runTestRequest() {
        AsyncTask.execute(() -> {
            try {
                String responseText = sendTestHttpRequest();
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, responseText, Toast.LENGTH_LONG).show();
                    reloadLogs();
                });
            } catch (Exception e) {
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, getString(R.string.test_request_error, e.getMessage()), Toast.LENGTH_LONG).show());
            }
        });
    }

    private String sendTestHttpRequest() throws Exception {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String token = prefs.getString("api_token", "SECRET123");
        
        // Create list of all servers to try
        java.util.List<String> allServers = new java.util.ArrayList<>();
        String deviceIP = getDeviceIP();
        
        // Add current server
        allServers.add("127.0.0.1");
        allServers.add(deviceIP);
        
        // Add backup servers
        allServers.addAll(backupServers);
        
        for (String serverIP : allServers) {
            try {
                String urlString = "http://" + serverIP + ":8765/send?phone=%2B201234567890&code=123456&sim=1&token=" + token;
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3000);
                conn.setReadTimeout(5000);
                conn.setRequestMethod("GET");
                
                int responseCode = conn.getResponseCode();
                BufferedReader in = new BufferedReader(new InputStreamReader(
                        responseCode >= 200 && responseCode < 400 ? conn.getInputStream() : conn.getErrorStream()
                ));
                
                StringBuilder response = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();
                
                // Update current server if using backup
                if (!serverIP.equals("127.0.0.1") && !serverIP.equals(deviceIP)) {
                    currentServerIP = serverIP;
                    android.util.Log.i("MainActivity", "Switched to backup server: " + serverIP);
                }
                
                return "[" + responseCode + "] " + response + " (via " + serverIP + ")";
            } catch (Exception e) {
                android.util.Log.w("MainActivity", "Failed to connect to " + serverIP, e);
                continue;
            }
        }
        
        throw new Exception("Could not connect to any SMS Gateway server");
    }

    private void showIntegrationCode() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String token = prefs.getString("api_token", "SECRET123");
        String secret = prefs.getString("hmac_secret", "HMACSECRET123");

        // Get device IP address
        String deviceIP = getDeviceIP();
        String base = "http://" + deviceIP + ":8765";
        String localBase = "http://127.0.0.1:8765";
        
        // Check server status
        String serverStatus = checkServerStatus(deviceIP);
        
        // Get backup servers
        java.util.List<String> allServers = new java.util.ArrayList<>();
        allServers.add("127.0.0.1");
        allServers.add(deviceIP);
        allServers.addAll(backupServers);
        
        // GET Request examples
        String getUrl = base + "/send?phone=%2B201234567890&code=123456&sim=1&token=" + token;
        String getCurl = "curl \"" + getUrl + "\"";
        
        // POST Request examples
        String postUrl = base + "/send";
        String postData = "{\"phone\":\"+201234567890\",\"code\":\"123456\",\"sim\":1,\"token\":\"" + token + "\"}";
        String postCurl = "curl -X POST \"" + postUrl + "\" -H \"Content-Type: application/json\" -d '" + postData + "'";
        
        // Backup servers examples
        StringBuilder backupServersList = new StringBuilder();
        for (int i = 0; i < allServers.size(); i++) {
            backupServersList.append("• ").append(i + 1).append(". ").append(allServers.get(i)).append(":8765\n");
        }
        
        // Failover examples
        String failoverJs = generateFailoverJavaScript(allServers, token);
        String failoverPython = generateFailoverPython(allServers, token);
        String failoverPhp = generateFailoverPHP(allServers, token);
        
        // JavaScript examples
        String jsGet = "fetch('" + getUrl + "').then(r => r.json()).then(console.log);";
        
        String jsPost = "fetch('" + postUrl + "', {\n" +
                "  method: 'POST',\n" +
                "  headers: { 'Content-Type': 'application/json' },\n" +
                "  body: '" + postData + "'\n" +
                "}).then(r => r.json()).then(console.log);";
        
        // Python examples
        String pythonGet = "import requests\n" +
                "response = requests.get('" + getUrl + "')\n" +
                "print(response.json())";
        
        String pythonPost = "import requests\n" +
                "data = {\"phone\": \"+201234567890\", \"code\": \"123456\", \"sim\": 1, \"token\": \"" + token + "\"}\n" +
                "response = requests.post('" + postUrl + "', json=data)\n" +
                "print(response.json())";
        
        // PHP examples
        String phpGet = "$url = '" + getUrl + "';\n" +
                "$response = file_get_contents($url);\n" +
                "echo $response;";
        
        String phpPost = "$url = '" + postUrl + "';\n" +
                "$data = json_encode([\"phone\" => \"+201234567890\", \"code\" => \"123456\", \"sim\" => 1, \"token\" => \"" + token + "\"]);\n" +
                "$options = ['http' => ['header' => \"Content-Type: application/json\\r\\n\", 'method' => 'POST', 'content' => $data]];\n" +
                "$response = file_get_contents($url, false, stream_context_create($options));\n" +
                "echo $response;";

        String message = "🔗 أكواد الربط الجاهزة:\n\n" +
                "📱 IP الهاتف: " + deviceIP + "\n" +
                "🔑 الرمز: " + token + "\n" +
                "🖥️ حالة الخادم: " + serverStatus + "\n\n" +
                
                "🔄 الخوادم الاحتياطية:\n" + backupServersList.toString() + "\n" +
                
                "🌐 GET Request:\n" + getUrl + "\n\n" +
                "📤 POST Request:\n" + postUrl + "\n\n" +
                
                "💻 JavaScript (GET):\n" + jsGet + "\n\n" +
                "💻 JavaScript (POST):\n" + jsPost + "\n\n" +
                
                "🔄 JavaScript (Failover):\n" + failoverJs + "\n\n" +
                
                "🐍 Python (GET):\n" + pythonGet + "\n\n" +
                "🐍 Python (POST):\n" + pythonPost + "\n\n" +
                
                "🔄 Python (Failover):\n" + failoverPython + "\n\n" +
                
                "🐘 PHP (GET):\n" + phpGet + "\n\n" +
                "🐘 PHP (POST):\n" + phpPost + "\n\n" +
                
                "🔄 PHP (Failover):\n" + failoverPhp + "\n\n" +
                
                "🔧 cURL (GET):\n" + getCurl + "\n\n" +
                "🔧 cURL (POST):\n" + postCurl + "\n\n" +
                
                "📋 المعاملات:\n" +
                "• phone: رقم الهاتف مع رمز الدولة\n" +
                "• code: كود التفعيل\n" +
                "• sim: رقم الشريحة (1 أو 2)\n" +
                "• token: رمز المصادقة\n\n" +
                
                "✅ الاستجابة الناجحة: {\"status\":\"ok\"}\n" +
                "❌ الاستجابة الفاشلة: {\"status\":\"error\",\"message\":\"...\"}\n\n" +
                
                "💡 نصائح الخوادم الاحتياطية:\n" +
                "• استخدم Failover للاستمرارية\n" +
                "• جرب الخوادم بالترتيب\n" +
                "• أضف خوادم جديدة حسب الحاجة";

        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("🔗 أكواد الربط")
                .setMessage(message)
                .setPositiveButton("📋 نسخ", (dialog, which) -> {
                    android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                    String copyText = "🔗 أكواد الربط - بوابة الرسائل\n\n" +
                            "📱 IP الهاتف: " + deviceIP + "\n" +
                            "🔑 الرمز: " + token + "\n\n" +
                            "🔄 الخوادم الاحتياطية:\n" + backupServersList.toString() + "\n" +
                            "🌐 GET: " + getUrl + "\n\n" +
                            "📤 POST: " + postUrl + "\n\n" +
                            "💻 JavaScript (Failover):\n" + failoverJs + "\n\n" +
                            "🐍 Python (Failover):\n" + failoverPython + "\n\n" +
                            "🐘 PHP (Failover):\n" + failoverPhp;
                    android.content.ClipData clip = android.content.ClipData.newPlainText("integration", copyText);
                    if (cm != null) cm.setPrimaryClip(clip);
                    Toast.makeText(this, "تم نسخ الأكواد مع الخوادم الاحتياطية", Toast.LENGTH_SHORT).show();
                })
                .setNeutralButton("🌐 فتح الدليل", (dialog, which) -> {
                    // Open integration guide
                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                    intent.setData(android.net.Uri.parse("file:///android_asset/INTEGRATION_GUIDE.md"));
                    startActivity(intent);
                })
                .setNegativeButton("إغلاق", null)
                .show();
    }
    
    private String getDeviceIP() {
        try {
            java.util.Enumeration<java.net.NetworkInterface> networkInterfaces = java.net.NetworkInterface.getNetworkInterfaces();
            while (networkInterfaces.hasMoreElements()) {
                java.net.NetworkInterface networkInterface = networkInterfaces.nextElement();
                if (networkInterface.isUp() && !networkInterface.isLoopback()) {
                    java.util.Enumeration<java.net.InetAddress> addresses = networkInterface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        java.net.InetAddress address = addresses.nextElement();
                        if (!address.isLoopbackAddress() && address instanceof java.net.Inet4Address) {
                            String ip = address.getHostAddress();
                            // Prefer WiFi IP addresses (usually start with 192.168 or 10.0)
                            if (ip.startsWith("192.168.") || ip.startsWith("10.0.") || ip.startsWith("172.")) {
                                android.util.Log.d("MainActivity", "Found device IP: " + ip + " on interface: " + networkInterface.getName());
                                return ip;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Could not get device IP", e);
        }
        return "192.168.1.100"; // Default fallback
    }
    
    private String checkServerStatus(String deviceIP) {
        // First check if server object exists
        if (smsGatewayServer == null) {
            return "❌ الخادم غير مفعل - اضغط 'تشغيل الخادم'";
        }
        
        try {
            // Try both local and device IP with /health endpoint (same as checkHealth)
            String[] urls = {
                "http://127.0.0.1:8765/health",
                "http://" + deviceIP + ":8765/health"
            };
            
            for (String urlString : urls) {
                try {
                    java.net.URL url = new java.net.URL(urlString);
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(2000);
                    conn.setReadTimeout(3000);
                    conn.setRequestMethod("GET");
                    
                    int responseCode = conn.getResponseCode();
                    if (responseCode == 200) {
                        return "✅ الخادم يعمل على: " + url.getHost() + ":8765";
                    }
                } catch (Exception e) {
                    android.util.Log.w("MainActivity", "Failed to connect to " + urlString, e);
                    continue;
                }
            }
            return "❌ الخادم مفعل لكن غير متاح على الشبكة - تحقق من الإعدادات";
        } catch (Exception e) {
            return "❌ خطأ في فحص الخادم: " + e.getMessage();
        }
    }
    
    private void checkServerStatusDialog() {
        String deviceIP = getDeviceIP();
        android.os.AsyncTask.execute(() -> {
            String status = checkServerStatus(deviceIP);
            runOnUiThread(() -> showServerStatusDialog(deviceIP, status));
        });
    }

    private void showServerStatusDialog(String deviceIP, String status) {
        
        String message = "🖥️ فحص حالة الخادم:\n\n" +
                "📱 IP الهاتف: " + deviceIP + "\n" +
                "🌐 العنوان المحلي: 127.0.0.1\n" +
                "🔌 المنفذ: 8080\n" +
                "🔗 Endpoint: /health\n\n" +
                "📊 النتيجة:\n" + status + "\n\n" +
                "💡 نصائح:\n" +
                "• تأكد من تفعيل الخدمة\n" +
                "• تحقق من اتصال WiFi\n" +
                "• جرب إعادة تشغيل التطبيق\n\n" +
                "🔧 الإجراءات:\n" +
                "• اضغط 'تشغيل الخادم' إذا كان متوقف\n" +
                "• اضغط 'فحص الصحة' للتحقق من الاتصال";
        
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("فحص حالة الخادم")
                .setMessage(message)
                .setPositiveButton("إعادة فحص", (dialog, which) -> checkServerStatusDialog());
        
        // Add start server button if server is not running
        if (smsGatewayServer == null) {
            builder.setNeutralButton("تشغيل الخادم", (dialog, which) -> {
                startServer();
                updateServerStatus();
                checkServerStatusDialog();
            });
        } else {
            // Add health check button if server is running
            builder.setNeutralButton("فحص الصحة", (dialog, which) -> {
                checkHealth();
                checkServerStatusDialog();
            });
        }
        
        // Add backup servers management button
        builder.setNegativeButton("إدارة الخوادم الاحتياطية", (dialog, which) -> showBackupServersDialog());
        
        // Add check all servers button
        builder.setNeutralButton("فحص جميع الخوادم", (dialog, which) -> checkAllServers());
        
        // Add battery optimization button
        builder.setNegativeButton("إعدادات البطارية", (dialog, which) -> showBatteryOptimizationDialog());
        
        // Add notification settings button
        builder.setNeutralButton("إعدادات الإشعارات", (dialog, which) -> showNotificationSettingsDialog());
        
        builder.show();
    }
    
    private void initializeBackupServers() {
        // Load backup servers from SharedPreferences
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String serversJson = prefs.getString("backup_servers", "[]");
        
        try {
            org.json.JSONArray jsonArray = new org.json.JSONArray(serversJson);
            backupServers.clear();
            for (int i = 0; i < jsonArray.length(); i++) {
                backupServers.add(jsonArray.getString(i));
            }
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Failed to load backup servers", e);
            backupServers.clear();
        }
    }
    
    private void saveBackupServers() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        org.json.JSONArray jsonArray = new org.json.JSONArray();
        for (String server : backupServers) {
            jsonArray.put(server);
        }
        prefs.edit().putString("backup_servers", jsonArray.toString()).apply();
    }
    
    private void showBackupServersDialog() {
        StringBuilder message = new StringBuilder("🔄 إدارة الخوادم الاحتياطية:\n\n");
        message.append("📱 الخادم الحالي: ").append(currentServerIP).append("\n\n");
        message.append("📋 قائمة الخوادم الاحتياطية:\n");
        
        if (backupServers.isEmpty()) {
            message.append("• لا توجد خوادم احتياطية\n");
        } else {
            for (int i = 0; i < backupServers.size(); i++) {
                message.append("• ").append(i + 1).append(". ").append(backupServers.get(i)).append("\n");
            }
        }
        
        message.append("\n💡 نصائح:\n");
        message.append("• أضف IP الهواتف الأخرى\n");
        message.append("• الخادم الأول في القائمة سيتم تجربته أولاً\n");
        message.append("• يمكن إضافة عدة خوادم احتياطية\n");
        
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("الخوادم الاحتياطية")
                .setMessage(message.toString())
                .setPositiveButton("إضافة خادم", (dialog, which) -> showAddBackupServerDialog())
                .setNeutralButton("فحص جميع الخوادم", (dialog, which) -> checkAllServers())
                .setNegativeButton("إزالة خادم", (dialog, which) -> showRemoveBackupServerDialog())
                .show();
    }
    
    private void showAddBackupServerDialog() {
        final android.widget.EditText editText = new android.widget.EditText(this);
        editText.setHint("أدخل IP الخادم الاحتياطي (مثال: 192.168.1.101)");
        editText.setInputType(android.text.InputType.TYPE_CLASS_TEXT);
        
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("إضافة خادم احتياطي")
                .setView(editText)
                .setPositiveButton("إضافة", (dialog, which) -> {
                    String serverIP = editText.getText().toString().trim();
                    if (!serverIP.isEmpty() && !backupServers.contains(serverIP)) {
                        backupServers.add(serverIP);
                        saveBackupServers();
                        Toast.makeText(this, "تم إضافة الخادم: " + serverIP, Toast.LENGTH_SHORT).show();
                    } else if (backupServers.contains(serverIP)) {
                        Toast.makeText(this, "الخادم موجود بالفعل!", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(this, "يرجى إدخال IP صحيح", Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }
    
    private void showRemoveBackupServerDialog() {
        if (backupServers.isEmpty()) {
            Toast.makeText(this, "لا توجد خوادم احتياطية لإزالتها", Toast.LENGTH_SHORT).show();
            return;
        }
        
        String[] servers = backupServers.toArray(new String[0]);
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("إزالة خادم احتياطي")
                .setItems(servers, (dialog, which) -> {
                    String removedServer = backupServers.remove(which);
                    saveBackupServers();
                    Toast.makeText(this, "تم إزالة الخادم: " + removedServer, Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }
    
    private void checkAllServers() {
        AsyncTask.execute(() -> {
            StringBuilder result = new StringBuilder("🔍 فحص جميع الخوادم:\n\n");
            
            // Check current server
            result.append("📱 الخادم الحالي (").append(currentServerIP).append("): ");
            if (checkServerHealth(currentServerIP)) {
                result.append("✅ يعمل\n");
            } else {
                result.append("❌ لا يعمل\n");
            }
            
            // Check backup servers
            if (backupServers.isEmpty()) {
                result.append("\n📋 لا توجد خوادم احتياطية");
            } else {
                result.append("\n📋 الخوادم الاحتياطية:\n");
                for (int i = 0; i < backupServers.size(); i++) {
                    String server = backupServers.get(i);
                    result.append("• ").append(i + 1).append(". ").append(server).append(": ");
                    if (checkServerHealth(server)) {
                        result.append("✅ يعمل\n");
                    } else {
                        result.append("❌ لا يعمل\n");
                    }
                }
            }
            
            runOnUiThread(() -> {
                androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
                builder.setTitle("فحص جميع الخوادم")
                        .setMessage(result.toString())
                        .setPositiveButton("إعادة فحص", (dialog, which) -> checkAllServers())
                        .setNegativeButton("إغلاق", null)
                        .show();
            });
        });
    }
    
    private boolean checkServerHealth(String serverIP) {
        try {
            java.net.URL url = new java.net.URL("http://" + serverIP + ":8765/health");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(3000);
            conn.setRequestMethod("GET");
            
            int responseCode = conn.getResponseCode();
            return responseCode == 200;
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Failed to check server: " + serverIP, e);
            return false;
        }
    }
    
    private void requestBatteryOptimizationExemption() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            try {
                android.content.Intent intent = new android.content.Intent();
                String packageName = getPackageName();
                android.net.Uri uri = android.net.Uri.parse("package:" + packageName);
                intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(uri);
                startActivity(intent);
                android.util.Log.i("MainActivity", "Requested battery optimization exemption");
            } catch (Exception e) {
                android.util.Log.w("MainActivity", "Failed to request battery optimization exemption", e);
            }
        }
    }
    
    private void showBatteryOptimizationDialog() {
        String message = "🔋 إعدادات البطارية:\n\n" +
                "لضمان عمل التطبيق في الخلفية:\n\n" +
                "1. اضغط 'إعدادات البطارية'\n" +
                "2. ابحث عن 'بوابة الرسائل'\n" +
                "3. اختر 'عدم تحسين البطارية'\n" +
                "4. فعّل 'السماح بالعمل في الخلفية'\n\n" +
                "💡 هذا يضمن استمرارية الخدمة";
        
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("إعدادات البطارية")
                .setMessage(message)
                .setPositiveButton("إعدادات البطارية", (dialog, which) -> {
                    openBatterySettings();
                })
                .setNeutralButton("إعادة المحاولة", (dialog, which) -> {
                    requestBatteryOptimizationExemption();
                })
                .setNegativeButton("إغلاق", null)
                .show();
    }
    
    private void openBatterySettings() {
        try {
            android.content.Intent intent = new android.content.Intent();
            intent.setAction(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            startActivity(intent);
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Failed to open battery settings", e);
            // Fallback to app settings
            try {
                android.content.Intent intent = new android.content.Intent();
                intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception e2) {
                android.util.Log.e("MainActivity", "Failed to open app settings", e2);
            }
        }
    }
    
    private String generateFailoverJavaScript(java.util.List<String> servers, String token) {
        StringBuilder js = new StringBuilder();
        js.append("// JavaScript Failover Implementation\n");
        js.append("const servers = [\n");
        for (String server : servers) {
            js.append("  'http://").append(server).append(":8765',\n");
        }
        js.append("];\n\n");
        js.append("async function sendSmsWithFailover(phone, code) {\n");
        js.append("  for (const server of servers) {\n");
        js.append("    try {\n");
        js.append("      const url = `${server}/send?phone=${encodeURIComponent(phone)}&code=${code}&sim=1&token=").append(token).append("`;\n");
        js.append("      const response = await fetch(url);\n");
        js.append("      if (response.ok) {\n");
        js.append("        const result = await response.json();\n");
        js.append("        console.log('Success via:', server, result);\n");
        js.append("        return result;\n");
        js.append("      }\n");
        js.append("    } catch (error) {\n");
        js.append("      console.warn('Failed via:', server, error);\n");
        js.append("    }\n");
        js.append("  }\n");
        js.append("  throw new Error('All servers failed');\n");
        js.append("}\n\n");
        js.append("// Usage: sendSmsWithFailover('+201234567890', '123456');");
        return js.toString();
    }
    
    private String generateFailoverPython(java.util.List<String> servers, String token) {
        StringBuilder python = new StringBuilder();
        python.append("# Python Failover Implementation\n");
        python.append("import requests\n");
        python.append("import time\n\n");
        python.append("servers = [\n");
        for (String server : servers) {
            python.append("    'http://").append(server).append(":8765',\n");
        }
        python.append("]\n\n");
        python.append("def send_sms_with_failover(phone, code):\n");
        python.append("    for server in servers:\n");
        python.append("        try:\n");
        python.append("            url = f'{server}/send?phone={phone}&code={code}&sim=1&token=").append(token).append("'\n");
        python.append("            response = requests.get(url, timeout=5)\n");
        python.append("            if response.status_code == 200:\n");
        python.append("                result = response.json()\n");
        python.append("                print(f'Success via: {server}', result)\n");
        python.append("                return result\n");
        python.append("        except Exception as e:\n");
        python.append("            print(f'Failed via: {server}', e)\n");
        python.append("            continue\n");
        python.append("    raise Exception('All servers failed')\n\n");
        python.append("# Usage: send_sms_with_failover('+201234567890', '123456')");
        return python.toString();
    }
    
    private String generateFailoverPHP(java.util.List<String> servers, String token) {
        StringBuilder php = new StringBuilder();
        php.append("<?php\n");
        php.append("// PHP Failover Implementation\n");
        php.append("$servers = [\n");
        for (String server : servers) {
            php.append("    'http://").append(server).append(":8765',\n");
        }
        php.append("];\n\n");
        php.append("function sendSmsWithFailover($phone, $code) {\n");
        php.append("    global $servers, $token;\n");
        php.append("    $token = '").append(token).append("';\n\n");
        php.append("    foreach ($servers as $server) {\n");
        php.append("        try {\n");
        php.append("            $url = $server . '/send?phone=' . urlencode($phone) . '&code=' . $code . '&sim=1&token=' . $token;\n");
        php.append("            $context = stream_context_create(['http' => ['timeout' => 5]]);\n");
        php.append("            $response = file_get_contents($url, false, $context);\n");
        php.append("            if ($response !== false) {\n");
        php.append("                $result = json_decode($response, true);\n");
        php.append("                echo 'Success via: ' . $server . ' - ' . $response . PHP_EOL;\n");
        php.append("                return $result;\n");
        php.append("            }\n");
        php.append("        } catch (Exception $e) {\n");
        php.append("            echo 'Failed via: ' . $server . ' - ' . $e->getMessage() . PHP_EOL;\n");
        php.append("            continue;\n");
        php.append("        }\n");
        php.append("    }\n");
        php.append("    throw new Exception('All servers failed');\n");
        php.append("}\n\n");
        php.append("// Usage: sendSmsWithFailover('+201234567890', '123456');\n");
        php.append("?>");
        return php.toString();
    }
    
    private void setupAutoScroll(RecyclerView recyclerView, LinearLayoutManager layoutManager) {
        // إعداد التمرير الطبيعي للسجلات
        recyclerView.setNestedScrollingEnabled(true);
        recyclerView.setHasFixedSize(true);
        
        // إضافة مراقب للتغييرات في البيانات
        smsLogAdapter.registerAdapterDataObserver(new RecyclerView.AdapterDataObserver() {
            @Override
            public void onItemRangeInserted(int positionStart, int itemCount) {
                super.onItemRangeInserted(positionStart, itemCount);
                
                // تمرير تلقائي للأعلى عند إضافة عناصر جديدة (لرؤية الرسائل الجديدة)
                if (itemCount > 0) {
                    recyclerView.post(() -> {
                        int lastPosition = smsLogAdapter.getItemCount() - 1;
                        if (lastPosition >= 0) {
                            recyclerView.smoothScrollToPosition(lastPosition);
                        }
                    });
                }
            }
            
            @Override
            public void onItemRangeChanged(int positionStart, int itemCount) {
                super.onItemRangeChanged(positionStart, itemCount);
                
                // تمرير تلقائي عند تحديث العناصر
                if (itemCount > 0) {
                    recyclerView.post(() -> {
                        int lastPosition = smsLogAdapter.getItemCount() - 1;
                        if (lastPosition >= 0) {
                            recyclerView.smoothScrollToPosition(lastPosition);
                        }
                    });
                }
            }
        });
        
        android.util.Log.i("MainActivity", "Natural scrolling setup completed for SMS logs");
    }
    
    private void scrollToTop(RecyclerView recyclerView) {
        // تمرير سريع للأعلى
        recyclerView.post(() -> {
            recyclerView.smoothScrollToPosition(0);
        });
    }
    
    private void scrollToBottom(RecyclerView recyclerView) {
        // تمرير سريع للأسفل
        recyclerView.post(() -> {
            int lastPosition = smsLogAdapter.getItemCount() - 1;
            if (lastPosition >= 0) {
                recyclerView.smoothScrollToPosition(lastPosition);
            }
        });
    }
    
    private void showNotificationSettingsDialog() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        boolean notificationsEnabled = prefs.getBoolean("notifications_enabled", true);
        boolean soundEnabled = prefs.getBoolean("notification_sound", true);
        boolean vibrationEnabled = prefs.getBoolean("notification_vibration", true);
        
        String message = "🔔 إعدادات الإشعارات:\n\n" +
                "📱 الإشعارات: " + (notificationsEnabled ? "مفعلة" : "معطلة") + "\n" +
                "🔊 الصوت: " + (soundEnabled ? "مفعل" : "معطل") + "\n" +
                "📳 الاهتزاز: " + (vibrationEnabled ? "مفعل" : "معطل") + "\n\n" +
                "💡 نصائح:\n" +
                "• الإشعارات تظهر عند إرسال الرسائل\n" +
                "• يمكن تخصيص الصوت من إعدادات الهاتف\n" +
                "• الإشعارات تساعد في مراقبة الخدمة";
        
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("إعدادات الإشعارات")
                .setMessage(message)
                .setPositiveButton("تفعيل الإشعارات", (dialog, which) -> {
                    enableNotifications();
                })
                .setNeutralButton("إعدادات الصوت", (dialog, which) -> {
                    openNotificationSettings();
                })
                .setNegativeButton("إغلاق", null)
                .show();
    }
    
    private void enableNotifications() {
        try {
            // طلب صلاحية الإشعارات
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 2001);
                    return;
                }
            }
            
            // تفعيل الإشعارات
            android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
            prefs.edit()
                .putBoolean("notifications_enabled", true)
                .putBoolean("notification_sound", true)
                .putBoolean("notification_vibration", true)
                .apply();
            
            Toast.makeText(this, "تم تفعيل الإشعارات بنجاح", Toast.LENGTH_SHORT).show();
            
            // اختبار الإشعار
            NotificationHelper notificationHelper = new NotificationHelper(this);
            notificationHelper.showSmsSentNotification("+201234567890", "123456", true);
            
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to enable notifications", e);
            Toast.makeText(this, "فشل في تفعيل الإشعارات", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void openNotificationSettings() {
        try {
            android.content.Intent intent = new android.content.Intent();
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                intent.setAction(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
            } else {
                intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getPackageName()));
            }
            startActivity(intent);
        } catch (Exception e) {
            android.util.Log.w("MainActivity", "Failed to open notification settings", e);
            Toast.makeText(this, "فشل في فتح إعدادات الإشعارات", Toast.LENGTH_SHORT).show();
        }
    }

    private void showEditTemplateDialog() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String current = prefs.getString("activation_template", "رمز التفعيل: {code}");

        final android.widget.EditText editText = new android.widget.EditText(this);
        editText.setText(current);
        editText.setSelection(editText.getText().length());
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        editText.setPadding(pad, pad, pad, pad);

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.edit_template_title))
                .setMessage(getString(R.string.edit_template_hint))
                .setView(editText)
                .setPositiveButton(getString(R.string.save), (d, w) -> {
                    String value = editText.getText().toString();
                    prefs.edit().putString("activation_template", value).apply();
                    Toast.makeText(this, getString(R.string.template_saved), Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }

    private void checkHealth() {
        AsyncTask.execute(() -> {
            try {
                java.net.URL url = new java.net.URL("http://127.0.0.1:8765/health");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(3000);
                conn.setReadTimeout(3000);
                int code = conn.getResponseCode();
                runOnUiThread(() -> {
                    Toast.makeText(this, code == 200 ? getString(R.string.health_check_running) : getString(R.string.health_check_stopped) + " ["+code+"]", Toast.LENGTH_SHORT).show();
                    updateServerStatus();
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    Toast.makeText(this, getString(R.string.health_check_stopped), Toast.LENGTH_SHORT).show();
                    updateServerStatus();
                });
            }
        });
    }

    private void updateServerStatus() {
        android.widget.TextView tv = findViewById(R.id.textServerStatus);
        if (tv == null) return;
        boolean running = smsGatewayServer != null;
        tv.setText(running ? getString(R.string.server_running) : getString(R.string.server_stopped));
        
        // Update toggle button text and color
        android.widget.Button toggleBtn = findViewById(R.id.buttonToggleServer);
        if (toggleBtn != null) {
            if (running) {
                toggleBtn.setText(getString(R.string.stop_server));
                toggleBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this, R.color.accent_red)));
            } else {
                toggleBtn.setText(getString(R.string.start_server));
                toggleBtn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this, R.color.accent_green)));
            }
        }
    }

    private void updateWhatsAppStatus() {
        android.widget.TextView tv = findViewById(R.id.textWhatsAppStatus);
        if (tv == null) return;
        boolean installed = WhatsAppHelper.isWhatsAppInstalled(this);
        boolean enabled = WhatsAppHelper.isAccessibilityServiceEnabled(this);
        
        if (!installed) {
            tv.setText("⚠️ تطبيق WhatsApp Business غير مثبت على هذا الهاتف");
            tv.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
        } else if (enabled) {
            tv.setText("🟢 خدمة الإرسال التلقائي عبر واتساب أعمال: مفعّلة وجاهزة");
            tv.setTextColor(ContextCompat.getColor(this, R.color.accent_green));
        } else {
            tv.setText("⚠️ خدمة الإرسال التلقائي: انقر هنا لتفعيلها في إمكانية الوصول");
            tv.setTextColor(ContextCompat.getColor(this, R.color.accent_orange));
        }
    }

    private void showTestWhatsAppDialog() {
        if (!WhatsAppHelper.isWhatsAppInstalled(this)) {
            Toast.makeText(this, "تطبيق WhatsApp / WhatsApp Business غير مثبت!", Toast.LENGTH_LONG).show();
            return;
        }

        android.widget.EditText inputPhone = new android.widget.EditText(this);
        inputPhone.setHint("مثال: +201127556848");
        inputPhone.setInputType(android.text.InputType.TYPE_CLASS_PHONE);
        inputPhone.setText("+201127556848");

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("💬 اختبار إرسال كود عبر واتساب")
                .setMessage("أدخل رقم الهاتف لاختبار إرسال رمز التحقق عبر واتساب أعمال:")
                .setView(inputPhone)
                .setPositiveButton("إرسال الآن", (dialog, which) -> {
                    String phone = inputPhone.getText().toString().trim();
                    if (!phone.isEmpty()) {
                        String testCode = String.valueOf((int)(100000 + Math.random() * 900000));
                        String message = "رمز تفعيل سوق العرب الخاص بك هو: " + testCode;
                        boolean sent = WhatsAppHelper.sendWhatsAppMessage(this, phone, message);
                        if (sent) {
                            databaseHelper.insertLog(phone, testCode, System.currentTimeMillis(), 0);
                            reloadLogs();
                            Toast.makeText(this, "جاري الإرسال عبر واتساب أعمال...", Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(this, "فشل بدء محادثة واتساب", Toast.LENGTH_LONG).show();
                        }
                    }
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }

    private void showSimStatus() {
        // Check if we have the required permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, getString(R.string.phone_state_permission_required), Toast.LENGTH_LONG).show();
            return;
        }
        
        try {
            android.telephony.SubscriptionManager sm = (android.telephony.SubscriptionManager) getSystemService(android.content.Context.TELEPHONY_SUBSCRIPTION_SERVICE);
            java.util.List<android.telephony.SubscriptionInfo> list = sm != null ? sm.getActiveSubscriptionInfoList() : null;
            StringBuilder sb = new StringBuilder();
            if (list != null && !list.isEmpty()) {
                for (android.telephony.SubscriptionInfo info : list) {
                    sb.append(getString(R.string.sim_info_format, info.getSimSlotIndex()+1, info.getCarrierName(), info.getSubscriptionId())).append("\n");
                }
            } else {
                sb.append(getString(R.string.no_active_sims));
            }
            new androidx.appcompat.app.AlertDialog.Builder(this)
                    .setTitle(getString(R.string.sim_status_title))
                    .setMessage(sb.toString())
                    .setPositiveButton(getString(R.string.ok), null)
                    .show();
        } catch (SecurityException e) {
            Toast.makeText(this, getString(R.string.sim_access_error), Toast.LENGTH_LONG).show();
        } catch (Throwable t) {
            Toast.makeText(this, getString(R.string.sim_status_error), Toast.LENGTH_SHORT).show();
        }
    }

    private void copyEndpoint() {
        String ipOrLocal = "http://<IP-الهاتف-أو-127.0.0.1>:8765/send";
        android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        android.content.ClipData clip = android.content.ClipData.newPlainText("endpoint", ipOrLocal);
        if (cm != null) cm.setPrimaryClip(clip);
        Toast.makeText(this, getString(R.string.endpoint_copied_message), Toast.LENGTH_SHORT).show();
    }

    private void showSetDefaultSimDialog() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        int current = prefs.getInt("default_sim", 1);
        String[] items = new String[]{getString(R.string.sim_1), getString(R.string.sim_2)};
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.set_default_sim_title))
                .setSingleChoiceItems(items, current==2?1:0, null)
                .setPositiveButton(getString(R.string.save), (d, w) -> {
                    androidx.appcompat.app.AlertDialog dlg = (androidx.appcompat.app.AlertDialog) d;
                    int which = dlg.getListView().getCheckedItemPosition();
                    int sim = which==1?2:1;
                    prefs.edit().putInt("default_sim", sim).apply();
                    Toast.makeText(this, getString(R.string.default_sim_set, items[which]), Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }

    @SuppressLint({"SimpleDateFormat", "DefaultLocale"})
    private void showUsageStats() {
        List<ConnectedApp> apps = usageStatsHelper.getAllConnectedApps();
        List<DailyStat> dailyStats = usageStatsHelper.getDailyStats(7);
        List<UsageLog> recentLogs = usageStatsHelper.getRecentUsageLogs(10);
        
        StringBuilder message = new StringBuilder();
        message.append("📊 إحصائيات الاستخدام\n\n");
        
        // Connected Apps
        message.append("🔗 التطبيقات المرتبطة: ").append(apps.size()).append("\n");
        for (ConnectedApp app : apps) {
            String status = app.isActive ? "🟢 نشط" : "🔴 غير نشط";
            message.append("• ").append(app.appName).append(" (").append(app.appIp).append(") ").append(status).append("\n");
            message.append("  الطلبات: ").append(app.totalRequests).append(" | آخر اتصال: ").append(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(new java.util.Date(app.lastConnected))).append("\n");
        }
        
        message.append("\n📈 الإحصائيات اليومية (آخر 7 أيام):\n");
        for (DailyStat stat : dailyStats) {
            double successRate = stat.totalSms > 0 ? (stat.successfulSms * 100.0 / stat.totalSms) : 0;
            message.append("• ").append(stat.date).append(": ").append(stat.totalSms).append(" رسالة (معدل النجاح: ").append(String.format("%.1f", successRate)).append("%)\n");
        }
        
        message.append("\n📋 آخر الطلبات:\n");
        for (UsageLog log : recentLogs) {
            String status = log.success ? "✅" : "❌";
            String time = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date(log.timestamp));
            message.append("• ").append(time).append(" ").append(status).append(" ").append(log.requestType).append(" ").append(log.phone != null ? log.phone : "").append("\n");
        }
        
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("إحصائيات الاستخدام")
                .setMessage(message.toString())
                .setPositiveButton("حسناً", null)
                .show();
    }

    private void copyExamples() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String token = prefs.getString("api_token", "SECRET123");
        String secret = prefs.getString("hmac_secret", "HMACSECRET123");
        
        // Get device IP and backup servers
        String deviceIP = getDeviceIP();
        java.util.List<String> allServers = new java.util.ArrayList<>();
        allServers.add("127.0.0.1");
        allServers.add(deviceIP);
        allServers.addAll(backupServers);
        
        String combined = buildApiExamplesWithFailover(token, secret, allServers);
        
        android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        android.content.ClipData clip = android.content.ClipData.newPlainText("examples", combined);
        if (cm != null) cm.setPrimaryClip(clip);
        Toast.makeText(this, "تم نسخ الأمثلة مع الخوادم الاحتياطية", Toast.LENGTH_SHORT).show();
    }

    private String buildApiExamples(String token, String secret) {
        String base = "http://<IP-الهاتف-أو-127.0.0.1>:8765";
        String qp = "phone=%2B201234567890&code=123456&sim=1&token="+token;
        String getExample = base+"/send?"+qp;
        String curlPost = "TS=$(date +%s)\nBODY='{"+"\"phone\":\"+201234567890\",\"code\":\"123456\",\"sim\":1,\"token\":\""+token+"\"}'\nSIG=$(printf \"%s\\nPOST\\n/send\\n%s\" \"$TS\" \"$BODY\" | openssl dgst -sha256 -hmac \""+secret+"\" -hex | sed 's/^.* //')\n"+
                "curl -X POST \""+base+"/send\" -H \"Content-Type: application/json\" -H \"X-Timestamp: $TS\" -H \"X-Signature: $SIG\" -H \"X-Signature-Alg: HMAC-SHA256\" -d \"$BODY\"";
        return "GET:\n"+getExample+"\n\nPOST (cURL + HMAC):\n"+curlPost;
    }
    
    private String buildApiExamplesWithFailover(String token, String secret, java.util.List<String> servers) {
        StringBuilder examples = new StringBuilder();
        examples.append("🔗 أمثلة API مع الخوادم الاحتياطية\n\n");
        
        // Server list
        examples.append("🔄 قائمة الخوادم:\n");
        for (int i = 0; i < servers.size(); i++) {
            examples.append("• ").append(i + 1).append(". ").append(servers.get(i)).append(":8765\n");
        }
        examples.append("\n");
        
        // Basic examples
        String base = "http://" + servers.get(0) + ":8765";
        String qp = "phone=%2B201234567890&code=123456&sim=1&token=" + token;
        String getExample = base + "/send?" + qp;
        
        examples.append("🌐 GET Request:\n").append(getExample).append("\n\n");
        
        // JavaScript Failover
        examples.append("💻 JavaScript Failover:\n");
        examples.append(generateFailoverJavaScript(servers, token)).append("\n\n");
        
        // Python Failover
        examples.append("🐍 Python Failover:\n");
        examples.append(generateFailoverPython(servers, token)).append("\n\n");
        
        // PHP Failover
        examples.append("🐘 PHP Failover:\n");
        examples.append(generateFailoverPHP(servers, token)).append("\n\n");
        
        // cURL examples
        examples.append("🔧 cURL Examples:\n");
        for (String server : servers) {
            examples.append("curl \"http://").append(server).append(":8765/send?").append(qp).append("\"\n");
        }
        examples.append("\n");
        
        // HMAC example
        String curlPost = "TS=$(date +%s)\nBODY='{\"phone\":\"+201234567890\",\"code\":\"123456\",\"sim\":1,\"token\":\""+token+"\"}'\nSIG=$(printf \"%s\\nPOST\\n/send\\n%s\" \"$TS\" \"$BODY\" | openssl dgst -sha256 -hmac \""+secret+"\" -hex | sed 's/^.* //')\n"+
                "curl -X POST \""+base+"/send\" -H \"Content-Type: application/json\" -H \"X-Timestamp: $TS\" -H \"X-Signature: $SIG\" -H \"X-Signature-Alg: HMAC-SHA256\" -d \"$BODY\"";
        examples.append("🔐 POST with HMAC:\n").append(curlPost).append("\n\n");
        
        examples.append("💡 نصائح:\n");
        examples.append("• استخدم Failover للاستمرارية\n");
        examples.append("• جرب الخوادم بالترتيب\n");
        examples.append("• أضف timeout مناسب\n");
        examples.append("• راقب السجلات للأخطاء");
        
        return examples.toString();
    }

    private void confirmClearLogs() {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.clear_logs_title))
                .setMessage(getString(R.string.clear_logs_message))
                .setPositiveButton(getString(R.string.delete), (d, w) -> {
                    databaseHelper.clearLogs();
                    reloadLogs();
                    Toast.makeText(this, getString(R.string.logs_cleared), Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }

    private void showSecuritySettings() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        String currentToken = prefs.getString("api_token", "SECRET123");
        String currentSecret = prefs.getString("hmac_secret", "HMACSECRET123");

        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        layout.setPadding(pad, pad, pad, pad);

        android.widget.EditText etToken = new android.widget.EditText(this);
        etToken.setHint(getString(R.string.api_token_hint));
        etToken.setText(currentToken);
        layout.addView(etToken);

        android.widget.EditText etSecret = new android.widget.EditText(this);
        etSecret.setHint(getString(R.string.hmac_secret_hint));
        etSecret.setText(currentSecret);
        layout.addView(etSecret);

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.security_settings_title))
                .setView(layout)
                .setPositiveButton(getString(R.string.save), (d, w) -> {
                    String newToken = etToken.getText().toString().trim();
                    String newSecret = etSecret.getText().toString().trim();
                    prefs.edit()
                            .putString("api_token", newToken.isEmpty()?"SECRET123":newToken)
                            .putString("hmac_secret", newSecret.isEmpty()?"HMACSECRET123":newSecret)
                            .apply();
                    Toast.makeText(this, getString(R.string.settings_saved), Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }

    private void setupNavigationDrawer() {
        List<NavigationMenuItem> menuItems = new ArrayList<>();
        
        // Header
        menuItems.add(new NavigationMenuItem(0, getString(R.string.app_name), false, 1));
        
        // Divider
        menuItems.add(new NavigationMenuItem(0, "", false, 2));
        
        // Language
        menuItems.add(new NavigationMenuItem(R.drawable.ic_language, getString(R.string.change_language), true, 0));
        
        // Share
        menuItems.add(new NavigationMenuItem(R.drawable.ic_share, getString(R.string.share_app), true, 0));
        
        // Divider
        menuItems.add(new NavigationMenuItem(0, "", false, 2));
        
        // Scroll to top
        menuItems.add(new NavigationMenuItem(R.drawable.ic_share, "تمرير للأعلى", true, 0));
        
        // Scroll to bottom
        menuItems.add(new NavigationMenuItem(R.drawable.ic_share, "تمرير للأسفل", true, 0));
        
        // Divider
        menuItems.add(new NavigationMenuItem(0, "", false, 2));
        
        // About
        menuItems.add(new NavigationMenuItem(R.drawable.ic_info, getString(R.string.about_app), true, 0));
        
        // Terms
        menuItems.add(new NavigationMenuItem(R.drawable.ic_info, getString(R.string.terms_of_use), true, 0));

        NavigationMenuAdapter navigationAdapter = new NavigationMenuAdapter(menuItems, position -> {
            drawerLayout.closeDrawer(navigationDrawer);
            handleNavigationClick(position);
        });
        
        navigationDrawer.setLayoutManager(new LinearLayoutManager(this));
        navigationDrawer.setAdapter(navigationAdapter);
    }

    private void handleNavigationClick(int position) {
        switch (position) {
            case 2: // Language
                showLanguageDialog();
                break;
            case 3: // Share
                shareApp();
                break;
            case 5: // Scroll to top
                scrollToTop(findViewById(R.id.recyclerView));
                break;
            case 6: // Scroll to bottom
                scrollToBottom(findViewById(R.id.recyclerView));
                break;
            case 8: // About
                showAboutDialog();
                break;
            case 9: // Terms
                showTermsDialog();
                break;
        }
    }

    private void showLanguageDialog() {
        String[] languages = {"العربية", "English"};
        String[] languageCodes = {LanguageHelper.ARABIC, LanguageHelper.ENGLISH};
        String currentLanguage = LanguageHelper.getCurrentLanguage(this);
        
        int selectedIndex = 0;
        for (int i = 0; i < languageCodes.length; i++) {
            if (languageCodes[i].equals(currentLanguage)) {
                selectedIndex = i;
                break;
            }
        }
        
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.change_language))
                .setSingleChoiceItems(languages, selectedIndex, (dialog, which) -> {
                    String selectedLanguageCode = languageCodes[which];
                    if (!selectedLanguageCode.equals(currentLanguage)) {
                        changeLanguage(selectedLanguageCode);
                    }
                    dialog.dismiss();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }
    
    private void changeLanguage(String languageCode) {
        LanguageHelper.setLanguage(this, languageCode);
        
        // Restart activity to apply language change
        recreate();
        
        String languageName = LanguageHelper.getLanguageDisplayName(languageCode);
        Toast.makeText(this, getString(R.string.language_changed, languageName), Toast.LENGTH_SHORT).show();
    }

    private void shareApp() {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, "SMSGateway Pro");
        shareIntent.putExtra(Intent.EXTRA_TEXT, "تحميل تطبيق SMSGateway Pro - بوابة الرسائل الاحترافية\n\n" +
                "مميزات التطبيق:\n" +
                "• إرسال رسائل SMS عبر API\n" +
                "• دعم الشريحتين\n" +
                "• أمان متقدم مع HMAC\n" +
                "• إحصائيات مفصلة\n" +
                "• واجهة احترافية\n\n" +
                "رابط التحميل: [رابط التطبيق]");
        startActivity(Intent.createChooser(shareIntent, getString(R.string.share_app)));
    }

    private void showAboutDialog() {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.about_app))
                .setMessage("SMSGateway Pro v1.0\n\n" +
                        "تطبيق احترافي لإرسال رسائل SMS عبر API\n\n" +
                        "المطور: فريق التطوير\n" +
                        "الإصدار: 1.0\n" +
                        "تاريخ الإصدار: 2024\n\n" +
                        "جميع الحقوق محفوظة © 2024")
                .setPositiveButton("موافق", null)
                .show();
    }

    private void showTermsDialog() {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.terms_of_use))
                .setMessage("شروط استخدام تطبيق SMSGateway Pro:\n\n" +
                        "1. يجب استخدام التطبيق لأغراض مشروعة فقط\n" +
                        "2. لا يُسمح بإرسال رسائل مزعجة أو غير مرغوب فيها\n" +
                        "3. المستخدم مسؤول عن جميع الرسائل المرسلة\n" +
                        "4. يحق للمطور تعديل الشروط في أي وقت\n" +
                        "5. استخدام التطبيق يعني الموافقة على هذه الشروط\n\n" +
                        "للمزيد من التفاصيل، يرجى التواصل معنا.")
                .setPositiveButton("موافق", null)
                .show();
    }

    private void toggleBackgroundWork() {
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        boolean backgroundEnabled = prefs.getBoolean("background_work_enabled", true);
        
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(getString(R.string.background_settings_title))
                .setMessage(getString(R.string.background_settings_message))
                .setPositiveButton(backgroundEnabled ? getString(R.string.disable_background) : getString(R.string.enable_background), (dialog, which) -> {
                    boolean newState = !backgroundEnabled;
                    prefs.edit().putBoolean("background_work_enabled", newState).apply();
                    
                    if (newState) {
                // Enable background work
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    // Justify foreground service usage for Android 14+
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        // This foreground service is essential for maintaining SMS gateway functionality
                        // and ensuring reliable message delivery when the app is in background
                    }
                    startForegroundService(new android.content.Intent(this, SmsGatewayService.class));
                } else {
                    startService(new android.content.Intent(this, SmsGatewayService.class));
                }
                        Toast.makeText(this, getString(R.string.background_enabled), Toast.LENGTH_SHORT).show();
                    } else {
                        // Disable background work
                        stopService(new android.content.Intent(this, SmsGatewayService.class));
                        Toast.makeText(this, getString(R.string.background_disabled), Toast.LENGTH_SHORT).show();
                    }
                    
                    updateBackgroundWorkButton();
                })
                .setNegativeButton(getString(R.string.cancel), null)
                .show();
    }

    private void updateBackgroundWorkButton() {
        android.widget.Button button = findViewById(R.id.buttonBackgroundWork);
        if (button == null) return;
        
        android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
        boolean backgroundEnabled = prefs.getBoolean("background_work_enabled", true);
        
        if (backgroundEnabled) {
            button.setText(getString(R.string.disable_background));
            button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this, R.color.accent_red)));
        } else {
            button.setText(getString(R.string.enable_background));
            button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(ContextCompat.getColor(this, R.color.accent_green)));
        }
    }

    private void testSmsSending() {
        // Check permissions first
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "صلاحية إرسال الرسائل مطلوبة", Toast.LENGTH_LONG).show();
            return;
        }

        // Show dialog to enter phone number
        final android.widget.EditText editText = new android.widget.EditText(this);
        editText.setHint("أدخل رقم الهاتف (مثال: +201234567890)");
        editText.setText("+201234567890");
        
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("اختبار إرسال الرسائل")
                .setMessage("أدخل رقم الهاتف لاختبار إرسال رسالة تجريبية")
                .setView(editText)
                .setPositiveButton("إرسال", (dialog, which) -> {
                    String phone = editText.getText().toString().trim();
                    if (phone.isEmpty()) {
                        Toast.makeText(this, "يرجى إدخال رقم الهاتف", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    
                    // Send test SMS directly
                    AsyncTask.execute(() -> {
                        try {
                            String testCode = String.valueOf((int)(Math.random() * 900000) + 100000);
                            String message = "رسالة تجريبية من SMSGateway: " + testCode;
                            
                            android.telephony.SmsManager smsManager = android.telephony.SmsManager.getDefault();
                            smsManager.sendTextMessage(phone, null, message, null, null);
                            
                            runOnUiThread(() -> {
                                Toast.makeText(this, "تم إرسال الرسالة التجريبية بنجاح إلى: " + phone, Toast.LENGTH_LONG).show();
                                reloadLogs();
                            });
                            
                        } catch (Exception e) {
                            runOnUiThread(() -> {
                                Toast.makeText(this, "فشل في إرسال الرسالة: " + e.getMessage(), Toast.LENGTH_LONG).show();
                            });
                        }
                    });
                })
                .setNegativeButton("إلغاء", null)
                .show();
    }

    private void showAdvancedTestDialog() {
        // Create custom layout for advanced test
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        int padding = (int) (16 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);

        // Phone number input
        android.widget.TextView phoneLabel = new android.widget.TextView(this);
        phoneLabel.setText("رقم الهاتف (مثال: +201234567890):");
        phoneLabel.setTextSize(16);
        phoneLabel.setPadding(0, 0, 0, padding/2);
        layout.addView(phoneLabel);

        final android.widget.EditText phoneInput = new android.widget.EditText(this);
        phoneInput.setHint("أدخل رقم الهاتف الكامل مع رمز الدولة");
        phoneInput.setInputType(android.text.InputType.TYPE_CLASS_PHONE);
        phoneInput.setText("+201234567890");
        layout.addView(phoneInput);

        // Verification code input
        android.widget.TextView codeLabel = new android.widget.TextView(this);
        codeLabel.setText("كود التفعيل:");
        codeLabel.setTextSize(16);
        codeLabel.setPadding(0, padding, 0, padding/2);
        layout.addView(codeLabel);

        final android.widget.EditText codeInput = new android.widget.EditText(this);
        codeInput.setHint("أدخل كود التفعيل");
        codeInput.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        codeInput.setText("123456");
        layout.addView(codeInput);

        // SIM selection
        android.widget.TextView simLabel = new android.widget.TextView(this);
        simLabel.setText("اختر الشريحة:");
        simLabel.setTextSize(16);
        simLabel.setPadding(0, padding, 0, padding/2);
        layout.addView(simLabel);

        final android.widget.Spinner simSpinner = new android.widget.Spinner(this);
        String[] simOptions = {"الشريحة 1", "الشريحة 2", "تلقائي"};
        android.widget.ArrayAdapter<String> adapter = new android.widget.ArrayAdapter<>(this, android.R.layout.simple_spinner_item, simOptions);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        simSpinner.setAdapter(adapter);
        simSpinner.setSelection(2); // Default to "تلقائي"
        layout.addView(simSpinner);

        // Custom message input
        android.widget.TextView messageLabel = new android.widget.TextView(this);
        messageLabel.setText("رسالة مخصصة (اختياري):");
        messageLabel.setTextSize(16);
        messageLabel.setPadding(0, padding, 0, padding/2);
        layout.addView(messageLabel);

        final android.widget.EditText messageInput = new android.widget.EditText(this);
        messageInput.setHint("اتركه فارغاً لاستخدام القالب الافتراضي");
        messageInput.setMaxLines(3);
        layout.addView(messageInput);

        // Progress bar
        final android.widget.ProgressBar progressBar = new android.widget.ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setVisibility(android.view.View.GONE);
        layout.addView(progressBar);

        // Status text
        final android.widget.TextView statusText = new android.widget.TextView(this);
        statusText.setText("");
        statusText.setTextColor(ContextCompat.getColor(this, R.color.accent_green));
        layout.addView(statusText);

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("اختبار متقدم - إرسال رسالة حقيقية")
                .setMessage("أدخل التفاصيل لإرسال رسالة SMS حقيقية")
                .setView(layout)
                .setPositiveButton("إرسال الرسالة", (dialog, which) -> {
                    String phone = phoneInput.getText().toString().trim();
                    String code = codeInput.getText().toString().trim();
                    int simSelection = simSpinner.getSelectedItemPosition();
                    String customMessage = messageInput.getText().toString().trim();

                    if (phone.isEmpty() || code.isEmpty()) {
                        Toast.makeText(this, "يرجى إدخال رقم الهاتف والكود", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    // Validate phone number format
                    if (!phone.startsWith("+")) {
                        Toast.makeText(this, "يرجى إدخال رقم الهاتف مع رمز الدولة (مثال: +201234567890)", Toast.LENGTH_LONG).show();
                        return;
                    }

                    // Show progress
                    progressBar.setVisibility(android.view.View.VISIBLE);
                    statusText.setText("جاري الإرسال...");
                    statusText.setTextColor(ContextCompat.getColor(this, R.color.accent_orange));

                    // Check permissions first
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                        runOnUiThread(() -> {
                            Toast.makeText(this, "صلاحية إرسال الرسائل مطلوبة", Toast.LENGTH_LONG).show();
                        });
                        return;
                    }
                    
                    // Simple SMS check
                    android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) getSystemService(android.content.Context.TELEPHONY_SERVICE);
                    if (tm == null || tm.getSimState() != android.telephony.TelephonyManager.SIM_STATE_READY) {
                        runOnUiThread(() -> {
                            Toast.makeText(this, "لا توجد شريحة SIM نشطة", Toast.LENGTH_LONG).show();
                        });
                        return;
                    }

                    // Send SMS in background
                    AsyncTask.execute(() -> {
                        try {
                            int sim = (simSelection == 2) ? 0 : simSelection + 1; // 0 = auto, 1 = SIM1, 2 = SIM2
                            
                            // Use custom message if provided, otherwise use template
                            String message;
                            if (!customMessage.isEmpty()) {
                                message = customMessage;
                            } else {
                                android.content.SharedPreferences prefs = getSharedPreferences("sms_gateway_prefs", MODE_PRIVATE);
                                String template = prefs.getString("activation_template", "رمز التفعيل: {code}");
                                message = template.replace("{code}", code);
                            }

                            // Check SIM availability first
                            android.telephony.SubscriptionManager sm = (android.telephony.SubscriptionManager) getSystemService(android.content.Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                            java.util.List<android.telephony.SubscriptionInfo> activeSubs = sm != null ? sm.getActiveSubscriptionInfoList() : null;
                            android.util.Log.d("AdvancedTest", "Active SIMs: " + (activeSubs != null ? activeSubs.size() : 0));
                            
                            if (activeSubs == null || activeSubs.isEmpty()) {
                                throw new Exception("لا توجد شريحة SIM نشطة");
                            }
                            
                            // Simple SMS sending
                            android.telephony.SmsManager smsManager;
                            if (sim == 0) {
                                smsManager = android.telephony.SmsManager.getDefault();
                            } else {
                                try {
                                    smsManager = android.telephony.SmsManager.getSmsManagerForSubscriptionId(sim - 1);
                                } catch (Exception e) {
                                    smsManager = android.telephony.SmsManager.getDefault();
                                }
                            }

                            android.util.Log.d("AdvancedTest", "Sending SMS to: " + phone + " with message: " + message);
                            
                            // Create delivery status receivers
                            android.app.PendingIntent sentIntent = android.app.PendingIntent.getBroadcast(
                                this, 0, new android.content.Intent("SMS_SENT"), 
                                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                            );
                            
                            android.app.PendingIntent deliveredIntent = android.app.PendingIntent.getBroadcast(
                                this, 0, new android.content.Intent("SMS_DELIVERED"), 
                                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                            );
                            
                            smsManager.sendTextMessage(phone, null, message, sentIntent, deliveredIntent);
                            android.util.Log.d("AdvancedTest", "SMS sent successfully to: " + phone);

                            // Log success
                            SmsLogDatabaseHelper db = new SmsLogDatabaseHelper(this);
                            db.insertLog(phone, code, System.currentTimeMillis(), sim == 0 ? 1 : sim);
                            android.util.Log.d("AdvancedTest", "SMS logged to database");

                            runOnUiThread(() -> {
                                progressBar.setVisibility(android.view.View.GONE);
                                statusText.setText("✅ تم إرسال الرسالة بنجاح إلى: " + phone);
                                statusText.setTextColor(ContextCompat.getColor(this, R.color.accent_green));
                                reloadLogs();
                                
                                // Show success toast
                                Toast.makeText(this, "تم إرسال الرسالة بنجاح!", Toast.LENGTH_LONG).show();
                            });

                        } catch (Exception e) {
                            runOnUiThread(() -> {
                                progressBar.setVisibility(android.view.View.GONE);
                                statusText.setText("❌ فشل في إرسال الرسالة: " + e.getMessage());
                                statusText.setTextColor(ContextCompat.getColor(this, R.color.accent_red));
                                
                                // Show error toast
                                Toast.makeText(this, "فشل في إرسال الرسالة: " + e.getMessage(), Toast.LENGTH_LONG).show();
                            });
                        }
                    });
                })
                .setNegativeButton("إلغاء", null)
                .setNeutralButton("اختبار سريع", (dialog, which) -> {
                    // Quick test with default values
                    phoneInput.setText("+201234567890");
                    codeInput.setText(String.valueOf((int)(Math.random() * 900000) + 100000));
                    simSpinner.setSelection(2);
                    messageInput.setText("");
                })
                .show();
    }
}



package com.example.myapplication;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

public class UsageStatsDatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME = "usage_stats.db";
    private static final int DB_VERSION = 1;

    private static final String TABLE_CONNECTED_APPS = "connected_apps";
    private static final String TABLE_USAGE_LOGS = "usage_logs";
    private static final String TABLE_DAILY_STATS = "daily_stats";

    // Connected Apps columns
    private static final String COL_APP_ID = "app_id";
    private static final String COL_APP_NAME = "app_name";
    private static final String COL_APP_IP = "app_ip";
    private static final String COL_FIRST_CONNECTED = "first_connected";
    private static final String COL_LAST_CONNECTED = "last_connected";
    private static final String COL_TOTAL_REQUESTS = "total_requests";
    private static final String COL_IS_ACTIVE = "is_active";

    // Usage Logs columns
    private static final String COL_LOG_ID = "log_id";
    private static final String COL_TIMESTAMP = "timestamp";
    private static final String COL_APP_ID_FK = "app_id_fk";
    private static final String COL_REQUEST_TYPE = "request_type";
    private static final String COL_PHONE = "phone";
    private static final String COL_SUCCESS = "success";
    private static final String COL_RESPONSE_TIME = "response_time";

    // Daily Stats columns
    private static final String COL_DATE = "date";
    private static final String COL_TOTAL_SMS = "total_sms";
    private static final String COL_SUCCESSFUL_SMS = "successful_sms";
    private static final String COL_FAILED_SMS = "failed_sms";
    private static final String COL_UNIQUE_APPS = "unique_apps";

    public UsageStatsDatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // Connected Apps table
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_CONNECTED_APPS + " (" +
                COL_APP_ID + " TEXT PRIMARY KEY, " +
                COL_APP_NAME + " TEXT NOT NULL, " +
                COL_APP_IP + " TEXT NOT NULL, " +
                COL_FIRST_CONNECTED + " INTEGER NOT NULL, " +
                COL_LAST_CONNECTED + " INTEGER NOT NULL, " +
                COL_TOTAL_REQUESTS + " INTEGER DEFAULT 0, " +
                COL_IS_ACTIVE + " INTEGER DEFAULT 1" +
                ")");

        // Usage Logs table
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_USAGE_LOGS + " (" +
                COL_LOG_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COL_TIMESTAMP + " INTEGER NOT NULL, " +
                COL_APP_ID_FK + " TEXT NOT NULL, " +
                COL_REQUEST_TYPE + " TEXT NOT NULL, " +
                COL_PHONE + " TEXT, " +
                COL_SUCCESS + " INTEGER NOT NULL, " +
                COL_RESPONSE_TIME + " INTEGER DEFAULT 0, " +
                "FOREIGN KEY(" + COL_APP_ID_FK + ") REFERENCES " + TABLE_CONNECTED_APPS + "(" + COL_APP_ID + ")" +
                ")");

        // Daily Stats table
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_DAILY_STATS + " (" +
                COL_DATE + " TEXT PRIMARY KEY, " +
                COL_TOTAL_SMS + " INTEGER DEFAULT 0, " +
                COL_SUCCESSFUL_SMS + " INTEGER DEFAULT 0, " +
                COL_FAILED_SMS + " INTEGER DEFAULT 0, " +
                COL_UNIQUE_APPS + " INTEGER DEFAULT 0" +
                ")");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USAGE_LOGS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_CONNECTED_APPS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_DAILY_STATS);
        onCreate(db);
    }

    // Connected Apps methods
    public void recordAppConnection(String appId, String appName, String appIp) {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        
        ContentValues values = new ContentValues();
        values.put(COL_APP_ID, appId);
        values.put(COL_APP_NAME, appName);
        values.put(COL_APP_IP, appIp);
        values.put(COL_FIRST_CONNECTED, now);
        values.put(COL_LAST_CONNECTED, now);
        values.put(COL_TOTAL_REQUESTS, 1);
        values.put(COL_IS_ACTIVE, 1);
        
        db.insertWithOnConflict(TABLE_CONNECTED_APPS, null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public void updateAppLastSeen(String appId) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_LAST_CONNECTED, System.currentTimeMillis());
        values.put(COL_IS_ACTIVE, 1);
        db.update(TABLE_CONNECTED_APPS, values, COL_APP_ID + "=?", new String[]{appId});
    }

    public void incrementAppRequests(String appId) {
        SQLiteDatabase db = getWritableDatabase();
        db.execSQL("UPDATE " + TABLE_CONNECTED_APPS + " SET " + COL_TOTAL_REQUESTS + " = " + COL_TOTAL_REQUESTS + " + 1 WHERE " + COL_APP_ID + " = ?", new String[]{appId});
    }

    public List<ConnectedApp> getAllConnectedApps() {
        List<ConnectedApp> apps = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.query(TABLE_CONNECTED_APPS, null, null, null, null, null, COL_LAST_CONNECTED + " DESC");
        
        try {
            int idxAppId = c.getColumnIndexOrThrow(COL_APP_ID);
            int idxAppName = c.getColumnIndexOrThrow(COL_APP_NAME);
            int idxAppIp = c.getColumnIndexOrThrow(COL_APP_IP);
            int idxFirstConnected = c.getColumnIndexOrThrow(COL_FIRST_CONNECTED);
            int idxLastConnected = c.getColumnIndexOrThrow(COL_LAST_CONNECTED);
            int idxTotalRequests = c.getColumnIndexOrThrow(COL_TOTAL_REQUESTS);
            int idxIsActive = c.getColumnIndexOrThrow(COL_IS_ACTIVE);
            
            while (c.moveToNext()) {
                String appId = c.getString(idxAppId);
                String appName = c.getString(idxAppName);
                String appIp = c.getString(idxAppIp);
                long firstConnected = c.getLong(idxFirstConnected);
                long lastConnected = c.getLong(idxLastConnected);
                int totalRequests = c.getInt(idxTotalRequests);
                boolean isActive = c.getInt(idxIsActive) == 1;
                
                apps.add(new ConnectedApp(appId, appName, appIp, firstConnected, lastConnected, totalRequests, isActive));
            }
        } finally {
            if (c != null) c.close();
        }
        return apps;
    }

    // Usage Logs methods
    public void logUsage(String appId, String requestType, String phone, boolean success, long responseTime) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_TIMESTAMP, System.currentTimeMillis());
        values.put(COL_APP_ID_FK, appId);
        values.put(COL_REQUEST_TYPE, requestType);
        values.put(COL_PHONE, phone);
        values.put(COL_SUCCESS, success ? 1 : 0);
        values.put(COL_RESPONSE_TIME, responseTime);
        db.insert(TABLE_USAGE_LOGS, null, values);
    }

    public List<UsageLog> getRecentUsageLogs(int limit) {
        List<UsageLog> logs = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.query(TABLE_USAGE_LOGS, null, null, null, null, null, COL_TIMESTAMP + " DESC", String.valueOf(limit));
        
        try {
            int idxLogId = c.getColumnIndexOrThrow(COL_LOG_ID);
            int idxTimestamp = c.getColumnIndexOrThrow(COL_TIMESTAMP);
            int idxAppIdFk = c.getColumnIndexOrThrow(COL_APP_ID_FK);
            int idxRequestType = c.getColumnIndexOrThrow(COL_REQUEST_TYPE);
            int idxPhone = c.getColumnIndexOrThrow(COL_PHONE);
            int idxSuccess = c.getColumnIndexOrThrow(COL_SUCCESS);
            int idxResponseTime = c.getColumnIndexOrThrow(COL_RESPONSE_TIME);
            
            while (c.moveToNext()) {
                long logId = c.getLong(idxLogId);
                long timestamp = c.getLong(idxTimestamp);
                String appIdFk = c.getString(idxAppIdFk);
                String requestType = c.getString(idxRequestType);
                String phone = c.getString(idxPhone);
                boolean success = c.getInt(idxSuccess) == 1;
                long responseTime = c.getLong(idxResponseTime);
                
                logs.add(new UsageLog(logId, timestamp, appIdFk, requestType, phone, success, responseTime));
            }
        } finally {
            if (c != null) c.close();
        }
        return logs;
    }

    // Daily Stats methods
    public void updateDailyStats(boolean success) {
        String today = java.text.DateFormat.getDateInstance().format(new java.util.Date());
        SQLiteDatabase db = getWritableDatabase();
        
        // Check if record exists for today
        Cursor c = db.query(TABLE_DAILY_STATS, new String[]{COL_DATE}, COL_DATE + "=?", new String[]{today}, null, null, null);
        boolean exists = c.moveToFirst();
        c.close();
        
        ContentValues values = new ContentValues();
        if (!exists) {
            values.put(COL_DATE, today);
            values.put(COL_TOTAL_SMS, 1);
            values.put(COL_SUCCESSFUL_SMS, success ? 1 : 0);
            values.put(COL_FAILED_SMS, success ? 0 : 1);
            values.put(COL_UNIQUE_APPS, 1);
            db.insert(TABLE_DAILY_STATS, null, values);
        } else {
            db.execSQL("UPDATE " + TABLE_DAILY_STATS + " SET " + COL_TOTAL_SMS + " = " + COL_TOTAL_SMS + " + 1 WHERE " + COL_DATE + " = ?", new String[]{today});
            if (success) {
                db.execSQL("UPDATE " + TABLE_DAILY_STATS + " SET " + COL_SUCCESSFUL_SMS + " = " + COL_SUCCESSFUL_SMS + " + 1 WHERE " + COL_DATE + " = ?", new String[]{today});
            } else {
                db.execSQL("UPDATE " + TABLE_DAILY_STATS + " SET " + COL_FAILED_SMS + " = " + COL_FAILED_SMS + " + 1 WHERE " + COL_DATE + " = ?", new String[]{today});
            }
        }
    }

    public List<DailyStat> getDailyStats(int days) {
        List<DailyStat> stats = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.query(TABLE_DAILY_STATS, null, null, null, null, null, COL_DATE + " DESC", String.valueOf(days));
        
        try {
            int idxDate = c.getColumnIndexOrThrow(COL_DATE);
            int idxTotalSms = c.getColumnIndexOrThrow(COL_TOTAL_SMS);
            int idxSuccessfulSms = c.getColumnIndexOrThrow(COL_SUCCESSFUL_SMS);
            int idxFailedSms = c.getColumnIndexOrThrow(COL_FAILED_SMS);
            int idxUniqueApps = c.getColumnIndexOrThrow(COL_UNIQUE_APPS);
            
            while (c.moveToNext()) {
                String date = c.getString(idxDate);
                int totalSms = c.getInt(idxTotalSms);
                int successfulSms = c.getInt(idxSuccessfulSms);
                int failedSms = c.getInt(idxFailedSms);
                int uniqueApps = c.getInt(idxUniqueApps);
                
                stats.add(new DailyStat(date, totalSms, successfulSms, failedSms, uniqueApps));
            }
        } finally {
            if (c != null) c.close();
        }
        return stats;
    }
}

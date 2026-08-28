package com.example.myapplication;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

public class SmsLogDatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME = "sms_gateway.db";
    private static final int DB_VERSION = 2;

    private static final String TABLE_LOGS = "sms_logs";
    private static final String COL_ID = "id";
    private static final String COL_PHONE = "phone";
    private static final String COL_CODE = "code";
    private static final String COL_SENT_AT = "sent_at";
    private static final String COL_SIM = "sim";

    public SmsLogDatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_LOGS + " (" +
                COL_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COL_PHONE + " TEXT NOT NULL, " +
                COL_CODE + " TEXT NOT NULL, " +
                COL_SENT_AT + " INTEGER NOT NULL, " +
                COL_SIM + " INTEGER NOT NULL" +
                ")");
        db.execSQL("CREATE TABLE IF NOT EXISTS idempotency (" +
                "key TEXT PRIMARY KEY, " +
                "created_at INTEGER NOT NULL" +
                ")");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            db.execSQL("CREATE TABLE IF NOT EXISTS idempotency (" +
                    "key TEXT PRIMARY KEY, " +
                    "created_at INTEGER NOT NULL" +
                    ")");
        }
    }

    public long insertLog(String phone, String code, long sentAt, int sim) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_PHONE, phone);
        values.put(COL_CODE, code);
        values.put(COL_SENT_AT, sentAt);
        values.put(COL_SIM, sim);
        return db.insert(TABLE_LOGS, null, values);
    }

    public List<SmsLog> getAllLogs() {
        List<SmsLog> logs = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.query(TABLE_LOGS, null, null, null, null, null, COL_SENT_AT + " DESC");
        try {
            int idxId = c.getColumnIndexOrThrow(COL_ID);
            int idxPhone = c.getColumnIndexOrThrow(COL_PHONE);
            int idxCode = c.getColumnIndexOrThrow(COL_CODE);
            int idxSentAt = c.getColumnIndexOrThrow(COL_SENT_AT);
            int idxSim = c.getColumnIndexOrThrow(COL_SIM);
            while (c.moveToNext()) {
                long id = c.getLong(idxId);
                String phone = c.getString(idxPhone);
                String code = c.getString(idxCode);
                long sentAt = c.getLong(idxSentAt);
                int sim = c.getInt(idxSim);
                logs.add(new SmsLog(id, phone, code, sentAt, sim));
            }
        } finally {
            if (c != null) c.close();
        }
        return logs;
    }

    public void clearLogs() {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_LOGS, null, null);
    }

    public boolean isIdempotencyProcessed(String key) {
        if (key == null) return false;
        SQLiteDatabase db = getReadableDatabase();
        Cursor c = db.query("idempotency", new String[]{"key"}, "key=?", new String[]{key}, null, null, null);
        try {
            return c.moveToFirst();
        } finally {
            if (c != null) c.close();
        }
    }

    public void markIdempotencyProcessed(String key) {
        if (key == null) return;
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("key", key);
        values.put("created_at", System.currentTimeMillis());
        db.insertWithOnConflict("idempotency", null, values, SQLiteDatabase.CONFLICT_IGNORE);
    }
}



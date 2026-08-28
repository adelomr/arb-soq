package com.example.myapplication;

public class UsageLog {
    public long logId;
    public long timestamp;
    public String appId;
    public String requestType;
    public String phone;
    public boolean success;
    public long responseTime;

    public UsageLog(long logId, long timestamp, String appId, String requestType, String phone, boolean success, long responseTime) {
        this.logId = logId;
        this.timestamp = timestamp;
        this.appId = appId;
        this.requestType = requestType;
        this.phone = phone;
        this.success = success;
        this.responseTime = responseTime;
    }
}

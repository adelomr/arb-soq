package com.example.myapplication;

public class ConnectedApp {
    public String appId;
    public String appName;
    public String appIp;
    public long firstConnected;
    public long lastConnected;
    public int totalRequests;
    public boolean isActive;

    public ConnectedApp(String appId, String appName, String appIp, long firstConnected, long lastConnected, int totalRequests, boolean isActive) {
        this.appId = appId;
        this.appName = appName;
        this.appIp = appIp;
        this.firstConnected = firstConnected;
        this.lastConnected = lastConnected;
        this.totalRequests = totalRequests;
        this.isActive = isActive;
    }
}

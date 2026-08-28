package com.example.myapplication;

public class DailyStat {
    public String date;
    public int totalSms;
    public int successfulSms;
    public int failedSms;
    public int uniqueApps;

    public DailyStat(String date, int totalSms, int successfulSms, int failedSms, int uniqueApps) {
        this.date = date;
        this.totalSms = totalSms;
        this.successfulSms = successfulSms;
        this.failedSms = failedSms;
        this.uniqueApps = uniqueApps;
    }
}

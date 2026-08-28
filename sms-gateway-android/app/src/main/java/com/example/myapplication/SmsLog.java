package com.example.myapplication;

public class SmsLog {
    public long id;
    public String phone;
    public String code;
    public long sentAt;
    public int sim;

    public SmsLog(long id, String phone, String code, long sentAt, int sim) {
        this.id = id;
        this.phone = phone;
        this.code = code;
        this.sentAt = sentAt;
        this.sim = sim;
    }
}



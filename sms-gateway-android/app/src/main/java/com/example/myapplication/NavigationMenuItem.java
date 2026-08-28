package com.example.myapplication;

public class NavigationMenuItem {
    private int icon;
    private String title;
    private boolean hasArrow;
    private int type; // 0: normal, 1: header, 2: divider

    public NavigationMenuItem(int icon, String title, boolean hasArrow, int type) {
        this.icon = icon;
        this.title = title;
        this.hasArrow = hasArrow;
        this.type = type;
    }

    public int getIcon() {
        return icon;
    }

    public void setIcon(int icon) {
        this.icon = icon;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isHasArrow() {
        return hasArrow;
    }

    public void setHasArrow(boolean hasArrow) {
        this.hasArrow = hasArrow;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }
}

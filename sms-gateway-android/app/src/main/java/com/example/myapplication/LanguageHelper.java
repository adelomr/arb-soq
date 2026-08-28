package com.example.myapplication;

import android.content.Context;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import java.util.Locale;

public class LanguageHelper {
    
    public static final String PREF_LANGUAGE = "app_language";
    public static final String ARABIC = "ar";
    public static final String ENGLISH = "en";
    
    public static void setLanguage(Context context, String languageCode) {
        Locale locale = new Locale(languageCode);
        Locale.setDefault(locale);
        
        Resources resources = context.getResources();
        Configuration config = resources.getConfiguration();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            config.setLocale(locale);
        } else {
            config.locale = locale;
        }
        
        resources.updateConfiguration(config, resources.getDisplayMetrics());
        
        // Save language preference
        context.getSharedPreferences("sms_gateway_prefs", Context.MODE_PRIVATE)
                .edit()
                .putString(PREF_LANGUAGE, languageCode)
                .apply();
    }
    
    public static String getCurrentLanguage(Context context) {
        return context.getSharedPreferences("sms_gateway_prefs", Context.MODE_PRIVATE)
                .getString(PREF_LANGUAGE, ARABIC);
    }
    
    public static void applySavedLanguage(Context context) {
        String savedLanguage = getCurrentLanguage(context);
        setLanguage(context, savedLanguage);
    }
    
    public static String getLanguageDisplayName(String languageCode) {
        switch (languageCode) {
            case ARABIC:
                return "العربية";
            case ENGLISH:
                return "English";
            default:
                return "العربية";
        }
    }
}

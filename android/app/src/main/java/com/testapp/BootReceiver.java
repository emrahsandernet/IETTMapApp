package com.testapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String ACTION_QUICKBOOT_POWERON = "android.intent.action.QUICKBOOT_POWERON";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null && 
            (intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED) ||
             intent.getAction().equals(ACTION_QUICKBOOT_POWERON) ||
             intent.getAction().equals("com.htc.intent.action.QUICKBOOT_POWERON"))) {
            
            Log.d(TAG, "Cihaz başlatıldı, servis kontrol ediliyor");
            
            // Biraz gecikme ekle (sistemin tam yüklenmesi için)
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                // SharedPreferences'ten servis durumunu kontrol et
                SharedPreferences prefs = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE);
                boolean shouldStartService = prefs.getBoolean("foreground_service_enabled", false);
                
                if (shouldStartService) {
                    Log.d(TAG, "Servis başlatılacak");
                    
                    try {
                        // SMS Servisi başlat
                        Intent smsServiceIntent = new Intent(context, SmsService.class);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(smsServiceIntent);
                        } else {
                            context.startService(smsServiceIntent);
                        }
                        
                        Log.d(TAG, "SMS servisi başlatıldı");
                        
                        // BackgroundFetch servisi için React Native uygulama aktivitesini başlat
                        Intent launchIntent = new Intent(context, MainActivity.class);
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(launchIntent);
                        
                        Log.d(TAG, "Ana uygulama başlatıldı");
                    } catch (Exception e) {
                        Log.e(TAG, "Servis başlatma hatası: " + e.getMessage());
                    }
                } else {
                    Log.d(TAG, "Servis otomatik başlatılmayacak");
                }
            }, 10000); // 10 saniye gecikme
        }
    }
} 
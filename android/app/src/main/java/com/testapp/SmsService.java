package com.testapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Objects;

public class SmsService extends Service {
    private static final String TAG = "SmsService";
    private static final String CHANNEL_ID = "ForegroundServiceChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private BroadcastReceiver smsReceiver;
    private PowerManager.WakeLock wakeLock;
    private boolean isServiceRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SMS Servis oluşturuluyor");
        
        // Wake lock oluştur
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SmsService::WakeLock");
        
        // SMS alıcıyı kaydet
        registerSmsReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "SMS Servis başlatılıyor");
        
        // Notification kanalı oluştur
        createNotificationChannel();
        
        // Foreground servisi başlat
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Wake lock'u aktifleştir
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
        }
        
        isServiceRunning = true;
        Log.d(TAG, "SMS Servis başlatıldı ve çalışıyor");
        
        // Intent ile gönderilen SMS verilerini kontrol et
        if (intent != null && intent.getExtras() != null) {
            String sender = intent.getStringExtra("sender");
            String body = intent.getStringExtra("body");
            
            if (sender != null && body != null) {
                // Gelen SMS'i React Native'e gönder
                sendSmsToReactNative(sender, body, System.currentTimeMillis());
                Log.d(TAG, "Intent ile gelen SMS işlendi - Gönderen: " + sender + ", Mesaj: " + body);
            }
        }
        
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "SMS Servis durduruluyor");
        
        // SMS alıcıyı kaldır
        if (smsReceiver != null) {
            try {
                unregisterReceiver(smsReceiver);
            } catch (Exception e) {
                Log.e(TAG, "SMS alıcı kaldırılırken hata: " + e.getMessage());
            }
        }
        
        // Wake lock'u serbest bırak
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        isServiceRunning = false;
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * SMS alıcıyı kaydet
     */
    private void registerSmsReceiver() {
        try {
            IntentFilter filter = new IntentFilter();
            filter.addAction("android.provider.Telephony.SMS_RECEIVED");
            
            smsReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (Objects.equals(intent.getAction(), "android.provider.Telephony.SMS_RECEIVED")) {
                        processSmsMessage(intent);
                    }
                }
            };
            
            registerReceiver(smsReceiver, filter);
            Log.d(TAG, "SMS alıcı kaydedildi");
        } catch (Exception e) {
            Log.e(TAG, "SMS alıcı kaydedilirken hata: " + e.getMessage());
        }
    }

    /**
     * SMS mesajını işle
     */
    private void processSmsMessage(Intent intent) {
        try {
            Object[] pdus = (Object[]) intent.getExtras().get("pdus");
            String format = intent.getExtras().getString("format");
            
            if (pdus != null) {
                for (Object pdu : pdus) {
                    SmsMessage smsMessage;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                    } else {
                        smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                    }
                    
                    String sender = smsMessage.getOriginatingAddress();
                    String message = smsMessage.getMessageBody();
                    long timestamp = smsMessage.getTimestampMillis();
                    
                    Log.d(TAG, "SMS alındı - Gönderen: " + sender + ", Mesaj: " + message);
                    
                    // React Native'e SMS bilgilerini gönder
                    sendSmsToReactNative(sender, message, timestamp);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "SMS işlenirken hata: " + e.getMessage());
        }
    }

    /**
     * React Native'e SMS bilgilerini gönder
     */
    private void sendSmsToReactNative(String sender, String message, long timestamp) {
        try {
            ReactInstanceManager reactInstanceManager = ((ReactApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
            
            if (reactContext != null) {
                WritableMap params = Arguments.createMap();
                params.putString("sender", sender);
                params.putString("message", message);
                params.putDouble("timestamp", timestamp);
                
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("SmsReceived", params);
                
                Log.d(TAG, "SMS bilgileri React Native'e gönderildi");
            } else {
                Log.d(TAG, "React context null, SMS bilgileri gönderilemedi");
            }
        } catch (Exception e) {
            Log.e(TAG, "SMS bilgileri React Native'e gönderilirken hata: " + e.getMessage());
        }
    }

    /**
     * Notification kanalı oluştur (Android 8.0+)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }

    /**
     * Notification oluştur
     */
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SMS Servisi")
                .setContentText("SMS servisi çalışıyor...")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .build();
    }
    
    /**
     * Servisin çalışıp çalışmadığını kontrol et
     */
    public static boolean isServiceRunning(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE);
        return prefs.getBoolean("foreground_service_enabled", false);
    }
} 
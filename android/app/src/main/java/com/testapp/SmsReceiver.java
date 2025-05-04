package com.testapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static String lastProcessedMessageId = "";
    private static long lastMessageTime = 0;

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "SMS alındı");
        
        if (intent.getAction() != null && intent.getAction().equals("android.provider.Telephony.SMS_RECEIVED")) {
            // Servisin çalışıp çalışmadığını kontrol et
            SharedPreferences prefs = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE);
            boolean isServiceEnabled = prefs.getBoolean("foreground_service_enabled", false);
            
            if (!isServiceEnabled) {
                Log.d(TAG, "SMS servisi devre dışı, işlem yapılmayacak");
                return;
            }
            
            // SMS verilerini al
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                try {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    String format = bundle.getString("format");
                    
                    if (pdus != null) {
                        // SMS'i işle
                        SmsMessage[] messages = new SmsMessage[pdus.length];
                        
                        for (int i = 0; i < pdus.length; i++) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i], format);
                            } else {
                                messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
                            }
                        }
                        
                        // Bir önceki mesajın işlenme zamanını kontrol et
                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastMessageTime < 3000) { // 3 saniye içinde gelen aynı mesajı işleme
                            Log.d(TAG, "Son 3 saniye içinde bir mesaj işlendi, bu mesaj atlanıyor");
                            return;
                        }
                        
                        // Servisi başlat ve SMS verisini ilet
                        startSmsService(context, messages);
                        
                        // Son işlenen mesaj zamanını güncelle
                        lastMessageTime = currentTime;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "SMS alınırken hata: " + e.getMessage());
                }
            }
        }
    }
    
    private void startSmsService(Context context, SmsMessage[] messages) {
        try {
            // Servisi başlat
            Intent serviceIntent = new Intent(context, SmsService.class);
            
            // İlk mesajın bilgilerini intent'e ekle
            if (messages.length > 0) {
                SmsMessage sms = messages[0];
                String sender = sms.getOriginatingAddress();
                String body = sms.getMessageBody();
                
                // Mesaj ID'si oluştur ve kontrol et (aynı mesajı tekrar işlememek için)
                String messageId = sender + ":" + body;
                if (messageId.equals(lastProcessedMessageId)) {
                    Log.d(TAG, "Bu mesaj zaten işlendi, atlanıyor");
                    return;
                }
                lastProcessedMessageId = messageId;
                
                Log.d(TAG, "SMS bilgileri - Gönderen: " + sender + ", Mesaj: " + body);
                
                serviceIntent.putExtra("sender", sender);
                serviceIntent.putExtra("body", body);
            }
            
            // Android 8.0+ için foreground servisi başlat
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "SMS servisi başlatıldı");
        } catch (Exception e) {
            Log.e(TAG, "SMS servisi başlatılırken hata: " + e.getMessage());
        }
    }
} 
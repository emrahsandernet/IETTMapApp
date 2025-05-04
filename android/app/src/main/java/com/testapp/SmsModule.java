package com.testapp;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class SmsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "SmsModule";
    private final ReactApplicationContext reactContext;

    public SmsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SmsModule";
    }

    /**
     * SMS servisini başlatır
     */
    @ReactMethod
    public void startSmsService(Promise promise) {
        try {
            // SharedPreferences'a servisi etkinleştirdiğimizi kaydet
            SharedPreferences prefs = reactContext.getSharedPreferences("app_settings", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean("foreground_service_enabled", true);
            editor.apply();
            
            // SMS Servisini başlat
            Intent serviceIntent = new Intent(reactContext, SmsService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            
            Log.d(TAG, "SMS servisi başlatıldı");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "SMS servisi başlatılırken hata: " + e.getMessage());
            promise.reject("ERROR_START_SERVICE", e.getMessage());
        }
    }

    /**
     * SMS servisini durdurur
     */
    @ReactMethod
    public void stopSmsService(Promise promise) {
        try {
            // SharedPreferences'ta servisi devre dışı bıraktığımızı kaydet
            SharedPreferences prefs = reactContext.getSharedPreferences("app_settings", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putBoolean("foreground_service_enabled", false);
            editor.apply();
            
            // SMS Servisini durdur
            Intent serviceIntent = new Intent(reactContext, SmsService.class);
            reactContext.stopService(serviceIntent);
            
            Log.d(TAG, "SMS servisi durduruldu");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "SMS servisi durdurulurken hata: " + e.getMessage());
            promise.reject("ERROR_STOP_SERVICE", e.getMessage());
        }
    }

    /**
     * SMS servisinin durumunu kontrol eder
     */
    @ReactMethod
    public void isSmsServiceRunning(Promise promise) {
        try {
            boolean isRunning = SmsService.isServiceRunning(reactContext);
            promise.resolve(isRunning);
        } catch (Exception e) {
            Log.e(TAG, "SMS servisi durumu kontrol edilirken hata: " + e.getMessage());
            promise.reject("ERROR_CHECK_SERVICE", e.getMessage());
        }
    }

    /**
     * Test amaçlı bir SMS olayı gönderir
     */
    @ReactMethod
    public void emitTestSmsEvent(String sender, String message, Promise promise) {
        try {
            WritableMap params = Arguments.createMap();
            params.putString("sender", sender);
            params.putString("message", message);
            params.putDouble("timestamp", System.currentTimeMillis());
            
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("SmsReceived", params);
            
            Log.d(TAG, "Test SMS olayı gönderildi");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Test SMS olayı gönderilirken hata: " + e.getMessage());
            promise.reject("ERROR_EMIT_EVENT", e.getMessage());
        }
    }
} 
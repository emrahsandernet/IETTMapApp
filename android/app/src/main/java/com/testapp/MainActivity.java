package com.testapp;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Bundle;
import android.content.SharedPreferences;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import android.util.Log;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class MainActivity extends ReactActivity {
  private static final String TAG = "MainActivity";

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "testApp";
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
    
    // SharedPreferences'ten servis durumunu kontrol et ve kaydet
    checkAndSaveServiceState();
    
    // Pil optimizasyonlarını devre dışı bırakmak için izin iste
    requestBatteryOptimizationPermission();
    
    // SMS servisini başlat (eğer etkinse)
    startSmsServiceIfEnabled();
  }
  
  /**
   * Servis durumunu kontrol eder ve SharedPreferences'a kaydeder
   */
  private void checkAndSaveServiceState() {
    try {
      SharedPreferences prefs = getSharedPreferences("app_settings", Context.MODE_PRIVATE);
      SharedPreferences appStorage = getSharedPreferences("RN_STORAGE_FOREGROUNDSERVICE", Context.MODE_PRIVATE);
      
      if (appStorage.contains("FOREGROUNDSERVICE")) {
        String serviceData = appStorage.getString("FOREGROUNDSERVICE", "");
        if (serviceData.contains("\"foregroundService\":true")) {
          // React Native storage'da servis aktif ise, bunu SharedPreferences'a kaydet
          SharedPreferences.Editor editor = prefs.edit();
          editor.putBoolean("foreground_service_enabled", true);
          editor.apply();
          Log.d(TAG, "Service enabled in SharedPreferences");
        } else {
          // React Native storage'da servis deaktif ise, bunu SharedPreferences'a kaydet
          SharedPreferences.Editor editor = prefs.edit();
          editor.putBoolean("foreground_service_enabled", false);
          editor.apply();
          Log.d(TAG, "Service disabled in SharedPreferences");
        }
      }
    } catch (Exception e) {
      Log.e(TAG, "Error in checkAndSaveServiceState: " + e.getMessage());
    }
  }
  
  /**
   * SMS servisini başlatır (eğer etkinse)
   */
  private void startSmsServiceIfEnabled() {
    try {
      SharedPreferences prefs = getSharedPreferences("app_settings", Context.MODE_PRIVATE);
      boolean serviceEnabled = prefs.getBoolean("foreground_service_enabled", false);
      
      if (serviceEnabled) {
        Log.d(TAG, "Starting SMS service");
        Intent serviceIntent = new Intent(this, SmsService.class);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          startForegroundService(serviceIntent);
        } else {
          startService(serviceIntent);
        }
      }
    } catch (Exception e) {
      Log.e(TAG, "Error starting SMS service: " + e.getMessage());
    }
  }
  
  /**
   * Pil optimizasyonlarını devre dışı bırakmak için izin ister
   */
  private void requestBatteryOptimizationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      try {
        String packageName = getPackageName();
        if (!Settings.canDrawOverlays(this)) {
          Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, 
            Uri.parse("package:" + packageName));
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          startActivity(intent);
        }
        
        if (!Settings.System.canWrite(this)) {
          Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, 
            Uri.parse("package:" + packageName));
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          startActivity(intent);
        }
      } catch (Exception e) {
        Log.e(TAG, "Error requesting permissions: " + e.getMessage());
      }
    }
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }
}

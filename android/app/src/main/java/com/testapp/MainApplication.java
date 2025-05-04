package com.testapp;

import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.multidex.MultiDexApplication;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.util.Arrays;
import com.oblador.vectoricons.VectorIconsPackage;

public class MainApplication extends MultiDexApplication implements ReactApplication {
  private static final String TAG = "MainApplication";
  private static Context appContext;

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          packages.add(new SharedPreferencesPackage());
          packages.add(new SmsPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    appContext = getApplicationContext();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we enable the TurboModule system
      DefaultNewArchitectureEntryPoint.getFabricEnabled();
    }
    
    // React Native'den ayarları kontrol et
    checkSettingsFromReactNative();
    
    // SMS servisini başlat (eğer etkinse)
    startSmsServiceIfEnabled();
  }

  @Override
  protected void attachBaseContext(Context base) {
    super.attachBaseContext(base);
    // MultiDex'i başlat
    androidx.multidex.MultiDex.install(this);
  }

  /**
   * React Native'den ayarları kontrol eder
   */
  private void checkSettingsFromReactNative() {
    try {
      SharedPreferences appStorage = getSharedPreferences("RN_STORAGE_FOREGROUNDSERVICE", Context.MODE_PRIVATE);
      SharedPreferences prefs = getSharedPreferences("app_settings", Context.MODE_PRIVATE);
      
      if (appStorage.contains("FOREGROUNDSERVICE")) {
        String serviceData = appStorage.getString("FOREGROUNDSERVICE", "");
        if (serviceData.contains("\"foregroundService\":true")) {
          // React Native storage'da servis aktif ise, bunu SharedPreferences'a kaydet
          SharedPreferences.Editor editor = prefs.edit();
          editor.putBoolean("foreground_service_enabled", true);
          editor.apply();
          Log.d(TAG, "Service enabled in SharedPreferences from MainApplication");
        } else {
          // React Native storage'da servis deaktif ise, bunu SharedPreferences'a kaydet
          SharedPreferences.Editor editor = prefs.edit();
          editor.putBoolean("foreground_service_enabled", false);
          editor.apply();
          Log.d(TAG, "Service disabled in SharedPreferences from MainApplication");
        }
      }
    } catch (Exception e) {
      Log.e(TAG, "Error checking settings from React Native: " + e.getMessage());
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
        Log.d(TAG, "Starting SMS service from MainApplication");
        Intent serviceIntent = new Intent(this, SmsService.class);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          startForegroundService(serviceIntent);
        } else {
          startService(serviceIntent);
        }
      }
    } catch (Exception e) {
      Log.e(TAG, "Error starting SMS service from MainApplication: " + e.getMessage());
    }
  }

  /**
   * Uygulama context'ini döndürür
   */
  public static Context getAppContext() {
    return appContext;
  }
}

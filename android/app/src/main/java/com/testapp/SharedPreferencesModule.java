package com.testapp;

import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class SharedPreferencesModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String PREFERENCES_NAME = "app_settings";

    public SharedPreferencesModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SharedPreferences";
    }

    @ReactMethod
    public void setBooleanItem(String key, Boolean value, Promise promise) {
        try {
            SharedPreferences sharedPreferences = reactContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putBoolean(key, value);
            editor.apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }

    @ReactMethod
    public void getBooleanItem(String key, Promise promise) {
        try {
            SharedPreferences sharedPreferences = reactContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
            boolean value = sharedPreferences.getBoolean(key, false);
            promise.resolve(value);
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }

    @ReactMethod
    public void setStringItem(String key, String value, Promise promise) {
        try {
            SharedPreferences sharedPreferences = reactContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(key, value);
            editor.apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }

    @ReactMethod
    public void getStringItem(String key, Promise promise) {
        try {
            SharedPreferences sharedPreferences = reactContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
            String value = sharedPreferences.getString(key, "");
            promise.resolve(value);
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }
} 
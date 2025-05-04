import React, {useEffect, useState, useRef} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {PermissionsAndroid, NativeModules, NativeEventEmitter, Platform, ToastAndroid} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import Settings from './pages/Settings';
import QrScreen from './pages/QrScreen';
import Company from './pages/Company';
import Help from './pages/Help';
import HelpParent from './pages/HelpParent';
import LoginScreen from './auth/LoginScreen';

import storage from './storage/storage';
import {jwtDecode} from 'jwt-decode';
import {decode} from 'base-64';
import BackgroundFetch from 'react-native-background-fetch';
import SmsAndroid from 'react-native-get-sms-android';
import {api} from './api/api';
import SmsListener from 'react-native-android-sms-listener';
import SmsService from './SmsService';

global.atob = decode;
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// SMS izinlerini iste
const requestReadSmsPermission = async () => {
  try {
    const smsPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
      title: 'SMS İzin',
      message: 'Uygulama, SMS okuma izni gerektiriyor.',
    });
    
    const receiveSmsPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS İzin',
        message: 'Uygulama, SMS alma izni gerektiriyor.',
      },
    );
    
    const notificationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Bildirim İzin',
        message: 'Uygulama, Bildirim izni gerektiriyor.',
      },
    );
    
    return (
      smsPermission === PermissionsAndroid.RESULTS.GRANTED &&
      receiveSmsPermission === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('Error requesting permissions:', err);
    return false;
  }
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [backgroundServiceRunning, setBackgroundServiceRunning] = useState(false);
  const smsListenerRef = useRef(null);
  const smsServiceListenerRef = useRef(null);
  
  // İşlenen mesajları takip etmek için cache
  const processedMessagesRef = useRef(new Map());
  
  // Cache temizleme fonksiyonu - 10 dakika sonra temizleyelim
  const cleanupProcessedMessages = () => {
    const currentTime = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;
    
    const processedMessages = processedMessagesRef.current;
    for (const [key, timestamp] of processedMessages.entries()) {
      if (currentTime - timestamp > TEN_MINUTES) {
        processedMessages.delete(key);
      }
    }
  };

  // SMS'leri işleme
  const processSmsMessage = async (message) => {
    try {
      console.log('[App] SMS Alındı:', message);
      const { originatingAddress, body } = message;
      // Eğer gönderici veya mesaj içeriği yoksa işleme
      if (!originatingAddress || !body) {
        const sender = message.sender || message.originatingAddress;
        const messageBody = message.message || message.body;
        
        if (sender && messageBody) {
          // Farklı formattaki mesajları işle
          return processSmsMessage({
            originatingAddress: sender,
            body: messageBody
          });
        }
        return;
      }
      
      // Mesaj işlendiyse tekrar işleme
      const messageKey = `${originatingAddress}:${body}`;
      if (processedMessagesRef.current.has(messageKey)) {
        console.log('[App] Bu mesaj zaten işlendi, atlanıyor');
        return;
      }
      
      // Mesajı işlenmiş olarak işaretle
      processedMessagesRef.current.set(messageKey, Date.now());
      
      // 10 dakikada bir cache temizliği yap
      cleanupProcessedMessages();
      
      // Storage'dan şirket listesini al
      const data = await storage.load({key: 'companyListData'});
      
      if (data && data.length > 0) {
        // Uygun şirketi bul
        const matchingCompany = data.find(item => 
          item.smsLabel === originatingAddress
        );
        
        if (matchingCompany) {
          const username = matchingCompany.text;
          console.log(`[App] Eşleşme bulundu: ${username}, Mesaj: ${body}`);
          
          // Sunucuya gönder
          await api.post('/api/send-sms-code', {
            username,
            body,
          });
          
          console.log('[App] Mesaj sunucuya gönderildi');
          if (Platform.OS === 'android') {
            ToastAndroid.show('Mesaj sunucuya gönderildi', ToastAndroid.SHORT);
          }
        }
      }
    } catch (error) {
      console.error('[App] SMS işleme hatası:', error);
    }
  };

  // SMS dinleyiciyi başlatma
  const startSmsListener = async () => {
    try {
      // İzinleri kontrol et
      const hasPermission = await requestReadSmsPermission();
      if (!hasPermission) {
        console.error('[App] SMS izinleri reddedildi');
        return false;
      }
      
      // Önceki dinleyiciyi temizle
      if (smsListenerRef.current) {
        smsListenerRef.current.remove();
        smsListenerRef.current = null;
      }
      
      // Yeni dinleyici oluştur
      smsListenerRef.current = SmsListener.addListener(message => {
        console.log('[App] SMS dinleyiciden mesaj alındı:', message);
        processSmsMessage(message);
      });
      
      console.log('[App] SMS dinleyici başlatıldı');
      return true;
    } catch (error) {
      console.error('[App] SMS dinleyici başlatma hatası:', error);
      return false;
    }
  };
  
  // SMS dinleyiciyi durdurma
  const stopSmsListener = () => {
    try {
      if (smsListenerRef.current) {
        smsListenerRef.current.remove();
        smsListenerRef.current = null;
        console.log('[App] SMS dinleyici durduruldu');
      }
      
      if (smsServiceListenerRef.current) {
        smsServiceListenerRef.current.remove();
        smsServiceListenerRef.current = null;
        console.log('[App] SMS servis dinleyici durduruldu');
      }
    } catch (error) {
      console.error('[App] SMS dinleyici durdurma hatası:', error);
    }
  };

  // Arkaplan servisi başlatma
  const startBackgroundService = async () => {
    try {
      // SMS izinlerini iste
      await requestReadSmsPermission();
      
      // BackgroundFetch durumunu kontrol et
      const status = await BackgroundFetch.status();
      
      if (status !== BackgroundFetch.STATUS_AVAILABLE) {
        // Eğer servis hazır değilse yeniden yapılandır
        const newStatus = await BackgroundFetch.configure({
          minimumFetchInterval: 15, // 15 dakikada bir çalış (minimum değer) 
          stopOnTerminate: false,    // Uygulama kapatıldığında devam et
          startOnBoot: true,         // Cihaz açıldığında başla
          enableHeadless: true,      // Headless görevleri etkinleştir
          forceAlarmManager: true,   // Daha güvenilir zamanlama için
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // Herhangi bir ağda çalış
        }, 
        async (taskId) => {
          console.log('[BackgroundFetch] Task received in foreground:', taskId);
          // Task bitince tamamla
          BackgroundFetch.finish(taskId);
        }, 
        (taskId) => {
          console.warn('[BackgroundFetch] TIMEOUT task:', taskId);
          BackgroundFetch.finish(taskId);
        });
        
        console.log('[BackgroundFetch] Configured with status:', newStatus);
      }
      
      // Schedule extra task for now to ensure it's working
      await BackgroundFetch.scheduleTask({
        taskId: 'com.sigortavip.smstask',
        delay: 1000,  // 1 saniye sonra çalıştır (hemen başlaması için)
        forceAlarmManager: true
      });
      
      console.log('[BackgroundFetch] Service started and task scheduled');
      
      // Yeni SmsService kullanımı
      const nativeSmsServiceStarted = await SmsService.startService();
      console.log('[App] Native SMS servisi başlatıldı:', nativeSmsServiceStarted);
      
      // Önceki servis dinleyicisini temizle
      if (smsServiceListenerRef.current) {
        smsServiceListenerRef.current.remove();
        smsServiceListenerRef.current = null;
      }
      
      // SMS olaylarını dinle
      smsServiceListenerRef.current = SmsService.onSmsReceived(message => {
        console.log('[App] Native SMS servisten mesaj alındı:', message);
        processSmsMessage(message);
      });
      
      // SMS dinleyiciyi başlat (yedek olarak eski listener'ı da tutuyoruz)
      await startSmsListener();
      
      // Durum bilgisini güncelle
      setBackgroundServiceRunning(true);
      
      // Storage'a kaydet
      try {
        await storage.save({
          key: 'foregroundService',
          data: {
            foregroundService: true,
          },
        });
        console.log('Service state saved to storage');
      } catch (error) {
        console.error('Failed to save service state:', error);
      }
      
      // Native SharedPreferences'a kaydet
      try {
        const SharedPreferences = NativeModules.SharedPreferences;
        if (SharedPreferences) {
          await SharedPreferences.setBooleanItem("foreground_service_enabled", true);
          console.log('Service state saved to SharedPreferences');
        }
      } catch (e) {
        console.log('Could not access native SharedPreferences module:', e);
      }
      
      // Son mesajları kontrol et
      checkRecentMessages();
      
      return true;
    } catch (e) {
      console.error('Failed to start background service:', e);
      return false;
    }
  };
  
  // Son mesajları kontrol et
  const checkRecentMessages = () => {
    try {
      let filter = {
        box: 'inbox',
        minDate: new Date().getTime() - 10 * 1000, // Son 10 saniyedeki mesajlar
        indexFrom: 0,
        maxCount: 5,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        fail => console.log('Failed with error:', fail),
        (count, smsList) => {
          if (count > 0) {
            console.log('Son mesajlar kontrol ediliyor:', count);
            const arr = JSON.parse(smsList);
            
            arr.forEach(sms => {
              processSmsMessage({
                originatingAddress: sms.address,
                body: sms.body
              });
            });
          }
        }
      );
    } catch (error) {
      console.error('Son mesajları kontrol ederken hata:', error);
    }
  };

  // Arkaplan servisini durdur
  const stopBackgroundService = async () => {
    try {
      // BackgroundFetch'i durdur
      await BackgroundFetch.stop();
      
      // Yeni SmsService kullanımı
      const nativeSmsServiceStopped = await SmsService.stopService();
      console.log('[App] Native SMS servisi durduruldu:', nativeSmsServiceStopped);
      
      // SMS dinleyiciyi durdur
      stopSmsListener();
      
      // Durum bilgisini güncelle
      setBackgroundServiceRunning(false);
      
      // Storage'a kaydet
      try {
        await storage.save({
          key: 'foregroundService',
          data: {
            foregroundService: false,
          },
        });
      } catch (error) {
        console.error('Failed to save service stop state:', error);
      }
      
      // Native SharedPreferences'a kaydet
      try {
        const SharedPreferences = NativeModules.SharedPreferences;
        if (SharedPreferences) {
          await SharedPreferences.setBooleanItem("foreground_service_enabled", false);
        }
      } catch (e) {
        console.log('Could not access native SharedPreferences module:', e);
      }
      
      return true;
    } catch (e) {
      console.error('Failed to stop background service:', e);
      return false;
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        await storage.load({key: 'loginState'}).then(ret => {
          console.log('ret', ret);
          if (ret.isLoggedIn === false) {
            setIsLoggedIn(false);
            console.log('ret 2', ret);
          } else if (ret.isLoggedIn === true) {
            setIsLoggedIn(ret.isLoggedIn);
            setToken(ret.token);
            const decoded = jwtDecode(ret.token);
            setUserData(decoded);
          }
        });
      } catch (err) {
        console.log('err', err);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
    
    // Servis durumunu kontrol et
    storage.load({key: 'foregroundService'})
      .then(data => {
        if (data && data.foregroundService) {
          console.log('Background service should be running, starting it');
          startBackgroundService();
        }
      })
      .catch(() => {
        console.log('Foreground service settings not found, initializing...');
      });
      
    // Çıkış temizliği
    return () => {
      // Kapanırken servisi durdurmayı engelle - arkaplanda devam etsin
      console.log('App component unmounting, background service continues');
    };
  }, []);

  // Company sayfasına geçirilecek props
  const companyScreenProps = {
    startBackgroundService,
    stopBackgroundService,
    backgroundServiceRunning
  };

  const RenderMainApp = () => (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Anasayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Ayarlar') {
            iconName = focused ? 'settings-sharp' : 'settings-outline';
          } else if (route.name === 'QR') {
            iconName = focused ? 'qr-code-sharp' : 'qr-code-outline';
          } else if (route.name === 'Destek') {
            iconName = focused ? 'help-circle-sharp' : 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen 
        name="Anasayfa" 
        options={{ title: 'Anasayfa' }}
      >
        {props => <Company 
          {...props} 
          startBackgroundService={startBackgroundService}
          stopBackgroundService={stopBackgroundService} 
          backgroundServiceRunning={backgroundServiceRunning}
        />}
      </Tab.Screen>
      <Tab.Screen name="QR" component={QrScreen} />
      <Tab.Screen name="Destek" component={HelpParent} />

      {userData && userData.isAdmin && (
        <Tab.Screen name="Ayarlar" component={Settings} />
      )}
    </Tab.Navigator>
  );

  if (isLoggedIn === null) {
    // You may want to render a loading indicator here while checking the login status
    return null;
  }

  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Giriş Yap" component={LoginScreen} />
          <Stack.Screen
            name="Anasayfa"
            component={RenderMainApp}
            options={{headerShown: false}}
            {...(token && {initialParams: {token: token}})}
          />
          <Stack.Screen name="Destek1" component={Help} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Anasayfa 1"
          component={RenderMainApp}
          options={{headerShown: false}}
          {...(token && {initialParams: {token: token}})}
        />
        <Stack.Screen name="Giriş Yap" component={LoginScreen} />

        <Stack.Screen name="Destek Talebi" component={Help} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

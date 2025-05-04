/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { enableScreens } from 'react-native-screens';
import BackgroundFetch from 'react-native-background-fetch';
import SmsAndroid from 'react-native-get-sms-android';
import storage from './storage/storage';
import { api } from './api/api';
import SmsListener from 'react-native-android-sms-listener';

// Enable native screens implementation
enableScreens();

// SMS işleme fonksiyonu
const processSmsMessage = async (message) => {
  try {
    console.log('[Background] SMS Alındı:', message);
    const { originatingAddress, body } = message;
    
    // Storage'dan şirket listesini al
    const data = await storage.load({key: 'companyListData'});
    
    if (data && data.length > 0) {
      // Uygun şirketi bul
      const matchingCompany = data.find(item => 
        item.smsLabel === originatingAddress
      );
      
      if (matchingCompany) {
        const username = matchingCompany.text;
        console.log(`[Background] Eşleşme bulundu: ${username}, Mesaj: ${body}`);
        
        // Sunucuya gönder
        await api.post('/api/send-sms-code', {
          username,
          body,
        });
        
        console.log('[Background] Mesaj sunucuya gönderildi');
      } else {
        console.log('[Background] Tanımlı şirket bulunamadı:', originatingAddress);
      }
    } else {
      console.log('[Background] Tanımlı şirket yok');
    }
  } catch (error) {
    console.error('[Background] SMS işleme hatası:', error);
  }
};

// Headless task for background fetch
const headlessTask = async (event) => {
  // Retrieve taskId from event
  const { taskId } = event;

  console.log('[BackgroundFetch] Headless task started:', taskId);

  try {
    // Headless task içinde SMS dinleme
    let filter = {
      box: 'inbox',
      minDate: new Date().getTime() - 5 * 1000, // Son 5 saniyedeki SMS'leri al
      indexFrom: 0,
      maxCount: 10,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail) => console.log('Failed with error:', fail),
      (count, smsList) => {
        if (count > 0) {
          console.log('New messages detected in background:', count);
          const arr = JSON.parse(smsList);

          arr.forEach(message => {
            processSmsMessage({
              originatingAddress: message.address,
              body: message.body
            });
          });
        }
      },
    );
  } catch (error) {
    console.error('[BackgroundFetch] Error in headless task:', error);
  }

  // Görevi tamamla
  BackgroundFetch.finish(taskId);
};

// SMS dinleyici başlatma
let globalSmsListener = null;

const startGlobalSmsListener = async () => {
  try {
    // Önceki dinleyiciyi temizle
    if (globalSmsListener) {
      globalSmsListener.remove();
      globalSmsListener = null;
    }
    
    // Yeni dinleyici oluştur
    globalSmsListener = SmsListener.addListener(message => {
      console.log('[Global] SMS Alındı:', message);
      processSmsMessage(message);
    });
    
    console.log('[Global] SMS dinleyici başlatıldı');
  } catch (error) {
    console.error('[Global] SMS dinleyici hatası:', error);
  }
};

// Servis durumunu kontrol et ve buna göre başlat
storage.load({key: 'foregroundService'})
  .then(data => {
    if (data && data.foregroundService) {
      // SMS dinleyiciyi başlat
      startGlobalSmsListener();
      console.log('[Global] Önceki servis durumuna göre SMS dinleyici başlatıldı');
    }
  })
  .catch(err => {
    console.log('[Global] Servis durumu kontrol edilemedi:', err);
  });

// Background fetch servisi konfigürasyonu
const configureBackgroundFetch = async () => {
  try {
    // BackgroundFetch'i yapılandır
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // 15 dakikada bir çalış (minimum değer)
        stopOnTerminate: false,    // Uygulama kapatıldığında devam et
        startOnBoot: true,         // Cihaz açıldığında başla 
        enableHeadless: true,      // Headless görevleri etkinleştir
        forceAlarmManager: true,   // Daha güvenilir zamanlama için
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // Herhangi bir ağda çalış
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Task received:', taskId);
        
        // Headless task ile aynı kodu çağır
        await headlessTask({taskId});
      },
      (taskId) => {
        // Zaman aşımı (maksimum 30s)
        console.warn('[BackgroundFetch] TIMEOUT task:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );

    console.log('[BackgroundFetch] Configured with status:', status);
  } catch (error) {
    console.error('[BackgroundFetch] Configure error:', error);
  }
};

// Headless task'i kaydet
BackgroundFetch.registerHeadlessTask(headlessTask);

// Uygulamayı başlat
AppRegistry.registerComponent(appName, () => App);

// Arkaplan servisi konfigürasyonu
configureBackgroundFetch();

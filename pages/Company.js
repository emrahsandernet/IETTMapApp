import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ToastAndroid,
} from 'react-native';
import {Button} from '@rneui/themed';

import SmsAndroid from 'react-native-get-sms-android';
import LoaderPage from '../LoaderPage';
import {SelectList} from 'react-native-dropdown-select-list';
import storage from '../storage/storage';
import {api} from '../api/api';
import BackgroundFetch from 'react-native-background-fetch';
import SmsListener from 'react-native-android-sms-listener';

const requestReadSmsPermission = async () => {
  try {
    const smsPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS İzin',
        message: 'Uygulama, SMS okuma izni gerektiriyor.',
      },
    );
    
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
        message: 'Uygulama, Bildirim alma izni gerektiriyor.',
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

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

const veryIntensiveTask = async taskDataArguments => {
  const {delay} = taskDataArguments;
  await new Promise(async resolve => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      await sleep(delay);

      let filter = {
        box: 'inbox',
        minDate: new Date().getTime() - 1 * 1000,
        indexFrom: 0,
        maxCount: 10,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        fail => {
          console.log('Failed with this error: ' + fail);
        },
        (count, smsList) => {
          var arr = JSON.parse(smsList);

          arr.forEach(function (object) {
            let body = object.body;
            storage.load({key: 'companyListData'}).then(data => {
              if (data.length > 0) {
                data.forEach(item => {
                  if (item.smsLabel === object.address) {
                    let username = item.text;

                    api.post('/api/send-sms-code', {
                      username,
                      body,
                    });
                  }
                });
              }
            });
          });
        },
      );
    }
  });
};
const options = {
  taskName: 'SigortaVip SMS Okuyucu',
  taskTitle: 'SigortaVip Uygulaması',
  taskDesc: 'Mesajlar alınıyor...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'sigortavip://app',
  parameters: {
    delay: 800,
  },
};

const Company = ({navigation, startBackgroundService, stopBackgroundService, backgroundServiceRunning}) => {
  const [foregroundService, setForegroundService] = useState(false);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyList, setCompanyList] = useState([]);
  const [companyListData, setCompanyListData] = useState([]);
  const smsListenerRef = useRef(null);
  
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View>
          <Button
            title="Çıkış Yap"
            type="clear"
            onPress={() => {
              storage.save({
                key: 'loginState',
                data: {
                  isLoggedIn: false,
                },
              });
              navigation.navigate('Giriş Yap');
            }}
          />
        </View>
      ),
    });
  }, []);

  // SMS dinleyiciyi yönetme
  const startSmsListener = async () => {
    try {
      // İzin kontrolü
      const hasPermission = await requestReadSmsPermission();
      if (!hasPermission) {
        console.error('SMS izinleri reddedildi');
        ToastAndroid.show('SMS izinleri verilmedi', ToastAndroid.SHORT);
        return false;
      }
      
      // Var olan dinleyici varsa kaldır
      if (smsListenerRef.current) {
        smsListenerRef.current.remove();
        smsListenerRef.current = null;
      }
      
      // Yeni dinleyici oluştur
      smsListenerRef.current = SmsListener.addListener(message => {
        console.log('SMS Alındı:', message);
        ToastAndroid.show('Yeni SMS alındı', ToastAndroid.SHORT);
        
        // Mesajı işle
        processSmsMessage(message);
      });
      
      console.log('SMS dinleyici başlatıldı');
      return true;
    } catch (error) {
      console.error('SMS dinleyici başlatma hatası:', error);
      return false;
    }
  };
  
  // SMS dinleyiciyi durdurma
  const stopSmsListener = () => {
    try {
      if (smsListenerRef.current) {
        smsListenerRef.current.remove();
        smsListenerRef.current = null;
        console.log('SMS dinleyici durduruldu');
      }
    } catch (error) {
      console.error('SMS dinleyici durdurma hatası:', error);
    }
  };
  
  // SMS mesajını işleme
  const processSmsMessage = async (message) => {
    try {
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
          console.log(`Eşleşme bulundu: ${username}, Mesaj: ${body}`);
          
          // Sunucuya gönder
          await api.post('/api/send-sms-code', {
            username,
            body,
          });
          
          console.log('Mesaj sunucuya gönderildi');
          ToastAndroid.show('Mesaj sunucuya gönderildi', ToastAndroid.SHORT);
        } else {
          console.log('Tanımlı şirket bulunamadı:', originatingAddress);
        }
      } else {
        console.log('Tanımlı şirket yok');
      }
    } catch (error) {
      console.error('SMS işleme hatası:', error);
    }
  };

  useEffect(() => {
    storage
      .load({key: 'companyListData'})
      .then(data => {
        if (data.length > 0) {
          setCompanyListData(data);
        }
      })
      .catch(err => {
        console.log(err);
      });

    storage.load({key: 'foregroundService'})
      .then(data => {
        if (data.foregroundService) {
          setForegroundService(true);
          // Servis aktifse SMS dinleyici başlat
          startSmsListener();
        } else {
          setForegroundService(false);
        }
      })
      .catch(err => {
        console.log('Servis durumu yüklenirken hata:', err);
        setForegroundService(false);
      });
      
    fetchData();
      
    // Temizleme fonksiyonu
    return () => {
      stopSmsListener();
    };
  }, []);

  // Servis durumundaki değişimi izle
  useEffect(() => {
    if (foregroundService) {
      startSmsListener();
    } else {
      stopSmsListener();
    }
  }, [foregroundService]);
  
  const handleSave = async (username, body) => {
    try {
      await api.post('/api/send-sms-code', {
        username,
        body,
      });
    } catch (error) {
      console.error('Error sending data:', error);
    }
  };
  
  // Servis başlatma
  const handleStart = async () => {
    console.log('[Company] Starting service from UI');
    try {
      // BackgroundFetch servisini ve SMS dinleyiciyi başlat
      await startBackgroundService();
      const started = await startSmsListener();
      
      if (started) {
        setForegroundService(true);
        
        // Storage'a kaydet
        await storage.save({
          key: 'foregroundService',
          data: { foregroundService: true },
        });
        
        // Son 10 saniye içindeki mesajları kontrol et
        checkRecentMessages();
      }
    } catch (e) {
      console.error('[Company] Error starting service:', e);
    }
  };

  // Servis durdurma
  const handleStop = async () => {
    console.log('[Company] Stopping service from UI');
    try {
      // BackgroundFetch ve SMS dinleyiciyi durdur
      await stopBackgroundService();
      stopSmsListener();
      
      setForegroundService(false);
      
      // Storage'a kaydet
      await storage.save({
        key: 'foregroundService',
        data: { foregroundService: false },
      });
    } catch (e) {
      console.error('[Company] Error stopping service:', e);
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

  const fetchData = async () => {
    try {
      const data = await api.get('/api/get-company-name');
      const newCompanyList = data.data.map(item => ({
        key: item.id,
        value: item.Label,
        smsLabel: item.SmsSenderName,
      }));
      setCompanyList(newCompanyList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTextChange = newText => {
    setCompanyListData(prevData => {
      const existingIndex = prevData.findIndex(item => item.key === selected);

      if (existingIndex !== -1) {
        storage.save({
          key: 'companyListData',
          data: prevData.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  text: newText,
                  smsLabel: companyList.find(
                    company => company.key === selected,
                  ).smsLabel,
                }
              : item,
          ),
        });
        return prevData.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                text: newText,
                smsLabel: companyList.find(company => company.key === selected)
                  .smsLabel,
              }
            : item,
        );
      } else {
        const newObject = {
          text: newText,
          key: selected,
          smsLabel: companyList.find(company => company.key === selected)
            .smsLabel,
        };
        storage.save({
          key: 'companyListData',
          data: [...prevData, newObject],
        });
        return [...prevData, newObject];
      }
    });
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <LoaderPage />
      ) : (
        <>
          {companyList.length > 0 && (
            <SelectList
              setSelected={val => {
                setSelected(val);
              }}
              data={companyList}
              save="key"
              placeholder="Şirket Seçiniz"
              searchPlaceholder="Ara..."
              style={{marginBottom: 20, borderRadius: 80, color: 'black'}}
              dropdownTextStyles={{color: 'black'}}
              inputStyles={{color: 'black'}}
            />
          )}
          <View style={{marginTop: 20, borderRadius: 80}}>
            {selected === '' ? null : (
              <TextInput
                style={styles.input}
                onChangeText={handleTextChange}
                value={
                  companyListData.find(item => item.key === selected)
                    ? companyListData.find(item => item.key === selected)[
                        'text'
                      ]
                    : ''
                }
              />
            )}
            {foregroundService ? (
              <Button
                title="Servisi Durdur"
                style={{marginTop: 20, borderRadius: 80}}
                onPress={() => {
                  handleStop();
                }}
                disabled={companyListData.length > 0 ? false : true}
              />
            ) : (
              <Button
                title="Servisi Başlat"
                style={{marginTop: 20, borderRadius: 80}}
                onPress={() => {
                  handleStart();
                }}
                disabled={companyListData.length > 0 ? false : true}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignContent: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderRadius: 8,
    elevation: 3,
    backgroundColor: 'white',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    color: 'black',
  },

  invalidInput: {
    borderColor: 'red',
  },
  circle: {
    height: 20,
    width: 20,
    borderRadius: 20,
    borderColor: 'red',
    borderWidth: 1,

    justifyContent: 'center',
    marginRight: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  card: {
    backgroundColor: 'white',

    borderRadius: 8,
    elevation: 3,
  },
  nameCard: {
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    width: 150,
    height: 50,
    color: 'black',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: 'black',
    fontSize: 15,
  },
  description: {
    fontSize: 14,
    color: 'black',
  },
  touchableItem: {
    backgroundColor: '#d5a6bd',
    borderRadius: 20,
  },
});

export default Company;

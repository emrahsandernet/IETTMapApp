import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

import LoaderPage from '../LoaderPage';
import {SelectList} from 'react-native-dropdown-select-list';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
// import SmsListener from 'react-native-android-sms-listener-background';

ReactNativeForegroundService.register();

const Company = ({navigation}) => {
  const [foregroundService, setForegroundService] = useState(false);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(false);

  const [companyList, setCompanyList] = useState([]);
  const [companyListData, setCompanyListData] = useState({});

  const api = axios.create({
    baseURL: 'http://185.148.240.254:3000',
  });
  const log = () => {
    console.log('test');
  };
  const requestReadSmsPermission = async () => {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS İzin',
          message: 'Uygulama, SMS okuma izni gerektiriyor.',
        },
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'SMS İzin',
          message: 'Uygulama, SMS alma izni gerektiriyor.',
        },
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'SMS İzin',
          message: 'Uygulama, SMS alma izni gerektiriyor.',
        },
      );
    } catch (err) {
      console.error('Error requesting permissions:', err);
    }
  };
  requestReadSmsPermission();
  useEffect(() => {
    fetchData();
    requestReadSmsPermission();
  }, []);
  ReactNativeForegroundService.add_task(() => log(), {
    delay: 1000,
    onLoop: true,
    taskId: 'taskid1',
    onError: e => console.log(`Error logging:`, e),
  });
  const startForegroundService = () => {
    ReactNativeForegroundService.start({
      id: 12414,
      title: 'Foreground Service',
      message: 'We are live World',
      icon: 'ic_launcher',
      button: true,

      buttonText: 'Button',

      buttonOnPress: 'cray',
      setOnlyAlertOnce: true,
    });
    setForegroundService(true);
  };
  // let listener = null;
  // if (foregroundService) {
  //   listener = SmsListener.addListener(message => {
  //     console.info(message.originatingAddress);
  //     console.info(message.body);
  //     console.log('message', message);
  //   });
  // }

  const fetchData = async () => {
    try {
      const data = await api.get('/api/sms-sirketler');
      console.log(data);
      const newCompanyList = data.data.map((item, index) => ({
        key: index,
        value: item,
      }));
      setCompanyList(newCompanyList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTextChange = newText => {
    setCompanyListData(prevData => ({
      ...prevData,
      [selected]: newText,
    }));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <LoaderPage />
      ) : (
        <>
          {companyList.length > 0 && (
            <SelectList
              setSelected={val => setSelected(val)}
              data={companyList}
              save="value"
              placeholder="Sirketler"
              searchPlaceholder="Ara..."
              style={{marginBottom: 20, borderRadius: 80, color: 'black'}}
              dropdownTextStyles={{color: 'black'}}
              inputStyles={{color: 'black'}}
            />
          )}
          <View style={{marginTop: 20, borderRadius: 80}}>
            <TextInput
              style={styles.input}
              onChangeText={handleTextChange}
              value={companyListData[selected]}
            />
            {foregroundService ? (
              <Button
                title="Servisi Durdur"
                style={{marginTop: 20, borderRadius: 80}}
                onPress={() => {
                  setForegroundService(false);
                }}
              />
            ) : (
              <Button
                title="Servisi Başlat"
                style={{marginTop: 20, borderRadius: 80}}
                onPress={() => {
                  setForegroundService(true);
                }}
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
    borderColor: 'red', // Geçersiz giriş durumunda kenarlık rengini kırmızı yap
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
    // TouchableOpacity için stil
    backgroundColor: '#d5a6bd', // Dokunduğunuzda arka plan rengi değiştirilebilir
    borderRadius: 20,
  },
});

export default Company;

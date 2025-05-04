import React, {useEffect} from 'react';
import QRCodeScanner from 'react-native-qrcode-scanner';

import {Text, StyleSheet, PermissionsAndroid} from 'react-native';
import {api} from '../api/api';
const QrScreen = ({navigation}) => {
  useEffect(() => {
    requestReadSms1Permission();
  }, []);

  const requestReadSms1Permission = async () => {
    try {
      await PermissionsAndroid.request(
        // add camara per
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Kamera Izin',
          message: 'Uygulama, SMS okuma izni gerektiriyor.',
        },
      );
    } catch (err) {
      console.error('Error requesting permissions:', err);
    }
  };
  const handleGetQrcodeData = uri => {
    api
      .post('/api/add-qrcode', {
        otpAuthURI: uri,
      })
      .then(response => {
        console.log(response.data);
        if (response.data.message === 'ok') {
          alert('QR kod başarıyla okundu.');
          setTimeout(() => {
            navigation.navigate('Anasayfa');
          }, 1000);
        } else {
          alert('Bir hata oluştu.');
        }
      });
  };

  return (
    <QRCodeScanner
      onRead={({data}) => {
        handleGetQrcodeData(data);
      }}
      topContent={
        <Text style={styles.centerText}>
          <Text style={styles.textBold}>Sigortavip QR Kod Okuyucu</Text>
        </Text>
      }
      reactivateTimeout={2000}
      reactivate={true}
      showMarker={true}
    />
  );
};
export default QrScreen;

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

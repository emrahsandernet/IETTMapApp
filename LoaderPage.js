import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';

const LoaderPage = () => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // imageWidth hesaplaması burada yapılır
  const imageWidth = windowWidth * 0.8; // Ekranın genişliğinin %80'i kadar

  return (
    <ImageBackground
      source={require('./assets/sandernet.png')} // Arka plan resmini buraya ekleyin
      style={[
        styles.background,
        {width: 240},
        {height: 240, marginTop: '40%', marginLeft: '20%'},
      ]} // imageWidth kullanılır
      blurRadius={10} // Arka plan blurlama miktarı
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'cover', // Arka plan resminin boyutunu kapsamasını sağlar
  },
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Yükleme bileşeni arka plan rengi (saydamlık ekler)
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
  },
});

export default LoaderPage;

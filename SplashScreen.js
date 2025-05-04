import React, {useEffect} from 'react';
import {View, Image, StyleSheet} from 'react-native';

const SplashScreen = ({navigation}) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.reset({
        // Geri dönüş geçmişini temizle
        index: 0,
        routes: [{name: 'Anasayfa'}], // Ana Sayfa'ya yönlendir
      });
    }, 2000);
  }, []);
  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/sandernet.png')} // Splash ekran görselinin yolunu buraya ekleyin
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default SplashScreen;

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        © 2023 Sigortavip™. Tüm hakları saklıdır.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: 'white', // Footer arka plan rengi
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  footerText: {
    color: 'black', // Footer metin rengi
    fontSize: 16,
  },
});

export default Footer;

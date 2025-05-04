import React, {useState, useEffect} from 'react';
import {Text, Input, Button} from '@rneui/base';
import {View} from 'react-native';
import storage from '../storage/storage';
import {api} from '../api/api';

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // Assuming you want to save the login state asynchronously
      api
        .post('/api/auth/login', {
          username: username,
          password: password,
        })
        .then(response => {
          console.log(response.data);
          if (response.data.token !== undefined && response.data.token !== '') {
            storage.save({
              key: 'loginState',
              data: {
                isLoggedIn: true,
                token: response.data.token,
              },
            });
            navigation.navigate('Anasayfa');
          } else {
            alert('Kullanıcı adı veya parola hatalı.');
          }
        })
        .catch(error => {
          console.log(error);
          alert('Kullanıcı adı veya parola hatalı.');
        });

      // Navigating to the main app screen after successful login
    } catch (error) {
      console.log('Error during login:', error);
    }
  };

  return (
    <View style={{flex: 1, padding: 16, alignContent: 'center'}}>
      <Input
        placeholder="Kullanıcı Adı"
        onChangeText={text => {
          setUsername(text);
        }}
      />
      <Input
        placeholder="Parola"
        secureTextEntry
        onChangeText={text => {
          setPassword(text);
        }}
      />
      <Button onPress={handleLogin}>Giriş</Button>
    </View>
  );
};

export default LoginScreen;

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
import {jwtDecode} from 'jwt-decode';
import {decode} from 'base-64';
import axios from 'axios';
import storage from '../storage/storage';
import {api} from '../api/api';
global.atob = decode;
const Help = ({navigation}) => {
  useEffect(() => {
    navigation.setOptions({
      tabBarVisible: true,
    });
  }, []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [connectionCode, setConnectionCode] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleSend = async () => {
    //with authorization
    const token = await storage.load({key: 'loginState'});
    api.defaults.headers.common['Authorization'] = `Bearer ${token.token}`;
    const decoded = jwtDecode(token.token);
    api
      .post('/api/help', {
        Title: title,
        Description: description,
        ConnectCode: connectionCode,
        ContactNumber: contactNumber,
      })
      .then(response => {
        console.log(response.data);
        if (response.data.message === 'ok') {
          alert('Yardım talebiniz başarıyla oluşturuldu.');
          navigation.navigate('Destek');
        } else {
          alert('Bir hata oluştu.');
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Uygulama ile ilgili sorularınızı ve görüşlerinizi bize iletebilirsiniz.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Konu"
        onChangeText={text => {
          setTitle(text);
        }}
      />
      <TextInput
        style={styles.textArea}
        placeholder="Sorun bildir..."
        onChangeText={text => {
          setDescription(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Bağlantı kodu"
        onChangeText={text => {
          setConnectionCode(text);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="İletişim Numarası"
        onChangeText={text => {
          setContactNumber(text);
        }}
      />
      <Button title="Gönder" onPress={handleSend} />
    </View>
  );
};

export default Help;
const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: 'black',
    marginTop: 10,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  textArea: {
    height: 150,
    justifyContent: 'flex-start',
    textAlignVertical: 'top',
    borderColor: 'gray',
    borderRadius: 8,
    elevation: 3,
    backgroundColor: 'white',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    color: 'black',
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

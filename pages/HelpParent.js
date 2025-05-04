import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {ListItem, Button} from '@rneui/themed';
import {jwtDecode} from 'jwt-decode';
import {decode} from 'base-64';
import axios from 'axios';
import storage from '../storage/storage';
import {api} from '../api/api';
global.atob = decode;

const HelpParent = ({navigation}) => {
  const [helpData, setHelpData] = useState([]);
  const [userName, setUserName] = useState('');
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View>
          <Button
            onPress={() => navigation.navigate('Destek Talebi')}
            title="Destek Talebi Oluştur"
            color="#000"
            type="clear"
          />
        </View>
      ),
    });
  }, []);

  // if navigation is this page, fetch data

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchData();
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation]);

  const fetchData = async () => {
    //with authorization
    const token = await storage.load({key: 'loginState'});
    api.defaults.headers.common['Authorization'] = `Bearer ${token.token}`;
    const decoded = jwtDecode(token.token);
    setUserName(decoded.username);

    api.get('/api/help').then(response => {
      setHelpData(response.data);
    });
  };

  const talep = [
    {
      id: 1,
      name: 'Acente',
    },
    {
      id: 2,
      name: 'Şirket',
    },
  ];
  return (
    <View style={styles.container}>
      {helpData.length === 0 ? (
        <Text style={{textAlign: 'center'}}>Henüz yardım talebiniz yok.</Text>
      ) : null}
      <FlatList
        data={helpData}
        renderItem={({item}) => (
          <ListItem.Swipeable
            key={item.id}
            style={{
              marginBottom: 10,
            }}
            leftWidth={80}
            rightWidth={90}
            minSlideWidth={40}
            leftContent={action => (
              <Button
                containerStyle={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: '#f4f4f4',
                }}
                type="clear"
                icon={{
                  name: 'archive-outline',
                  type: 'material-community',
                }}
                onPress={action}
              />
            )}
            rightContent={action => (
              <Button
                containerStyle={{
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: '#f4f4f4',
                }}
                type="clear"
                icon={{name: 'delete-outline'}}
                onPress={action}
              />
            )}>
            <ListItem.Content>
              <ListItem.Title>{item.Subject}</ListItem.Title>
              <ListItem.Subtitle>
                {item.Status === 0 ? (
                  <Text style={{color: 'red'}}>Beklemede</Text>
                ) : item.Status === 1 ? (
                  <Text style={{color: 'green'}}>Cevaplandı</Text>
                ) : (
                  <Text style={{color: 'blue'}}>Devam Ediyor</Text>
                )}
              </ListItem.Subtitle>
              <ListItem.Title>
                Oluşturan:{' '}
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: 'black',
                    fontSize: 15,
                  }}>
                  {userName}
                </Text>
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem.Swipeable>
        )}
      />
    </View>
  );
};

export default HelpParent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignContent: 'center',
    gap: 10,
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

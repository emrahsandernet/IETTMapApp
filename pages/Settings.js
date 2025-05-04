import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Button,
} from 'react-native';

import storage from '../storage/storage';

const styles = {
  container: {
    padding: 16,
  },

  heading: {
    fontSize: 18,
    marginBottom: 16,
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
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
  },
  deleteButton: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addColumnButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addColumnButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    color: 'black',
    marginTop: 10,
    marginBottom: 10,
  },
};

const Settings = () => {
  useEffect(() => {
    try {
      storage
        .load({
          key: 'server',
        })
        .then(ret => {
          setServerUrl(ret.serverUrl);
          setServerPort(ret.serverPort);
        })
        .catch(err => {
          console.error(err.message);
        });
    } catch (error) {
      console.log(error);
    }
  }, []);
  const [serverUrl, setServerUrl] = useState('');
  const [serverPort, setServerPort] = useState('');

  const handleSave = () => {
    storage.save({
      key: 'server',
      data: {
        serverUrl: serverUrl,
        serverPort: serverPort,
      },
    });
    alert('Sunucu bilgileri kaydedildi.');
  };

  return (
    <>
      <View style={styles.container}>
        <>
          <TextInput
            style={styles.input}
            placeholder="Sunucu Url"
            value={serverUrl}
            onChangeText={text => {
              setServerUrl(text);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Sunucu Port"
            value={serverPort}
            onChangeText={text => {
              setServerPort(text);
            }}
          />
          <Button
            title="Kaydet"
            style={{marginTop: 20, borderRadius: 80}}
            onPress={handleSave}
          />
        </>
      </View>
    </>
  );
};

export default Settings;

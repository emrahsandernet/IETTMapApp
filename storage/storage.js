import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = new Storage({
  // maximum capacity, default 1000 key-ids
  size: 1000,

  // Use AsyncStorage for RN apps, or window.localStorage for web apps.
  // If storageBackend is not set, data will be lost after reload.
  storageBackend: AsyncStorage, // for web: window.localStorage

  // expire time, default: 1 day (1000 * 3600 * 24 milliseconds).
  // null means never expire
  defaultExpires: null,

  // cache data in the memory. default is true.
  enableCache: true,

  // if data was not found in storage or expired data was found,
  // the corresponding sync method will be invoked returning
  // the latest data.
  sync: {
    // we'll talk about the details later.
  },
});

// Hataları yakalamak için try-catch içine alıyoruz
try {
  storage
    .load({
      key: 'loginState',
    })
    .then(ret => {
      console.log('undefined', ret);
    })
    .catch(err => {
      console.log('err', err);
    });
} catch (error) {
  console.log('Storage init error:', error);
}

export default storage;

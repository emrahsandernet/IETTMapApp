import axios from 'axios';
import storage from '../storage/storage';

let baseURL = 'http://209.182.238.254:3001';

storage
  .load({key: 'loginState'})
  .then(data => {
    if (data.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
  })
  .catch(err => {
    console.log(err);
  });

storage
  .load({key: 'server'})
  .then(data => {
    baseURL = 'http://' + data.serverUrl + ':' + data.serverPort;
  })
  .catch(err => {
    console.log(err);
  });
console.log(baseURL);
export const api = axios.create({
  baseURL: baseURL,
});

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SmsModule } = NativeModules;

// Event dinleyici oluştur
const smsEventEmitter = new NativeEventEmitter(SmsModule);

/**
 * SMS servisi için JavaScript arayüzü
 */
class SmsService {
  /**
   * SMS servisini başlatır
   * @returns {Promise<boolean>} İşlem sonucu
   */
  static async startService() {
    try {
      if (Platform.OS !== 'android') {
        console.warn('SMS servisi sadece Android platformunda desteklenmektedir');
        return false;
      }
      
      return await SmsModule.startSmsService();
    } catch (error) {
      console.error('SMS servisi başlatılırken hata:', error);
      return false;
    }
  }
  
  /**
   * SMS servisini durdurur
   * @returns {Promise<boolean>} İşlem sonucu
   */
  static async stopService() {
    try {
      if (Platform.OS !== 'android') {
        console.warn('SMS servisi sadece Android platformunda desteklenmektedir');
        return false;
      }
      
      return await SmsModule.stopSmsService();
    } catch (error) {
      console.error('SMS servisi durdurulurken hata:', error);
      return false;
    }
  }
  
  /**
   * SMS servisinin durumunu kontrol eder
   * @returns {Promise<boolean>} Servis durumu
   */
  static async isServiceRunning() {
    try {
      if (Platform.OS !== 'android') {
        console.warn('SMS servisi sadece Android platformunda desteklenmektedir');
        return false;
      }
      
      return await SmsModule.isSmsServiceRunning();
    } catch (error) {
      console.error('SMS servisi durumu kontrol edilirken hata:', error);
      return false;
    }
  }
  
  /**
   * SMS olaylarını dinler
   * @param {Function} callback Olay tetiklendiğinde çağrılacak fonksiyon
   * @returns {Object} Event subscription objesi
   */
  static onSmsReceived(callback) {
    if (Platform.OS !== 'android') {
      console.warn('SMS servisi sadece Android platformunda desteklenmektedir');
      return { remove: () => {} };
    }
    
    return smsEventEmitter.addListener('SmsReceived', callback);
  }
  
  /**
   * Test amaçlı bir SMS olayı gönderir
   * @param {String} sender Gönderici
   * @param {String} message Mesaj
   * @returns {Promise<boolean>} İşlem sonucu
   */
  static async emitTestSms(sender, message) {
    try {
      if (Platform.OS !== 'android') {
        console.warn('SMS servisi sadece Android platformunda desteklenmektedir');
        return false;
      }
      
      return await SmsModule.emitTestSmsEvent(sender, message);
    } catch (error) {
      console.error('Test SMS olayı gönderilirken hata:', error);
      return false;
    }
  }
}

export default SmsService; 
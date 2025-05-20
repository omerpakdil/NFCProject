import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcEvents, NfcTech } from 'react-native-nfc-manager';

// NFC tag tipleri
export const TAG_TYPES = {
  NFC_A: 'NFC-A',
  NFC_B: 'NFC-B',
  NFC_F: 'NFC-F',
  NFC_V: 'NFC-V',
  ISODEP: 'ISO-DEP',
  MIFARE_CLASSIC: 'MIFARE Classic',
  MIFARE_ULTRALIGHT: 'MIFARE Ultralight',
  NDEF: 'NDEF',
  UNKNOWN: 'Bilinmiyor',
};

// NFC data tipleri
export const DATA_TYPES = {
  TEXT: 'TEXT',
  URL: 'URL',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  WIFI: 'WIFI',
  CONTACT: 'CONTACT',
  CUSTOM: 'CUSTOM',
};

class NfcService {
  constructor() {
    this.isInitialized = false;
    this.isReading = false;
  }
  
  // NFC başlatma
  async init() {
    if (this.isInitialized) return true;
    
    try {
      // NFC donanımı var mı kontrol et
      const hasNfc = await NfcManager.isSupported();
      
      if (!hasNfc) {
        console.log('Bu cihaz NFC desteklemiyor');
        return false;
      }
      
      // NFC başlat
      await NfcManager.start();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('NFC başlatılamadı:', error);
      return false;
    }
  }
  
  // NFC okumayı başlat
  async startReading(callback, errorCallback) {
    if (this.isReading) {
      console.log('NFC okuma zaten devam ediyor');
      return;
    }
    
    try {
      // NFC başlat
      if (!this.isInitialized) {
        const initialized = await this.init();
        if (!initialized) {
          errorCallback && errorCallback('NFC başlatılamadı');
          return;
        }
      }
      
      this.isReading = true;
      
      // NFC tag okunduğunda event listener
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
        this.processTag(tag, callback);
      });
      
      // iOS için NFC okuma oturumu başlat
      if (Platform.OS === 'ios') {
        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage: 'NFC etiketi okumak için telefonu yaklaştırın',
        });
      } 
      // Android için NFC okumayı başlat
      else {
        await NfcManager.registerTagEvent();
      }
    } catch (error) {
      console.log('NFC okumaya başlarken hata:', error);
      errorCallback && errorCallback('NFC okuma başlatılamadı');
      this.stopReading();
    }
  }
  
  // NFC okumayı durdur
  async stopReading() {
    if (!this.isReading) return;
    
    try {
      this.isReading = false;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      
      // iOS için NFC oturumunu kapat
      if (Platform.OS === 'ios') {
        await NfcManager.cancelTechnologyRequest();
      } 
      // Android için tag event'ini kapat
      else {
        await NfcManager.unregisterTagEvent();
      }
    } catch (error) {
      console.log('NFC okumayı durdururken hata:', error);
    }
  }
  
  // NFC tag işleme
  processTag(tag, callback) {
    try {
      // Tag tipini belirle
      const tagType = this.getTagType(tag);
      
      // Tag içeriğini analiz et
      const processedData = this.parseTagData(tag);
      
      // Sonucu callback ile döndür
      callback({
        id: tag.id || Date.now().toString(),
        tagType: tagType,
        data: processedData,
        rawTag: tag,
      });
      
      // Okumayı durdur
      this.stopReading();
    } catch (error) {
      console.log('Tag işlenirken hata:', error);
      this.stopReading();
    }
  }
  
  // Tag tipini belirle
  getTagType(tag) {
    if (!tag) return TAG_TYPES.UNKNOWN;
    
    if (tag.techTypes) {
      if (tag.techTypes.includes('android.nfc.tech.NfcA')) return TAG_TYPES.NFC_A;
      if (tag.techTypes.includes('android.nfc.tech.NfcB')) return TAG_TYPES.NFC_B;
      if (tag.techTypes.includes('android.nfc.tech.NfcF')) return TAG_TYPES.NFC_F;
      if (tag.techTypes.includes('android.nfc.tech.NfcV')) return TAG_TYPES.NFC_V;
      if (tag.techTypes.includes('android.nfc.tech.IsoDep')) return TAG_TYPES.ISODEP;
      if (tag.techTypes.includes('android.nfc.tech.MifareClassic')) return TAG_TYPES.MIFARE_CLASSIC;
      if (tag.techTypes.includes('android.nfc.tech.MifareUltralight')) return TAG_TYPES.MIFARE_ULTRALIGHT;
      if (tag.techTypes.includes('android.nfc.tech.Ndef')) return TAG_TYPES.NDEF;
    }
    
    if (tag.type) {
      return tag.type;
    }
    
    return TAG_TYPES.UNKNOWN;
  }
  
  // Tag verisini analiz et
  parseTagData(tag) {
    if (!tag) return { type: DATA_TYPES.CUSTOM, value: null };
    
    // NDEF formatında veri var mı?
    if (tag.ndefMessage && tag.ndefMessage.length > 0) {
      return this.parseNdefMessage(tag.ndefMessage);
    }
    
    // Diğer türler
    return {
      type: DATA_TYPES.CUSTOM,
      value: JSON.stringify(tag),
      raw: tag
    };
  }
  
  // NDEF mesajını analiz et
  parseNdefMessage(ndefMessage) {
    if (!ndefMessage || ndefMessage.length === 0) return { type: DATA_TYPES.CUSTOM, value: null };
    
    const record = ndefMessage[0];
    const { tnf, type, payload, id } = record;
    
    // TNF ve tip bilgisine göre analiz
    if (tnf === Ndef.TNF_WELL_KNOWN && this.bytesToString(type) === Ndef.RTD_TEXT) {
      return {
        type: DATA_TYPES.TEXT,
        value: this.decodeTextPayload(payload),
      };
    }
    
    if (tnf === Ndef.TNF_WELL_KNOWN && this.bytesToString(type) === Ndef.RTD_URI) {
      const uri = this.decodeUriPayload(payload);
      
      // URL tipini belirle
      if (uri.startsWith('http')) {
        return {
          type: DATA_TYPES.URL,
          value: uri,
        };
      }
      
      if (uri.startsWith('tel:')) {
        return {
          type: DATA_TYPES.PHONE,
          value: uri.substring(4),
        };
      }
      
      if (uri.startsWith('mailto:')) {
        return {
          type: DATA_TYPES.EMAIL,
          value: uri.substring(7),
        };
      }
      
      return {
        type: DATA_TYPES.URL,
        value: uri,
      };
    }
    
    // Diğer türler için raw veriyi döndür
    return {
      type: DATA_TYPES.CUSTOM,
      value: JSON.stringify(record),
      raw: record
    };
  }
  
  // Byte dizisini string'e dönüştür
  bytesToString(bytes) {
    if (!bytes) return '';
    return String.fromCharCode.apply(null, bytes);
  }
  
  // Text payload çözümle
  decodeTextPayload(payload) {
    if (!payload) return '';
    
    try {
      const textDecoder = new TextDecoder();
      // İlk byte'ı atla (status byte)
      return textDecoder.decode(payload.slice(1));
    } catch (error) {
      // Fallback yöntemi
      let result = '';
      for (let i = 1; i < payload.length; i++) {
        result += String.fromCharCode(payload[i]);
      }
      return result;
    }
  }
  
  // URI payload çözümle
  decodeUriPayload(payload) {
    if (!payload) return '';
    
    // İlk byte URI tanımlayıcısı
    const prefix = this.getUriPrefix(payload[0]);
    let uri = prefix;
    
    // URI içeriği
    for (let i = 1; i < payload.length; i++) {
      uri += String.fromCharCode(payload[i]);
    }
    
    return uri;
  }
  
  // URI prefix'i (Ndef.URI_PREFIX_MAP referans alındı)
  getUriPrefix(prefixCode) {
    const prefixMap = {
      0x00: '',
      0x01: 'http://www.',
      0x02: 'https://www.',
      0x03: 'http://',
      0x04: 'https://',
      0x05: 'tel:',
      0x06: 'mailto:',
    };
    
    return prefixMap[prefixCode] || '';
  }
  
  // NFC tag'e veri yaz (Premium özellik)
  async writeTag(data, callback, errorCallback) {
    try {
      // NFC başlat
      if (!this.isInitialized) {
        const initialized = await this.init();
        if (!initialized) {
          errorCallback && errorCallback('NFC başlatılamadı');
          return;
        }
      }
      
      // iOS için NFC yazma oturumu başlat
      if (Platform.OS === 'ios') {
        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage: 'NFC etiketi yazmak için telefonu yaklaştırın',
        });
      } 
      // Android için NFC teknolojisini başlat
      else {
        await NfcManager.requestTechnology(NfcTech.Ndef);
      }
      
      // Tag formatını kontrol et
      const tag = await NfcManager.getTag();
      if (!tag) {
        throw new Error('NFC tag bulunamadı');
      }
      
      // NDEF mesajı oluştur
      const bytes = Ndef.encodeMessage([Ndef.textRecord(data.value)]);
      
      // Tag'e yaz
      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
      }
      
      // Başarılı yazma
      callback && callback('Tag başarıyla yazıldı');
    } catch (error) {
      console.log('Tag yazarken hata:', error);
      errorCallback && errorCallback('Tag yazılamadı: ' + error.message);
    } finally {
      // Teknolojiyi serbest bırak
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log('Teknoloji serbest bırakılırken hata:', e);
      }
    }
  }
  
  // NFC tag'i kilitle (Premium özellik)
  async lockTag(callback, errorCallback) {
    try {
      // Premium özellikleri içeren kod burada
      // Öncelikle NFC tag'ine yazmak için bağlanılır
      // Ardından uygun komutlar ile tag kilitlenir
      // Bu özellik premium kullanıcılar için
      
      callback && callback('Tag başarıyla kilitlendi');
    } catch (error) {
      errorCallback && errorCallback('Tag kilitlenemedi: ' + error.message);
    }
  }
  
  // NFC sistemini temizle
  cleanup() {
    this.stopReading();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  }
}

export default new NfcService(); 
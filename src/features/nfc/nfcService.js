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
  PROTECTED: 'PROTECTED', // Şifrelenmiş içerik için yeni tip
  MERGED: 'MERGED', // Birleştirilmiş veri tipi
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
  
  // Veri şifrele - Basit XOR şifreleme
  encryptData(data, password) {
    if (!data || !password) return data;
    
    const prefix = "ENCRYPTED:"; // Şifrelenmiş veri ön eki
    let result = prefix;
    
    // Her karakteri şifrele
    for (let i = 0; i < data.length; i++) {
      // XOR şifreleme: Her karakter için veri karakteri ile şifre karakterini XOR işlemine tabi tut
      const charCode = data.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  }
  
  // Şifrelenmiş veriyi çöz - Basit XOR şifre çözme
  decryptData(encryptedData, password) {
    if (!encryptedData || !password) return encryptedData;
    
    const prefix = "ENCRYPTED:";
    
    // Şifrelenmiş veri kontrolü
    if (!encryptedData.startsWith(prefix)) {
      return encryptedData; // Şifreli değilse aynı veriyi döndür
    }
    
    // Ön eki kaldır
    const data = encryptedData.substring(prefix.length);
    let result = "";
    
    // Her karakteri çöz
    for (let i = 0; i < data.length; i++) {
      // XOR geri çözme: Şifrelemede kullanılan işlemin aynısını uygula
      const charCode = data.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  }
  
  // Verinin şifreli olup olmadığını kontrol et
  isEncryptedData(data) {
    return data && typeof data === 'string' && data.startsWith('ENCRYPTED:');
  }

  // Şifre ile korumalı NFC tag yaz
  async writeProtectedTag(data, password, callback, errorCallback) {
    try {
      if (!password || password.length < 4) {
        throw new Error('Şifre en az 4 karakter olmalıdır');
      }
      
      // Veriyi şifrele
      const encryptedData = this.encryptData(data.value, password);
      
      // Şifrelenmiş veriyi yaz
      return this.writeTag(
        { type: DATA_TYPES.PROTECTED, value: encryptedData },
        callback,
        errorCallback
      );
    } catch (error) {
      console.log('Şifreli tag yazma hatası:', error);
      errorCallback && errorCallback('Şifreli tag yazılamadı: ' + error.message);
    }
  }
  
  // Tag içeriğini çöz
  async decryptTagData(encryptedData, password) {
    if (!this.isEncryptedData(encryptedData)) {
      return encryptedData; // Şifreli değilse doğrudan döndür
    }
    
    if (!password) {
      throw new Error('Bu içerik şifrelenmiş. Görüntülemek için şifre gerekli.');
    }
    
    // Şifreyi çöz
    const decryptedData = this.decryptData(encryptedData, password);
    
    // Çözülmüş veriyi döndür
    return decryptedData;
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
          alertMessage: 'NFC etiketi kilitlemek için telefonu yaklaştırın',
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
      
      // NFC Tag'in desteklediği teknolojileri kontrol et
      // Kilitleme sadece belirli tipte etiketlerde çalışır
      if (!tag.ndefWritable) {
        throw new Error('Bu NFC etiketi kilitleme özelliğini desteklemiyor');
      }
      
      // Etiketi kilitle
      if (Platform.OS === 'android') {
        // Android için kilitleme komutu
        await NfcManager.ndefHandler.makeReadOnly();
      } else {
        // iOS için kilitleme komutu
        await NfcManager.setNdefPushMessage(null);
      }
      
      callback && callback('NFC etiketi başarıyla kilitlendi');
    } catch (error) {
      console.log('Tag kilitleme hatası:', error);
      errorCallback && errorCallback('Tag kilitlenemedi: ' + error.message);
    } finally {
      // Teknolojiyi serbest bırak
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log('Teknoloji serbest bırakılırken hata:', e);
      }
    }
  }
  
  // NFC sistemini temizle
  cleanup() {
    this.stopReading();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  }

  // Verileri birleştir
  mergeData(dataItems) {
    if (!dataItems || dataItems.length === 0) {
      return { type: DATA_TYPES.TEXT, value: '' };
    }
    
    // Tek bir veri varsa doğrudan döndür
    if (dataItems.length === 1) {
      return dataItems[0];
    }
    
    // Birleştirilmiş veri değeri
    let mergedValue = '';
    
    // Verileri işleme modu
    const mergeMode = {
      CONCAT: 'CONCAT', // Basit birleştirme
      STRUCTURED: 'STRUCTURED', // Yapılandırılmış birleştirme (türler ve değerler)
    };
    
    // Bu örnek için basit birleştirme kullanacağız
    const mode = mergeMode.STRUCTURED;
    
    if (mode === mergeMode.CONCAT) {
      // Basit metin birleştirme
      mergedValue = dataItems.map(item => item.value).join('\n\n');
      return { type: DATA_TYPES.TEXT, value: mergedValue };
    } else {
      // Yapılandırılmış birleştirme - veri türlerini ve değerlerini korur
      const structuredData = dataItems.map(item => {
        // Şifreli içeriği birleştirmeye izin verme
        if (item.type === DATA_TYPES.PROTECTED) {
          return `[ŞİFRELİ İÇERİK]`;
        }
        
        return `[${item.type}]\n${item.value}`;
      }).join('\n\n---\n\n');
      
      return { type: DATA_TYPES.MERGED, value: structuredData };
    }
  }
  
  // Birleştirilmiş verileri yaz
  async mergeAndWriteTag(dataItems, callback, errorCallback) {
    try {
      // Verileri birleştir
      const mergedData = this.mergeData(dataItems);
      
      // Birleştirilmiş veriyi yaz
      return this.writeTag(mergedData, callback, errorCallback);
    } catch (error) {
      console.log('Veri birleştirme hatası:', error);
      errorCallback && errorCallback('Veriler birleştirilemedi: ' + error.message);
    }
  }
}

export default new NfcService(); 
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Desteklenen diller
export const LANGUAGES = {
  en: { code: 'en', name: 'English', dir: 'ltr', flag: '🇬🇧' },
  tr: { code: 'tr', name: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  es: { code: 'es', name: 'Español', dir: 'ltr', flag: '🇪🇸' },
};

// Varsayılan dil
export const DEFAULT_LANGUAGE = 'en';

// AsyncStorage'da dil tercihini saklama anahtarı
const LANGUAGE_STORAGE_KEY = '@nfc_reader_pro:language';

// Dil değiştirme fonksiyonu
export const changeLanguage = async (language) => {
  try {
    // Dil kodunu kaydet
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // i18next dilini değiştir
    await i18next.changeLanguage(language);
    
    // RTL dilleri için I18nManager ayarla (Arapça, İbranice vb.)
    const isRTL = LANGUAGES[language]?.dir === 'rtl';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      // RTL değişikliği için uygulamanın yeniden başlatılması gerekebilir
    }
    
    return true;
  } catch (error) {
    console.error('Dil değiştirme hatası:', error);
    return false;
  }
};

// Kaydedilmiş dil tercihini yükle
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage || DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Dil tercihi yüklenirken hata:', error);
    return DEFAULT_LANGUAGE;
  }
};

// i18next başlatma
const initI18n = async () => {
  const savedLanguage = await loadSavedLanguage();
  
  await i18next
    .use(initReactI18next)
    .use(
      resourcesToBackend((language, namespace, callback) => {
        import(`./locales/${language}/${namespace}.json`)
          .then((resources) => {
            callback(null, resources);
          })
          .catch((error) => {
            console.error(`${language}/${namespace} yüklenirken hata:`, error);
            callback(error, null);
          });
      })
    )
    .init({
      lng: savedLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: Object.keys(LANGUAGES),
      ns: ['common', 'home', 'settings', 'scan', 'subscription', 'write', 'dataMerge', 'history', 'onboarding'],
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: {
        escapeValue: false, // React zaten güvenli
      },
      react: {
        useSuspense: false, // Önemli: React Native'de Suspense tam olarak desteklenmiyor
      },
    });
  
  return i18next;
};

export default initI18n; 
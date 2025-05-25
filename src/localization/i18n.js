import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Çeviri dosyalarını import et
import enCommon from './locales/en/common.json';
import enDataMerge from './locales/en/dataMerge.json';
import enHistory from './locales/en/history.json';
import enHome from './locales/en/home.json';
import enOnboarding from './locales/en/onboarding.json';
import enScanDetail from './locales/en/scanDetail.json';
import enSettings from './locales/en/settings.json';
import enSubscription from './locales/en/subscription.json';
import enWrite from './locales/en/write.json';

import trCommon from './locales/tr/common.json';
import trDataMerge from './locales/tr/dataMerge.json';
import trHistory from './locales/tr/history.json';
import trHome from './locales/tr/home.json';
import trOnboarding from './locales/tr/onboarding.json';
import trScanDetail from './locales/tr/scanDetail.json';
import trSettings from './locales/tr/settings.json';
import trSubscription from './locales/tr/subscription.json';
import trWrite from './locales/tr/write.json';

import esCommon from './locales/es/common.json';
import esDataMerge from './locales/es/dataMerge.json';
import esHistory from './locales/es/history.json';
import esHome from './locales/es/home.json';
import esOnboarding from './locales/es/onboarding.json';
import esScanDetail from './locales/es/scanDetail.json';
import esSettings from './locales/es/settings.json';
import esSubscription from './locales/es/subscription.json';
import esWrite from './locales/es/write.json';

// Desteklenen diller
export const LANGUAGES = {
  en: { code: 'en', name: 'English', dir: 'ltr', flag: '🇬🇧' },
  es: { code: 'es', name: 'Español', dir: 'ltr', flag: '🇪🇸' },
  tr: { code: 'tr', name: 'Türkçe', dir: 'ltr', flag: '🇹🇷' }
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
    .init({
      lng: savedLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: Object.keys(LANGUAGES),
      ns: ['common', 'home', 'settings', 'scanDetail', 'subscription', 'write', 'dataMerge', 'history', 'onboarding'],
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: {
        escapeValue: false, // React zaten güvenli
      },
      react: {
        useSuspense: false, // Önemli: React Native'de Suspense tam olarak desteklenmiyor
      },
      resources: {
        en: {
          common: enCommon,
          home: enHome,
          settings: enSettings,
          scanDetail: enScanDetail,
          write: enWrite,
          dataMerge: enDataMerge,
          history: enHistory,
          onboarding: enOnboarding,
          subscription: enSubscription,
        },
        tr: {
          common: trCommon,
          home: trHome,
          settings: trSettings,
          scanDetail: trScanDetail,
          write: trWrite,
          dataMerge: trDataMerge,
          history: trHistory,
          onboarding: trOnboarding,
          subscription: trSubscription,
        },
        es: {
          common: esCommon,
          home: esHome,
          settings: esSettings,
          scanDetail: esScanDetail,
          write: esWrite,
          dataMerge: esDataMerge,
          history: esHistory,
          onboarding: esOnboarding,
          subscription: esSubscription,
        },
      },
    });
  
  return i18next;
};

export default initI18n; 
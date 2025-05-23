import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { changeLanguage, DEFAULT_LANGUAGE, LANGUAGES } from './i18n';

const useLanguageStore = create(
  persist(
    (set, get) => ({
      // Mevcut dil kodu (en, tr, es)
      currentLanguage: DEFAULT_LANGUAGE,
      
      // Dil değiştirme
      setLanguage: async (languageCode) => {
        // Dil kodu geçerli mi kontrol et
        if (!LANGUAGES[languageCode]) {
          console.error('Geçersiz dil kodu:', languageCode);
          return false;
        }
        
        // i18next dilini değiştir
        const success = await changeLanguage(languageCode);
        
        if (success) {
          // Store'u güncelle
          set({ currentLanguage: languageCode });
        }
        
        return success;
      },
      
      // Mevcut dil bilgilerini al
      getCurrentLanguageInfo: () => {
        const { currentLanguage } = get();
        return LANGUAGES[currentLanguage] || LANGUAGES[DEFAULT_LANGUAGE];
      },
      
      // Desteklenen tüm dilleri al
      getSupportedLanguages: () => LANGUAGES,
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useLanguageStore; 
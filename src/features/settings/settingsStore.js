import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Varsayılan ayarlar
const DEFAULT_SETTINGS = {
  notifications: true,
  hapticFeedback: true,
  autoSave: true,
};

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Ayarlar
      settings: { ...DEFAULT_SETTINGS },
      
      // Ayarı değiştir
      toggleSetting: (key) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: !state.settings[key],
          },
        }));
      },
      
      // Ayarı güncelle
      updateSetting: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        }));
      },
      
      // Tüm ayarları güncelle
      updateSettings: (newSettings) => {
        set({
          settings: {
            ...get().settings,
            ...newSettings,
          },
        });
      },
      
      // Ayarları sıfırla
      resetSettings: () => {
        set({
          settings: { ...DEFAULT_SETTINGS },
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSettingsStore; 
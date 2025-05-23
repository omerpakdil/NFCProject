import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { EventSubscription } from 'expo-modules-core';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener, setNotificationHandler } from 'expo-notifications';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from './src/constants/theme';
import NotificationService from './src/features/notifications/notificationService';
import { initializeRevenueCat } from './src/features/subscription/subscriptionStore';
import Navigation from './src/navigation/index';

// Splash ekranını göstermeye devam et
preventAutoHideAsync().catch(console.warn);

// Bildirimlerin nasıl gösterileceğini ayarla
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // Uygulama başladığında kaynak yükleme
  useEffect(() => {
    async function prepare() {
      try {
        // Font ve diğer kaynakları yükle
        await Font.loadAsync({
          ...Ionicons.font,
        });
        
        // Bildirim izinlerini kontrol et
        await NotificationService.checkPermissions();
        
        // RevenueCat'i başlat
        await initializeRevenueCat()
          .catch(err => console.warn('RevenueCat başlatılamadı:', err));
        
        // Gerekli kaynakların yüklenmesi için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Kaynak yükleme hatası:', e);
      } finally {
        // İşlem tamamlandı
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Bildirim dinleyicilerini ayarla
  useEffect(() => {
    // Bildirim alındığında
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    // Bildirime tıklandığında
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
      // Burada bildirime tıklandığında yapılacak işlemler eklenebilir
    });

    return () => {
      // Dinleyicileri temizle
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Layout animasyonu tamamlandığında splash ekranını gizle
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await hideAsync().catch(console.warn);
    }
  }, [appIsReady]);

  // Uygulama henüz hazır değilse boş içerik göster
  if (!appIsReady) {
    return null;
  }

  // Uygulama hazır ve içerik yüklenince navigasyonu göster
  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
}); 
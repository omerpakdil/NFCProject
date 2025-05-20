import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from './src/constants/theme';
import Navigation from './src/navigation/index';

// Splash ekranını göstermeye devam et
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Uygulama başladığında kaynak yükleme
  useEffect(() => {
    async function prepare() {
      try {
        // Simule edilmiş kaynak yüklemesi (fontlar, önbellek, vb.)
        // Font ve diğer kaynakları yükle
        await Font.loadAsync({
          ...Ionicons.font,
        });
        
        // Önemli kaynak dosyaları için mock edilmiş yükleme süresi
        // Gerçek uygulamada burada gerekli API çağrıları ve veritabanı işlemleri yapılabilir
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // İşlem tamamlandı
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Layout animasyonu tamamlandığında splash ekranını gizle
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
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
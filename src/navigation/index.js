import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

// Tema
import { COLORS } from '../constants/theme';

// Ekranlar (henüz oluşturulmadı)
// Ana ekranlar
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Diğer ekranlar
import OnboardingScreen from '../screens/OnboardingScreen';
import ScanDetailScreen from '../screens/ScanDetailScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import WriteTagScreen from '../screens/WriteTagScreen';

// Stack Navigator'lar
const MainStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Tab Navigator
const Tab = createBottomTabNavigator();

// Koyu tema renkleri
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          title: 'NFC Reader Pro',
          headerShown: false,
        }} 
      />
      <HomeStack.Screen 
        name="ScanResult" 
        component={ScanResultScreen} 
        options={{ title: 'Tarama Sonucu' }} 
      />
      <HomeStack.Screen 
        name="WriteTag" 
        component={WriteTagScreen} 
        options={{ title: 'Etiket Yaz' }} 
      />
      <HomeStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
        options={{ title: 'Premium Abonelik' }} 
      />
    </HomeStack.Navigator>
  );
};

// History Stack Navigator
const HistoryStackNavigator = () => {
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <HistoryStack.Screen 
        name="HistoryMain" 
        component={HistoryScreen} 
        options={{ 
          title: 'Geçmiş',
          headerShown: false,
        }} 
      />
      <HistoryStack.Screen 
        name="ScanDetail" 
        component={ScanDetailScreen} 
        options={{ title: 'Tarama Detayı' }} 
      />
    </HistoryStack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        animation: 'slide_from_right',
      }}
    >
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ 
          title: 'Ayarlar',
          headerShown: false,
        }} 
      />
      <SettingsStack.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
        options={{ title: 'Premium Abonelik' }} 
      />
    </SettingsStack.Navigator>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="History" component={HistoryStackNavigator} options={{ title: 'Geçmiş' }} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ title: 'Ayarlar' }} />
    </Tab.Navigator>
  );
};

// Onboarding Navigator
const OnboardingNavigator = () => {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
    </OnboardingStack.Navigator>
  );
};

// Ana Navigator
export default function Navigation() {
  // İlk başlangıçta onboarding gösterip göstermeme durumu
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  
  useEffect(() => {
    // İlk başlatma durumunu kontrol et
    const checkIfFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          // İlk başlatma
          setIsFirstLaunch(true);
          await AsyncStorage.setItem('hasLaunched', 'true');
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.log('First launch check error:', error);
        setIsFirstLaunch(false);
      }
    };
    
    checkIfFirstLaunch();
  }, []);
  
  // Yükleniyor durumu
  if (isFirstLaunch === null) {
    return null;
  }
  
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <MainStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isFirstLaunch ? (
          <MainStack.Screen name="OnboardingFlow" component={OnboardingNavigator} />
        ) : (
          <MainStack.Screen name="MainFlow" component={TabNavigator} />
        )}
      </MainStack.Navigator>
    </NavigationContainer>
  );
} 
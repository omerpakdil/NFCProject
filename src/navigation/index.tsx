import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tema
import { COLORS } from '../constants/theme';

// Ekranlar
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ScanDetailScreen from '../screens/ScanDetailScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import SettingsScreen from '../screens/SettingsScreen';
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
        name="ScanDetailScreen" 
        component={ScanDetailScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <HomeStack.Screen 
        name="ScanResult" 
        component={ScanResultScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <HomeStack.Screen 
        name="WriteTag" 
        component={WriteTagScreen} 
        options={{ 
          headerShown: false 
        }} 
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
        name="ScanDetailScreen" 
        component={ScanDetailScreen} 
        options={{ 
          headerShown: false 
        }} 
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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: 'home' | 'home-outline' | 'time' | 'time-outline' | 'settings' | 'settings-outline' = 'home';

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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
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
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkIfFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
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
  
  if (isFirstLaunch === null) {
    return null;
  }
  
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      {isFirstLaunch ? (
        <OnboardingNavigator />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  );
} 
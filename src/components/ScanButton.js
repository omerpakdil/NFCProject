import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';

const ScanButton = ({ onPress, isScanning = false, size = 80 }) => {
  // Animasyon değeri
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Tarama durumuna göre animasyon
  useEffect(() => {
    if (isScanning) {
      // Pulse animasyonu başlat
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Animasyonu durdur
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [isScanning]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseCircle,
          { 
            width: size * 1.5, 
            height: size * 1.5,
            borderRadius: size * 1.5 / 2,
            transform: [{ scale: pulseAnim }], 
            opacity: isScanning ? 0.2 : 0,
          }
        ]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isScanning ? "stop" : "scan"}
          size={size / 2}
          color={COLORS.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  pulseCircle: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
  },
});

export default ScanButton; 
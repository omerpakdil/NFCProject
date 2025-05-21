import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

/**
 * Modern bir Alert bileşeni
 * @param {Object} props
 * @param {boolean} props.visible - Alert'in görünürlüğü
 * @param {string} props.title - Alert başlığı
 * @param {string} props.message - Alert mesajı
 * @param {Array} props.buttons - Alert butonları [{text, style, onPress}]
 * @param {string} props.type - Alert tipi ('info', 'success', 'error', 'warning')
 * @param {Function} props.onClose - Kapatma fonksiyonu
 */
const CustomAlert = ({ 
  visible = false, 
  title = 'Bilgi', 
  message = '', 
  buttons = [{ text: 'Tamam' }], 
  type = 'info',
  onClose = () => {} 
}) => {
  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Alert gösterildiğinde animasyonu başlat
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Alert kapandığında animasyonu sıfırla
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  // Alert tipine göre ikon ve renk belirle
  const getAlertTypeProps = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: COLORS.success,
          gradient: [COLORS.success, '#1a9147']
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: COLORS.error,
          gradient: [COLORS.error, '#c41c1c']
        };
      case 'warning':
        return {
          icon: 'warning',
          color: COLORS.warning,
          gradient: [COLORS.warning, '#cc7a00']
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          color: COLORS.primary,
          gradient: [COLORS.primary, '#2563eb']
        };
    }
  };

  const { icon, color } = getAlertTypeProps();

  // İkon konteyneri için gölge efekti
  const iconShadow = {
    shadowColor: color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: backdropAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconContainer, iconShadow]}>
            <View style={[styles.iconCircle, { backgroundColor: color }]}>
              <Ionicons name={icon} size={36} color={COLORS.text} />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          
          {message ? <Text style={styles.message}>{message}</Text> : null}
          
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = button.style === 'destructive' ? styles.destructiveButton : (
                button.style === 'cancel' ? styles.cancelButton : styles.defaultButton
              );
              
              const textStyle = button.style === 'destructive' ? styles.destructiveButtonText : (
                button.style === 'cancel' ? styles.cancelButtonText : styles.defaultButtonText
              );
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttonStyle,
                    index > 0 && styles.buttonMargin
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    button.onPress && button.onPress();
                    if (!button.preventClose) {
                      onClose();
                    }
                  }}
                >
                  <Text style={[styles.buttonText, textStyle]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.cardRadius,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: SIZES.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
  },
  buttonMargin: {
    marginLeft: 12,
  },
  defaultButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destructiveButton: {
    backgroundColor: COLORS.error,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: COLORS.text,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
  },
  destructiveButtonText: {
    color: COLORS.text,
  },
});

export default CustomAlert; 
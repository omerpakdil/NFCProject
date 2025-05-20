import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Button = ({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  small = false,
}) => {
  // Buton tipi (primary, secondary, outline, ghost)
  const getButtonStyle = () => {
    if (disabled) return styles.disabledButton;
    
    switch (type) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'ghost':
        return styles.ghostButton;
      case 'premium':
        return styles.premiumButton;
      default:
        return styles.primaryButton;
    }
  };
  
  // Buton metin stili
  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    
    switch (type) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'premium':
        return styles.premiumText;
      default:
        return styles.primaryText;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        small && styles.smallButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
      
      {loading ? (
        <ActivityIndicator 
          color={type === 'outline' || type === 'ghost' ? COLORS.primary : COLORS.text} 
          size="small" 
        />
      ) : (
        <Text style={[
          styles.text,
          getTextStyle(),
          small && styles.smallText,
          textStyle,
        ]}>
          {title}
        </Text>
      )}
      
      {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: SIZES.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  smallButton: {
    height: 40,
    paddingHorizontal: 16,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  premiumButton: {
    backgroundColor: COLORS.premium,
  },
  disabledButton: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 0,
  },
  text: {
    fontWeight: '600',
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
  smallText: {
    fontSize: SIZES.small,
  },
  primaryText: {
    color: COLORS.text,
  },
  secondaryText: {
    color: COLORS.text,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  premiumText: {
    color: COLORS.background,
  },
  disabledText: {
    color: COLORS.textDisabled,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button; 
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/theme';

const Button = ({ 
  mode = 'contained',
  icon,
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  fullWidth = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.disabled;
    if (mode === 'contained') return COLORS.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textDisabled;
    if (mode === 'contained') return COLORS.text;
    return COLORS.primary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={getTextColor()} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button; 
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

const Card = ({
  children,
  style,
  onPress,
  disabled = false,
  elevated = true,
  borderRadius = SIZES.cardRadius,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card,
        elevated && styles.elevated,
        { borderRadius },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {children}
    </CardComponent>
  );
};

// Card.Content bileşeni
Card.Content = ({ children, style }) => (
  <View style={[styles.content, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: SIZES.medium,
    borderRadius: SIZES.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    ...SHADOWS.medium,
  },
  content: {
    flex: 1,
  },
});

export default Card; 
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const PremiumBadge = ({ style, small = false, withText = true }) => {
  return (
    <View style={[styles.container, small && styles.smallContainer, style]}>
      <Ionicons 
        name="star" 
        size={small ? 10 : 14} 
        color={COLORS.background} 
      />
      {withText && (
        <Text style={[styles.text, small && styles.smallText]}>
          Premium
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: COLORS.background,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  smallText: {
    fontSize: 10,
    marginLeft: 2,
  },
});

export default PremiumBadge; 
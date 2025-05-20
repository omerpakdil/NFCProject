export const COLORS = {
  primary: '#3D7DFF',
  primaryDark: '#2E5EC3',
  primaryLight: '#5B93FF',
  secondary: '#FF6B6B',
  background: '#121212',
  cardBackground: '#1E1E1E',
  surface: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled: '#666666',
  border: '#333333',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  premium: '#FFD700',
  disabled: '#ADB5BD',
};

export const FONT = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SIZES = {
  xsmall: 10,
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 18,
  xxlarge: 24,
  
  // Spacing
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  
  // Screen padding
  screenPadding: 20,
  
  // Border radius
  borderRadius: 12,
  buttonRadius: 8,
  cardRadius: 16,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

export default { COLORS, FONT, SIZES, SHADOWS }; 
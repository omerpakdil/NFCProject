import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Button from '../components/Button';
import { COLORS, SIZES } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { t } = useTranslation('onboarding');
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Onboarding sayfaları
  const onboardingData = [
    {
      id: '1',
      title: t('slides.welcome.title'),
      description: t('slides.welcome.description'),
      animation: require('../assets/animations/welcome.json'),
    },
    {
      id: '2',
      title: t('slides.scan.title'),
      description: t('slides.scan.description'),
      animation: require('../assets/animations/scan.json'),
    },
    {
      id: '3',
      title: t('slides.premium.title'),
      description: t('slides.premium.description'),
      animation: require('../assets/animations/premium.json'),
    },
  ];

  // Bir sonraki sayfaya git
  const goToNextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Son slayttaysak, ana akışa geç
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainFlow' }],
      });
    }
  };

  // Kaydırma olayı
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Onboarding sayfasını render et
  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.animationContainer}>
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // İlerleme göstergesi noktalarını render et
  const renderDots = () => {
    return onboardingData.map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          index === currentIndex && styles.activeDot,
        ]}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainFlow' }],
              });
            }}
          >
            <Text style={styles.skipText}>{t('actions.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {renderDots()}
        </View>

        <Button
          title={currentIndex === onboardingData.length - 1 ? t('actions.start') : t('actions.next')}
          onPress={goToNextSlide}
          style={styles.button}
          rightIcon={
            currentIndex === onboardingData.length - 1 ? null : (
              <Ionicons name="arrow-forward" size={20} color={COLORS.text} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  skipContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  skipText: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  animationContainer: {
    width: width * 0.8,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.screenPadding + 20,
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  button: {
    width: '100%',
  },
  flatList: {
    flex: 1,
  },
});

export default OnboardingScreen; 
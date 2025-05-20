import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useRef, useState } from 'react';
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

// Onboarding sayfaları
const onboardingData = [
  {
    id: '1',
    title: "NFC Reader Pro'ya Hoş Geldiniz",
    description: "Güçlü NFC okuma, yazma ve yönetim özelliklerine sahip uygulamanız.",
    animation: require('../assets/animations/welcome.json'), // Bu dosyaları daha sonra ekleyeceğiz
  },
  {
    id: '2',
    title: 'NFC Etiketlerini Okuyun',
    description: 'Herhangi bir NFC etiketini kolayca okuyun ve bilgilerini görüntüleyin.',
    animation: require('../assets/animations/scan.json'),
  },
  {
    id: '3',
    title: 'Premium Özellikleri Keşfedin',
    description: 'Etiket yazma, kilitleme ve şifre koruması gibi gelişmiş özelliklere erişin.',
    animation: require('../assets/animations/premium.json'),
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

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
            <Text style={styles.skipText}>Geç</Text>
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
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {renderDots()}
        </View>

        <Button
          title={currentIndex === onboardingData.length - 1 ? "Başla" : "İleri"}
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
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
});

export default OnboardingScreen; 
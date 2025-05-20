import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const ScanResultScreen = ({ navigation, route }) => {
  // Lottie animasyonu referansı
  const animationRef = useRef(null);
  
  // Store
  const { addScan } = useHistoryStore();
  const { canUseFeature } = useSubscriptionStore();
  
  // Tarama sonucu
  const [scanResult, setScanResult] = useState(null);
  
  // Notlar (premium özelliği)
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    // Route'dan parametre al
    const { scanResult: routeScanResult } = route.params || {};
    
    if (routeScanResult) {
      // Geçmişe ekle
      const savedScan = addScan(routeScanResult);
      setScanResult(savedScan);
      
      // Animasyonu oynat
      if (animationRef.current) {
        animationRef.current.play(0, 60);
      }
    }
  }, [route.params]);
  
  // Eğer tarama sonucu yoksa
  if (!scanResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Tarama verisinin türüne göre içerik
  const renderContentByType = () => {
    const { data } = scanResult;
    
    switch (data.type) {
      case DATA_TYPES.TEXT:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Metin</Text>
            <Text style={styles.contentText}>{data.value}</Text>
          </Card>
        );
        
      case DATA_TYPES.URL:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>URL</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title="URL'yi Aç"
              onPress={() => Linking.openURL(data.value)}
              leftIcon={<Ionicons name="open" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      case DATA_TYPES.PHONE:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Telefon Numarası</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <View style={styles.actionRow}>
              <Button
                title="Ara"
                onPress={() => Linking.openURL(`tel:${data.value}`)}
                leftIcon={<Ionicons name="call" size={18} color={COLORS.text} />}
                style={styles.actionButton}
              />
              <Button
                title="Mesaj Gönder"
                type="outline"
                onPress={() => Linking.openURL(`sms:${data.value}`)}
                leftIcon={<Ionicons name="chatbubble" size={18} color={COLORS.primary} />}
                style={[styles.actionButton, { marginLeft: 10 }]}
              />
            </View>
          </Card>
        );
        
      case DATA_TYPES.EMAIL:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>E-posta Adresi</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title="E-posta Gönder"
              onPress={() => Linking.openURL(`mailto:${data.value}`)}
              leftIcon={<Ionicons name="mail" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      default:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Veri</Text>
            <Text style={styles.contentText} selectable>{JSON.stringify(data.value)}</Text>
          </Card>
        );
    }
  };
  
  // Veri paylaş
  const handleShare = async () => {
    try {
      const { data } = scanResult;
      const message = `NFC Reader Pro ile tarandı: ${data.value}`;
      
      await Share.share({
        message,
      });
    } catch (error) {
      console.log('Paylaşım hatası:', error);
    }
  };
  
  // Yeni bir NFC etiketi yaz (premium özellik)
  const handleWriteTag = () => {
    if (canUseFeature('write')) {
      navigation.navigate('WriteTag', { initialData: scanResult.data.value });
    } else {
      navigation.navigate('Subscription');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarama Sonucu</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Başarılı tarama animasyonu */}
        <View style={styles.animationContainer}>
          <LottieView
            ref={animationRef}
            source={require('../assets/animations/scan-success.json')}
            autoPlay={false}
            loop={false}
            style={styles.animation}
          />
        </View>
        
        {/* Tag tipi bilgisi */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Etiket Türü</Text>
          <Text style={styles.infoText}>{scanResult.tagType}</Text>
        </Card>
        
        {/* Tarama içeriği */}
        {renderContentByType()}
        
        {/* Yazma özelliği */}
        <Card style={styles.writeCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>NFC Etiketi Yaz</Text>
            {!canUseFeature('write') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            Bu veriyi yeni bir NFC etiketine yazmak için aşağıdaki butonu kullanın.
          </Text>
          
          <Button
            title="NFC Etiketi Yaz"
            type={canUseFeature('write') ? 'primary' : 'outline'}
            onPress={handleWriteTag}
            leftIcon={
              <Ionicons 
                name="create" 
                size={18} 
                color={canUseFeature('write') ? COLORS.text : COLORS.primary} 
              />
            }
            style={styles.writeButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: SIZES.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.small,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: SIZES.screenPadding,
  },
  animationContainer: {
    height: 120,
    alignItems: 'center',
    marginBottom: SIZES.xlarge,
  },
  animation: {
    width: 140,
    height: 140,
  },
  infoCard: {
    marginBottom: SIZES.medium,
  },
  infoTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  contentCard: {
    marginBottom: SIZES.medium,
  },
  contentTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  contentText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SIZES.medium,
  },
  actionButton: {
    marginTop: SIZES.medium,
  },
  writeCard: {
    marginTop: SIZES.small,
    marginBottom: SIZES.large,
  },
  writeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  writeCardTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  writeCardText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  writeButton: {
    marginTop: SIZES.medium,
  },
});

export default ScanResultScreen; 
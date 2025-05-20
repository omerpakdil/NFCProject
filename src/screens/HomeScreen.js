import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Bileşenler ve sabitler
import Button from '../components/Button';
import Card from '../components/Card';
import PremiumBadge from '../components/PremiumBadge';
import ScanButton from '../components/ScanButton';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import NfcService from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const HomeScreen = ({ navigation }) => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [hasNfc, setHasNfc] = useState(null);
  
  // Store
  const { scans } = useHistoryStore();
  const { isPremiumUser, canUseFeature } = useSubscriptionStore();
  
  // Son 5 tarama geçmişi
  const recentScans = scans.slice(0, 5);
  
  // NFC kontrolü
  useEffect(() => {
    const checkNfc = async () => {
      const nfcAvailable = await NfcService.init();
      setHasNfc(nfcAvailable);
    };
    
    checkNfc();
    
    // Component unmount olduğunda NFC temizle
    return () => {
      if (isScanning) {
        NfcService.stopReading();
      }
      NfcService.cleanup();
    };
  }, []);
  
  // Ekran odaklandığında taramayı durdur
  useFocusEffect(
    useCallback(() => {
      if (isScanning) {
        setIsScanning(false);
        NfcService.stopReading();
      }
      
      return () => {};
    }, [isScanning])
  );
  
  // Tarama butonuna basıldığında
  const handleScan = async () => {
    if (!hasNfc) {
      Alert.alert(
        'NFC Kullanılamıyor',
        'Bu cihaz NFC desteklemiyor veya NFC devre dışı bırakılmış.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    
    // Zaten taranıyorsa durdur
    if (isScanning) {
      setIsScanning(false);
      await NfcService.stopReading();
      return;
    }
    
    // Taramayı başlat
    setIsScanning(true);
    
    try {
      NfcService.startReading(
        // Başarılı callback
        (scanResult) => {
          setIsScanning(false);
          // Sonucu göster
          navigation.navigate('ScanResult', { scanResult });
        },
        // Hata callback
        (error) => {
          setIsScanning(false);
          Alert.alert('Hata', error || 'NFC tarama sırasında bir hata oluştu.');
        }
      );
    } catch (error) {
      setIsScanning(false);
      Alert.alert('Hata', 'NFC tarama başlatılamadı: ' + error.message);
    }
  };
  
  // Premium ekranına git
  const handleGetPremium = () => {
    navigation.navigate('Subscription');
  };
  
  // Geçmiş ekranına git
  const handleViewHistory = () => {
    navigation.navigate('History');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Başlık */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NFC Reader Pro</Text>
            <Text style={styles.subtitle}>Etiketleri oku, yaz ve yönet.</Text>
          </View>
          
          {/* Abonelik durumu */}
          {isPremiumUser() ? (
            <PremiumBadge />
          ) : (
            <Button 
              title="Premium'a Geç" 
              type="premium"
              onPress={handleGetPremium} 
              small
            />
          )}
        </View>
        
        {/* Ana içerik */}
        <View style={styles.mainContent}>
          {/* Durum */}
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIconContainer}>
                <Ionicons 
                  name={hasNfc ? "checkmark-circle" : "close-circle"} 
                  size={28} 
                  color={hasNfc ? COLORS.success : COLORS.error} 
                />
              </View>
              <View>
                <Text style={styles.statusTitle}>
                  NFC {hasNfc ? 'Kullanılabilir' : 'Kullanılamıyor'}
                </Text>
                <Text style={styles.statusSubtext}>
                  {hasNfc 
                    ? 'Etiketi taramak için cihazı yaklaştırın.' 
                    : 'Bu cihaz NFC desteklemiyor veya devre dışı bırakılmış.'}
                </Text>
              </View>
            </View>
          </Card>
          
          {/* Premium özellikleri */}
          {!isPremiumUser() && (
            <Card style={styles.premiumCard}>
              <View style={styles.premiumTop}>
                <Ionicons name="star" size={24} color={COLORS.premium} />
                <Text style={styles.premiumTitle}>Premium Özellikleri Keşfedin</Text>
              </View>
              <Text style={styles.premiumText}>
                Yazma, etiket kilitleme, şifre koruması ve daha fazlası için premium sürüme geçin.
              </Text>
              <Button 
                title="Premium'a Geç" 
                type="premium" 
                onPress={handleGetPremium} 
                style={styles.premiumButton} 
              />
            </Card>
          )}
          
          {/* Yazma butonu - Sadece premium kullanıcılar için */}
          {canUseFeature('write') && (
            <Button
              title="NFC Etiketi Yaz"
              onPress={() => navigation.navigate('WriteTag')}
              type="secondary"
              leftIcon={<Ionicons name="create" size={20} color={COLORS.text} />}
              fullWidth
              style={styles.writeButton}
            />
          )}
        </View>
        
        {/* Son taramalar */}
        {recentScans.length > 0 && (
          <View style={styles.recentScans}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Taramalar</Text>
              <TouchableOpacity onPress={handleViewHistory}>
                <Text style={styles.viewAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.scansList}>
              {recentScans.map((scan, index) => (
                <Card 
                  key={scan.id} 
                  style={styles.scanCard}
                  onPress={() => navigation.navigate('ScanDetail', { scanId: scan.id })}
                >
                  <View style={styles.scanCardContent}>
                    <View style={styles.scanTypeIcon}>
                      <Ionicons 
                        name={scan.data.type === 'URL' ? 'link' : 'text'} 
                        size={20} 
                        color={COLORS.text} 
                      />
                    </View>
                    <View style={styles.scanInfo}>
                      <Text style={styles.scanTitle} numberOfLines={1}>
                        {scan.data.value || 'NFC Etiket'}
                      </Text>
                      <Text style={styles.scanSubtext}>
                        {scan.tagType} • {new Date(scan.timestamp).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Ana tarama butonu */}
      <View style={styles.scanButtonContainer}>
        <ScanButton
          onPress={handleScan}
          isScanning={isScanning}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 100, // Scan butonu için alt boşluk
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.large,
    marginBottom: SIZES.medium,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mainContent: {
    marginBottom: SIZES.xlarge,
  },
  statusCard: {
    marginBottom: SIZES.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  premiumCard: {
    backgroundColor: COLORS.cardBackground,
    marginBottom: SIZES.medium,
  },
  premiumTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  premiumText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.medium,
  },
  premiumButton: {
    alignSelf: 'flex-start',
  },
  writeButton: {
    marginTop: SIZES.medium,
  },
  recentScans: {
    marginBottom: SIZES.xlarge,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
  },
  scansList: {
    gap: SIZES.small,
  },
  scanCard: {
    padding: SIZES.small,
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanTypeIcon: {
    backgroundColor: COLORS.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
    marginRight: 8,
  },
  scanTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  scanSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scanButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default HomeScreen; 
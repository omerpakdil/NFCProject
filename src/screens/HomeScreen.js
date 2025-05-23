import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Bileşenler ve sabitler
import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import IconButton from '../components/IconButton';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import NotificationService from '../features/notifications/notificationService';
import useSettingsStore from '../features/settings/settingsStore';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const StatusCard = ({ icon, title, subtext, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Card style={styles.statusCard}>
      <View style={styles.statusRow}>
        <View style={styles.statusIconContainer}>
          {icon}
        </View>
        <View>
          <Text style={styles.statusTitle}>{title}</Text>
          <Text style={styles.statusSubtext}>{subtext}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

const PremiumCard = ({ onPress }) => (
  <Card style={styles.premiumCard}>
    <View style={styles.premiumTop}>
      <Ionicons name="star" size={24} color={COLORS.premium} />
      <Text style={styles.premiumTitle}>Premium'a Yükselt</Text>
    </View>
    <Text style={styles.premiumText}>
      Sınırsız tarama, gelişmiş özellikler ve daha fazlası için premium'a yükseltin.
    </Text>
    <Button 
      mode="contained"
      title="Premium'a Yükselt"
      onPress={onPress}
      style={styles.premiumButton}
      icon="star"
    />
  </Card>
);

const NoNfcView = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.noNfcContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.noNfcContent}>
        <View style={styles.noNfcIconContainer}>
          <Animated.View
            style={[
              styles.noNfcIconWrapper,
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="warning" size={64} color={COLORS.error} />
          </Animated.View>
        </View>
        <Text style={styles.noNfcTitle}>NFC Kullanılamıyor</Text>
        <Text style={styles.noNfcText}>
          Bu cihaz NFC teknolojisini desteklemiyor veya NFC devre dışı bırakılmış.
        </Text>
        <View style={styles.noNfcSteps}>
          <Text style={styles.noNfcStepsTitle}>Yapabilecekleriniz:</Text>
          <Animated.View 
            style={[
              styles.noNfcStep,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.noNfcStepIcon}>
              <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.noNfcStepText}>
              Ayarlar'dan NFC'nin açık olduğundan emin olun
            </Text>
          </Animated.View>
          <Animated.View 
            style={[
              styles.noNfcStep,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.noNfcStepIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.noNfcStepText}>
              NFC destekleyen bir cihaz kullanın
            </Text>
          </Animated.View>
          <Animated.View 
            style={[
              styles.noNfcStep,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.noNfcStepIcon}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.noNfcStepText}>
              Cihazınızın NFC desteği hakkında bilgi alın
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const ScanModal = ({ visible, onClose, onStartScan }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [waveAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Modal açılma animasyonu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Sürekli dalga animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>NFC Tarama</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
            />
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.scanAnimation}>
              {/* Dalga animasyonu */}
              <Animated.View
                style={[
                  styles.wave,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              
              {/* Telefon ikonu */}
              <Animated.View
                style={[
                  styles.phoneIcon,
                  {
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20],
                        }),
                      },
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="phone-portrait" size={48} color={COLORS.primary} />
              </Animated.View>

              {/* NFC ikonu */}
              <Animated.View
                style={[
                  styles.nfcIcon,
                  {
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 20],
                        }),
                      },
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="nfc" size={48} color={COLORS.primary} />
              </Animated.View>
            </View>
            
            <Text style={styles.modalText}>
              Telefonunuzu NFC etiketine yaklaştırın
            </Text>
            
            <Button
              title="Taramayı Başlat"
              onPress={onStartScan}
              icon="scan"
              style={styles.startScanButton}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const HomeScreen = ({ navigation }) => {
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [hasNfc, setHasNfc] = useState(true);
  const [showScanModal, setShowScanModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  // Store
  const { scans } = useHistoryStore();
  const { isPremiumUser, canUseFeature } = useSubscriptionStore();
  const { settings } = useSettingsStore();
  
  // Son taramalar - Premium kullanıcılar için 4, ücretsiz kullanıcılar için 2
  const recentScans = scans.slice(0, isPremiumUser() ? 4 : 2);
  
  // Kalan tarama hakkı bilgisi - Yeni eklenen
  const remainingScans = useHistoryStore(state => state.getRemainingScans());
  const isStorageLimitReached = useHistoryStore(state => state.isStorageLimitReached());
  
  // İlk açılışta bildirim örneği
  useEffect(() => {
    const showWelcomeNotification = async () => {
      // Sadece bildirimlerin açık olduğu durumda göster
      if (settings.notifications) {
        await NotificationService.sendNotification(
          'NFC Reader Pro\'ya Hoş Geldiniz',
          'NFC etiketlerini taramaya başlamak için hazır!',
          { type: 'welcome' }
        );
      }
    };
    
    showWelcomeNotification();
  }, []);
  
  // NFC kontrolü
  useEffect(() => {
    const checkNfc = async () => {
      const nfcAvailable = await NfcService.init();
      setHasNfc(nfcAvailable);
    };
    
    checkNfc();
    
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
      setAlertConfig({
        visible: true,
        title: 'NFC Kullanılamıyor',
        message: 'Bu cihaz NFC desteklemiyor veya NFC devre dışı bırakılmış.',
        type: 'error',
        buttons: [{ text: 'Tamam' }]
      });
      return;
    }
    
    setShowScanModal(true);
  };
  
  const handleStartScan = async () => {
    setShowScanModal(false);
    
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
          setAlertConfig({
            visible: true,
            title: 'Hata',
            message: error || 'NFC tarama sırasında bir hata oluştu.',
            type: 'error',
            buttons: [{ text: 'Tamam' }]
          });
        }
      );
    } catch (error) {
      setIsScanning(false);
      setAlertConfig({
        visible: true,
        title: 'Hata',
        message: 'NFC tarama başlatılamadı: ' + error.message,
        type: 'error',
        buttons: [{ text: 'Tamam' }]
      });
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
  
  const getIconName = (scan) => {
    if (!scan || !scan.data) return "document-text";
    
    switch(scan.data.type) {
      case DATA_TYPES.URL:
        return "link";
      case DATA_TYPES.PHONE:
        return "call";
      case DATA_TYPES.EMAIL:
        return "mail";
      case DATA_TYPES.WIFI:
        return "wifi";
      case DATA_TYPES.CONTACT:
        return "person";
      case DATA_TYPES.TEXT:
        return "document-text";
      case DATA_TYPES.CUSTOM:
      default:
        return "code-working";
    }
  };
  
  const getDisplayValue = (scan) => {
    if (!scan || !scan.data) return "NFC Etiketi";
    
    const value = scan.data.value;
    if (!value || value.trim() === "") {
      return scan.tagType || "NFC Etiketi";
    }
    
    // URL, telefon ve email'i kısalt
    if (value.length > 30) {
      return value.substring(0, 27) + "...";
    }
    
    return value;
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NFC Tarayıcı</Text>
            <Text style={styles.subtitle}>Etiketleri tarayın ve yönetin</Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {hasNfc === false ? (
          <NoNfcView />
        ) : (
          <View style={styles.mainContent}>
            {/* Durum */}
            <StatusCard
              icon={
                <Ionicons 
                  name={hasNfc ? "checkmark-circle" : "close-circle"} 
                  size={28} 
                  color={hasNfc ? COLORS.success : COLORS.error} 
                />
              }
              title={`NFC ${hasNfc ? 'Kullanılabilir' : 'Kullanılamıyor'}`}
              subtext={hasNfc 
                ? 'Etiketi taramak için cihazı yaklaştırın.' 
                : 'Bu cihaz NFC desteklemiyor veya devre dışı bırakılmış.'}
              onPress={handleScan}
            />
            
            {/* Premium özellikleri */}
            {!isPremiumUser() && (
              <>
                <PremiumCard onPress={handleGetPremium} />
                
                {/* Kalan tarama bilgisi - Yeni eklenen */}
                <Card style={styles.storageLimitCard}>
                  <View style={styles.storageLimitContent}>
                    <View style={styles.storageLimitIconContainer}>
                      <Ionicons 
                        name={isStorageLimitReached ? "alert-circle" : "save-outline"} 
                        size={24} 
                        color={isStorageLimitReached ? COLORS.warning : COLORS.primary} 
                      />
                    </View>
                    <View style={styles.storageLimitInfo}>
                      <Text style={styles.storageLimitTitle}>
                        {isStorageLimitReached 
                          ? "Depolama Limiti Aşıldı" 
                          : `Kalan Tarama: ${remainingScans}`}
                      </Text>
                      <Text style={styles.storageLimitText}>
                        {isStorageLimitReached
                          ? "Yeni taramalar en eski kayıtların üzerine yazılacak"
                          : "Premium kullanıcılar sınırsız tarama depolayabilir"}
                      </Text>
                    </View>
                  </View>
                  {isStorageLimitReached && (
                    <Button
                      title="Premium'a Yükselt"
                      onPress={handleGetPremium}
                      icon="star"
                      style={styles.storageLimitButton}
                    />
                  )}
                </Card>
              </>
            )}

            {/* Yazma butonu */}
            {canUseFeature('write') && (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('WriteTag')}
                style={styles.writeButton}
                title="Yeni NFC Etiketi Oluştur"
              />
            )}

            {/* Veri Birleştirme butonu */}
            {canUseFeature('data_merge') && (
              <Button
                mode="contained"
                icon="git-merge"
                onPress={() => navigation.navigate('DataMerge')}
                style={styles.mergeButton}
                title="NFC Veri Birleştirme"
              />
            )}

            {/* Son taramalar */}
            <View style={styles.recentScans}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son Taramalar</Text>
                {recentScans.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('History')}
                    style={styles.viewAllButton}
                  >
                    <Text style={styles.viewAllText}>Tümünü Gör</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {recentScans.length > 0 ? (
                <View style={styles.scansList}>
                  {recentScans.map((scan, index) => (
                    <Card 
                      key={index}
                      style={styles.scanCard}
                      onPress={() => navigation.navigate('ScanDetailScreen', { scanId: scan.id })}
                    >
                      <View style={styles.scanCardContent}>
                        <View style={styles.scanTypeIcon}>
                          <Ionicons 
                            name={getIconName(scan)} 
                            size={22} 
                            color={COLORS.primary} 
                          />
                        </View>
                        <View style={styles.scanInfo}>
                          <Text style={styles.scanTitle} numberOfLines={1}>
                            {getDisplayValue(scan)}
                          </Text>
                          <Text style={styles.scanSubtext}>
                            {scan.tagType} • {formatDate(scan.timestamp)}
                          </Text>
                        </View>
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={COLORS.textSecondary}
                          style={styles.scanArrow}
                        />
                      </View>
                    </Card>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateContent}>
                    <Text style={styles.emptyStateTitle}>Tarama Geçmişi</Text>
                    <Text style={styles.emptyStateText}>
                      NFC etiketlerini tarayarak geçmişinizi burada görebilirsiniz.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Tarama butonu - Sabit alt konumda */}
      {hasNfc && (
        <View style={styles.scanButtonContainer}>
          <Button
            mode="contained"
            icon="scan"
            onPress={handleScan}
            style={styles.scanButton}
            title="NFC Etiketi Tara"
          />
        </View>
      )}

      <ScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onStartScan={handleStartScan}
      />
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 15,
    paddingTop: 60,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  mainContent: {
    gap: 12,
  },
  statusCard: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  premiumCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 4,
  },
  premiumTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  premiumText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  writeButton: {
    marginBottom: 0,
  },
  recentScans: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 2,
  },
  scansList: {
    flexDirection: 'column',
    width: '100%',
  },
  scanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.cardRadius,
    overflow: 'hidden',
    marginBottom: 8,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: '100%',
    position: 'relative',
  },
  scanTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
    marginRight: 8,
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  scanSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scanArrow: {
    marginLeft: 'auto',
  },
  scanButtonContainer: {
    position: 'absolute',
    bottom: 12,
    left: 15,
    right: 15,
    backgroundColor: COLORS.background,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noNfcContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginTop: 20,
  },
  noNfcContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.error,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noNfcIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noNfcIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -5 }],
  },
  noNfcTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noNfcText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  noNfcSteps: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 15,
    gap: 12,
  },
  noNfcStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  noNfcStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  noNfcStepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  },
  noNfcStepText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    alignItems: 'center',
  },
  scanAnimation: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
  },
  phoneIcon: {
    position: 'absolute',
    zIndex: 2,
  },
  nfcIcon: {
    position: 'absolute',
    zIndex: 2,
  },
  modalText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  startScanButton: {
    width: '100%',
  },
  emptyStateContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 160,
    justifyContent: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  premiumButton: {
    marginTop: 8,
  },
  // Depolama limiti kartı stilleri - Yeni eklenen
  storageLimitCard: {
    marginBottom: 0,
  },
  storageLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageLimitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storageLimitInfo: {
    flex: 1,
  },
  storageLimitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  storageLimitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  storageLimitButton: {
    marginTop: 12,
  },
  lockCard: {
    // ... existing code ...
  },
  mergeButton: {
    marginBottom: 0,
  },
});

export default HomeScreen; 
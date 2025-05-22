import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const ScanResultScreen = ({ navigation, route }) => {
  // Lottie animasyonu referansı
  const animationRef = useRef(null);
  
  // Store
  const { addScan } = useHistoryStore();
  const { canUseFeature, isPremiumUser } = useSubscriptionStore();
  const isStorageLimitReached = useHistoryStore(state => state.isStorageLimitReached());
  
  // Tarama sonucu
  const [scanResult, setScanResult] = useState(null);

  // Şifre koruması için state'ler
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [decryptedValue, setDecryptedValue] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  // Alert durumu
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });

  // Notlar (premium özelliği)
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    // Route'dan parametre al
    const { scanResult: routeScanResult } = route.params || {};
    
    if (routeScanResult) {
      // Geçmişe ekle
      const savedScan = addScan(routeScanResult);
      setScanResult(savedScan);
      
      // Şifreli içerik kontrolü
      if (savedScan.data.type === DATA_TYPES.PROTECTED) {
        setIsEncrypted(true);
        setShowPasswordModal(true);
      }
      
      // Animasyonu oynat
      if (animationRef.current) {
        animationRef.current.play(0, 60);
      }
      
      // Premium olmayan kullanıcılar için depolama limiti uyarısı
      if (!isPremiumUser() && isStorageLimitReached) {
        setAlertConfig({
          visible: true,
          title: 'Depolama Limiti Aşıldı',
          message: 'Ücretsiz kullanıcılar için depolama limiti doldu. Yeni taramalar en eski kayıtların üzerine yazılacak. Sınırsız depolama için Premium aboneliğe geçin.',
          type: 'warning',
          buttons: [
            { text: 'Tamam' },
            { 
              text: 'Premium\'a Geç', 
              onPress: () => navigation.navigate('Home', { screen: 'Subscription' }) 
            }
          ]
        });
      }
    }
  }, [route.params]);

  // Şifreyi kontrol et ve içeriği çöz
  const handleDecrypt = async () => {
    try {
      if (!password) {
        setPasswordError('Lütfen bir şifre girin');
        return;
      }
      
      if (!scanResult || !scanResult.data || !scanResult.data.value) {
        setPasswordError('Şifreli içerik bulunamadı');
        return;
      }
      
      // Şifreyi çöz
      const decrypted = await NfcService.decryptTagData(scanResult.data.value, password);
      
      // Çözme başarılı mı kontrol et - değişiklik yoksa muhtemelen yanlış şifre
      if (decrypted === scanResult.data.value || !decrypted) {
        setPasswordError('Yanlış şifre. Lütfen tekrar deneyin.');
        return;
      }
      
      // Başarılı çözme
      setDecryptedValue(decrypted);
      setShowPasswordModal(false);
      setPasswordError('');
    } catch (error) {
      console.log('Şifre çözme hatası:', error);
      setPasswordError(error.message || 'Şifre çözme işlemi başarısız oldu');
    }
  };
  
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

    // Şifreli içerik ve henüz çözülmediyse
    if (data.type === DATA_TYPES.PROTECTED && !decryptedValue) {
      return (
        <Card style={styles.contentCard}>
          <Text style={styles.contentTitle}>Şifreli İçerik</Text>
          <View style={styles.encryptedContent}>
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
            <Text style={styles.encryptedText}>
              Bu içerik şifre korumalıdır. Görüntülemek için şifre gereklidir.
            </Text>
            <Button
              title="Şifre Girin"
              onPress={() => setShowPasswordModal(true)}
              icon="key"
              style={styles.unlockButton}
            />
          </View>
        </Card>
      );
    }
    
    // Şifrelenmiş içerik çözüldü ise
    if (data.type === DATA_TYPES.PROTECTED && decryptedValue) {
      return (
        <Card style={styles.contentCard}>
          <View style={styles.decryptedHeader}>
            <Text style={styles.contentTitle}>Çözülmüş İçerik</Text>
            <View style={styles.decryptedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.decryptedBadgeText}>Çözüldü</Text>
            </View>
          </View>
          <Text style={styles.contentText} selectable>{decryptedValue}</Text>
        </Card>
      );
    }
    
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
      let shareValue = data.value;
      
      // Eğer şifreli veri çözülmüşse, çözülmüş veriyi paylaş
      if (data.type === DATA_TYPES.PROTECTED && decryptedValue) {
        shareValue = decryptedValue;
      } 
      // Şifreli ve çözülmemişse kullanıcıya uyarı ver
      else if (data.type === DATA_TYPES.PROTECTED && !decryptedValue) {
        Alert.alert(
          'Şifreli İçerik',
          'İçerik şifrelenmiş. Paylaşmadan önce şifreyi çözmeniz gerekiyor.',
          [
            { text: 'Şifre Gir', onPress: () => setShowPasswordModal(true) },
            { text: 'İptal', style: 'cancel' }
          ]
        );
        return;
      }
      
      const message = `NFC Reader Pro ile tarandı: ${shareValue}`;
      
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
      navigation.navigate('WriteTag', { 
        initialData: scanResult.data.type === DATA_TYPES.PROTECTED && decryptedValue 
          ? decryptedValue 
          : scanResult.data.value 
      });
    } else {
      navigation.navigate('Subscription');
    }
  };

  // Şifre giriş modalı
  const renderPasswordModal = () => {
    return (
      <Modal
        transparent
        visible={showPasswordModal}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContainer}>
            <View style={styles.passwordModalHeader}>
              <Ionicons name="shield-outline" size={28} color={COLORS.primary} />
              <Text style={styles.passwordModalTitle}>Şifreli İçerik</Text>
            </View>
            
            <Text style={styles.passwordModalText}>
              Bu içerik şifre korumalıdır. Görüntülemek için şifreyi girin.
            </Text>
            
            <TextInput
              style={styles.passwordModalInput}
              placeholder="Şifre"
              placeholderTextColor={COLORS.textDisabled}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              onSubmitEditing={handleDecrypt}
            />
            
            {passwordError ? (
              <Text style={styles.passwordError}>{passwordError}</Text>
            ) : null}
            
            <View style={styles.passwordModalButtons}>
              <Button
                title="İptal"
                mode="text"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                style={styles.passwordModalCancelButton}
                textStyle={styles.passwordModalCancelButtonText}
              />
              <Button
                title="Şifreyi Çöz"
                onPress={handleDecrypt}
                style={styles.passwordModalDecryptButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
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
        
        {/* Premium olmayan kullanıcılar için depolama uyarısı */}
        {!isPremiumUser() && isStorageLimitReached && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Depolama Limiti Aşıldı</Text>
                <Text style={styles.warningText}>
                  Premium abonelikle sınırsız depolama elde edin.
                </Text>
              </View>
            </View>
            <Button
              title="Premium'a Geç"
              onPress={() => navigation.navigate('Home', { screen: 'Subscription' })}
              icon="star"
              style={styles.warningButton}
            />
          </Card>
        )}
        
        {/* Tag tipi bilgisi */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Etiket Türü</Text>
          <Text style={styles.infoText}>{scanResult.tagType}</Text>
          
          {isEncrypted && (
            <View style={styles.securityInfo}>
              <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
              <Text style={styles.securityText}>Şifre Korumalı</Text>
            </View>
          )}
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

      {/* Şifre Giriş Modalı */}
      {renderPasswordModal()}
      
      {/* CustomAlert ekleyeceğim */}
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
    paddingTop: 60,
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
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  securityText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.cardRadius,
    padding: SIZES.large,
    width: '90%',
    maxWidth: 350,
  },
  passwordModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  passwordModalTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 10,
  },
  passwordModalText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  passwordModalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.medium,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  passwordError: {
    color: COLORS.error,
    fontSize: SIZES.small,
    marginBottom: 8,
    textAlign: 'center',
  },
  passwordModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  passwordModalCancelButton: {
    flex: 1,
    marginRight: 8,
  },
  passwordModalCancelButtonText: {
    color: COLORS.textSecondary,
  },
  passwordModalDecryptButton: {
    flex: 2,
  },
  // Encrypted content styles
  encryptedContent: {
    alignItems: 'center',
    padding: SIZES.medium,
  },
  encryptedText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginVertical: 10,
  },
  unlockButton: {
    marginTop: 16,
  },
  decryptedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  decryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  decryptedBadgeText: {
    color: COLORS.success,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Depolama limiti uyarı kartı stilleri
  warningCard: {
    marginBottom: SIZES.medium,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  warningText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  warningButton: {
    marginTop: 12,
  },
});

export default ScanResultScreen; 
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import CustomAlert from '../components/CustomAlert';
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const ScanDetailScreen = ({ navigation, route }) => {
  // Store
  const { getScanById, deleteScan, updateScan } = useHistoryStore();
  const { canUseFeature } = useSubscriptionStore();
  
  // Tarama verisi
  const [scanData, setScanData] = useState(null);
  
  // Şifre koruması için state'ler
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [decryptedValue, setDecryptedValue] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  
  // Notlar (premium özelliği)
  const [notes, setNotes] = useState('');
  
  // Alert Durumu
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  useEffect(() => {
    // Route'dan scanId parametresini al
    const { scanId } = route.params || {};
    
    if (scanId) {
      // Geçmiş store'dan taramayı al
      const scan = getScanById(scanId);
      
      if (scan) {
        setScanData(scan);
        setNotes(scan.notes || '');
        
        // Şifreli içerik kontrolü
        if (scan.data.type === DATA_TYPES.PROTECTED) {
          setIsEncrypted(true);
          setShowPasswordModal(true);
        }
      } else {
        // Tarama bulunamadı, geri dön
        Alert.alert('Hata', 'Tarama kaydı bulunamadı.');
        navigation.goBack();
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
      
      if (!scanData || !scanData.data || !scanData.data.value) {
        setPasswordError('Şifreli içerik bulunamadı');
        return;
      }
      
      // Şifreyi çöz
      const decrypted = await NfcService.decryptTagData(scanData.data.value, password);
      
      // Çözme başarılı mı kontrol et - değişiklik yoksa muhtemelen yanlış şifre
      if (decrypted === scanData.data.value || !decrypted) {
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
  if (!scanData) {
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
    const { data } = scanData;
    
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
    
    // Normal içerik türleri
    switch (data.type) {
      case DATA_TYPES.TEXT:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Metin</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
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
      const { data } = scanData;
      let shareValue = data.value;
      
      // Eğer şifreli veri çözülmüşse, çözülmüş veriyi paylaş
      if (data.type === DATA_TYPES.PROTECTED && decryptedValue) {
        shareValue = decryptedValue;
      } 
      // Şifreli ve çözülmemişse kullanıcıya uyarı ver
      else if (data.type === DATA_TYPES.PROTECTED && !decryptedValue) {
        setAlertConfig({
          visible: true,
          title: 'Şifreli İçerik',
          message: 'İçerik şifrelenmiş. Paylaşmadan önce şifreyi çözmeniz gerekiyor.',
          type: 'warning',
          buttons: [
            { text: 'Şifre Gir', onPress: () => setShowPasswordModal(true) },
            { text: 'İptal', style: 'cancel' }
          ]
        });
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
  
  // Taramayı sil
  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Taramayı Sil',
      message: 'Bu tarama kaydını silmek istediğinize emin misiniz?',
      type: 'warning',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            deleteScan(scanData.id);
            navigation.goBack();
          },
        },
      ]
    });
  };
  
  // Yeni bir NFC etiketi yaz (premium özellik)
  const handleWriteTag = () => {
    if (canUseFeature('write')) {
      // Tab navigatorlar arasında doğru geçiş için stack adını belirtiyoruz
      navigation.navigate('Home', {
        screen: 'WriteTag',
        params: { 
          initialData: scanData.data.type === DATA_TYPES.PROTECTED && decryptedValue 
            ? decryptedValue 
            : scanData.data.value 
        }
      });
    } else {
      navigation.navigate('Subscription');
    }
  };
  
  // Notları kaydet
  const handleSaveNotes = () => {
    if (scanData) {
      updateScan(scanData.id, { notes });
      setAlertConfig({
        visible: true,
        title: 'Başarılı',
        message: 'Notlar kaydedildi.',
        type: 'success',
        buttons: [{ text: 'Tamam' }]
      });
    }
  };
  
  // Etiketi kilitle
  const handleLockTag = () => {
    if (!canUseFeature('lock')) {
      // Tab navigatorlar arasında doğru geçiş için
      navigation.navigate('Home', {
        screen: 'Subscription'
      });
      return;
    }

    // Kullanıcıya onay sor
    setAlertConfig({
      visible: true,
      title: 'Etiketi Kilitle',
      message: 'Bu NFC etiketini kilitlemeyi onaylıyor musunuz? Bu işlem geri alınamaz ve etiket bir daha değiştirilemez!',
      type: 'warning',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Kilitle', 
          style: 'destructive',
          onPress: performLockTag
        }
      ]
    });
  };

  // Kilitleme işlemini gerçekleştir
  const performLockTag = async () => {
    try {
      // Kilitleme işlemi başladı
      setAlertConfig({
        visible: true,
        title: 'İşlem Devam Ediyor',
        message: 'NFC etiketini telefonunuza yaklaştırın...',
        type: 'info',
        buttons: []
      });
      
      // NFC tag'i kilitle
      NfcService.lockTag(
        // Başarı callback
        (message) => {
          setAlertConfig({
            visible: true,
            title: 'Kilitleme Başarılı',
            message: 'NFC etiketi başarıyla kilitlendi. Artık bu etiket sadece okunabilir ve içeriği değiştirilemez.',
            type: 'success',
            buttons: [{ text: 'Tamam' }]
          });
        },
        // Hata callback
        (error) => {
          setAlertConfig({
            visible: true,
            title: 'Kilitleme Hatası',
            message: error || 'NFC etiketi kilitlenirken bir hata oluştu.',
            type: 'error',
            buttons: [{ text: 'Tamam' }]
          });
        }
      );
    } catch (error) {
      console.log('Kilitleme hatası:', error);
      setAlertConfig({
        visible: true,
        title: 'Kilitleme Hatası',
        message: 'NFC etiketi kilitlenirken bir hata oluştu: ' + error.message,
        type: 'error',
        buttons: [{ text: 'Tamam' }]
      });
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
        
        <Text style={styles.headerTitle}>Tarama Detayı</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarih ve saat bilgisi */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {new Date(scanData.timestamp).toLocaleString('tr-TR')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{scanData.tagType}</Text>
          </View>
          
          {isEncrypted && (
            <View style={styles.infoRow}>
              <Ionicons name="lock-closed" size={20} color={COLORS.primary} />
              <Text style={[styles.infoText, { color: COLORS.primary }]}>Şifre Korumalı</Text>
            </View>
          )}
        </Card>
        
        {/* Tarama içeriği */}
        {renderContentByType()}
        
        {/* Notlar Bölümü */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Notlar</Text>
            {canUseFeature('advanced_history') ? (
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveNotes}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            ) : (
              <PremiumBadge small />
            )}
          </View>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Bu tarama hakkında notlar ekleyin..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={canUseFeature('advanced_history')}
          />
          
          {!canUseFeature('advanced_history') && (
            <View style={styles.premiumNotesInfo}>
              <Text style={styles.premiumNotesText}>
                Not eklemek için premium aboneliğe geçin
              </Text>
              <Button
                title="Premium'a Geç"
                style={styles.premiumButton}
                small
                onPress={() => navigation.navigate('Subscription')}
              />
            </View>
          )}
        </Card>
        
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
        
        {/* Etiket Kilitleme özelliği */}
        <Card style={styles.lockCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>NFC Etiketi Kilitleme</Text>
            {!canUseFeature('lock') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            NFC etiketini kilitleyin. Kilitlenen etiket bir daha değiştirilemez ve daima aynı veriyi gösterir.
          </Text>
          
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
            <Text style={styles.warningBoxText}>
              Dikkat: Bu işlem geri alınamaz!
            </Text>
          </View>
          
          <Button
            title="NFC Etiketi Kilitle"
            type={canUseFeature('lock') ? 'primary' : 'outline'}
            onPress={handleLockTag}
            leftIcon={
              <Ionicons 
                name="lock-closed" 
                size={18} 
                color={canUseFeature('lock') ? COLORS.text : COLORS.primary} 
              />
            }
            style={styles.writeButton}
          />
        </Card>
      </ScrollView>
      
      {/* Şifre Giriş Modalı */}
      {renderPasswordModal()}
      
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  content: {
    padding: SIZES.screenPadding,
  },
  infoCard: {
    marginBottom: SIZES.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: 8,
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
  notesCard: {
    marginBottom: SIZES.medium,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.medium,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: SIZES.small,
  },
  premiumNotesInfo: {
    marginTop: SIZES.medium,
    alignItems: 'center',
  },
  premiumNotesText: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontSize: SIZES.small,
  },
  premiumButton: {
    marginTop: 8,
  },
  lockCard: {
    marginTop: SIZES.small,
    marginBottom: SIZES.large,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: SIZES.borderRadius,
    padding: SIZES.small,
    marginVertical: SIZES.small,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  warningBoxText: {
    color: COLORS.warning,
    marginLeft: 8,
    fontWeight: '600',
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
});

export default ScanDetailScreen; 
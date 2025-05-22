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
import CategorySelector from '../components/CategorySelector';
import CustomAlert from '../components/CustomAlert';
import PremiumBadge from '../components/PremiumBadge';
import TagInput from '../components/TagInput';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore, { DEFAULT_CATEGORIES } from '../features/history/historyStore';
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const ScanDetailScreen = ({ navigation, route }) => {
  // Store
  const { getScanById, deleteScan, updateScan, allTags, assignCategory, toggleFavorite } = useHistoryStore();
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
  
  // Gelişmiş geçmiş yönetimi ile ilgili state'ler
  const [tags, setTags] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('other');
  const [isFavorite, setIsFavorite] = useState(false);
  
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
        
        // Gelişmiş geçmiş yönetimi alanları
        setTags(scan.tags || []);
        setSelectedCategoryId(scan.categoryId || 'other');
        setIsFavorite(scan.isFavorite || false);
        
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
  
  // Kategori değişikliği
  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    if (scanData) {
      assignCategory(scanData.id, categoryId);
      setScanData({
        ...scanData,
        categoryId
      });
    }
  };
  
  // Etiket ekleme
  const handleAddTag = (tag) => {
    if (scanData) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      
      updateScan(scanData.id, { tags: updatedTags });
      setScanData({
        ...scanData,
        tags: updatedTags
      });
    }
  };
  
  // Etiket silme
  const handleRemoveTag = (tag) => {
    if (scanData) {
      const updatedTags = tags.filter(t => t !== tag);
      setTags(updatedTags);
      
      updateScan(scanData.id, { tags: updatedTags });
      setScanData({
        ...scanData,
        tags: updatedTags
      });
    }
  };
  
  // Favoriye ekleme/çıkarma
  const handleToggleFavorite = () => {
    if (scanData) {
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);
      
      toggleFavorite(scanData.id);
      setScanData({
        ...scanData,
        isFavorite: newFavoriteStatus
      });
    }
  };
  
  // Notları kaydet
  const handleSaveNotes = () => {
    if (scanData) {
      updateScan(scanData.id, { notes });
      setScanData({
        ...scanData,
        notes
      });
      
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
  
  // Yeni bir handleDataMerge fonksiyonu ekle
  const handleDataMerge = () => {
    if (canUseFeature('data_merge')) {
      // Tab navigatorlar arasında doğru geçiş için stack adını belirtiyoruz
      navigation.navigate('Home', {
        screen: 'DataMerge'
      });
    } else {
      navigation.navigate('Home', {
        screen: 'Subscription'
      });
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
          
          {/* Favori butonu */}
          <TouchableOpacity 
            style={[styles.favoriteButton, isFavorite ? styles.favoriteActive : null]} 
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "star" : "star-outline"} 
              size={20} 
              color={isFavorite ? COLORS.premium : COLORS.textSecondary} 
            />
            <Text style={[styles.favoriteText, isFavorite ? styles.favoriteTextActive : null]}>
              {isFavorite ? 'Favorilerde' : 'Favorilere Ekle'}
            </Text>
          </TouchableOpacity>
        </Card>
        
        {/* Tarama içeriği */}
        {renderContentByType()}
        
        {/* Kategori Seçici - ADVANCED_HISTORY premium özelliği */}
        {canUseFeature('advanced_history') ? (
          <Card style={styles.categoryCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Kategori</Text>
            </View>
            
            <CategorySelector 
              categories={DEFAULT_CATEGORIES}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleCategoryChange}
            />
          </Card>
        ) : (
          <Card style={styles.premiumFeatureCard}>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureTextContainer}>
                <Text style={styles.premiumFeatureTitle}>
                  Gelişmiş Geçmiş Yönetimi
                </Text>
                <Text style={styles.premiumFeatureDescription}>
                  Taramaları kategorilere ayır, etiketle, filtrele ve daha fazlası
                </Text>
              </View>
              <PremiumBadge />
            </View>
            
            <Button
              title="Premium'a Yükselt"
              onPress={() => navigation.navigate('Home', { screen: 'Subscription' })}
              style={styles.premiumFeatureButton}
              icon="star"
            />
          </Card>
        )}
        
        {/* Etiket Girişi - ADVANCED_HISTORY premium özelliği */}
        {canUseFeature('advanced_history') && (
          <Card style={styles.tagsCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Etiketler</Text>
            </View>
            
            <TagInput
              tags={tags}
              availableTags={allTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              maxTags={5}
            />
          </Card>
        )}
        
        {/* Notlar Bölümü */}
        <Card style={styles.notesCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Notlar</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Not ekleyin..."
            placeholderTextColor={COLORS.textDisabled}
            value={notes}
            onChangeText={setNotes}
          />
          
          <Button
            title="Notları Kaydet"
            onPress={handleSaveNotes}
            icon="save-outline"
            style={styles.saveButton}
          />
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
            leftIcon={<Ionicons name="create" size={18} color={canUseFeature('write') ? COLORS.text : COLORS.primary} />}
            style={styles.writeButton}
          />
        </Card>
        
        {/* Etiket Kilitleme özelliği */}
        <Card style={styles.writeCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>NFC Etiketi Kilitle</Text>
            {!canUseFeature('lock') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            NFC etiketini kalıcı olarak kilitleyerek içeriğini koruyun.
          </Text>
          
          <Button
            title="NFC Etiketi Kilitle"
            type={canUseFeature('lock') ? 'primary' : 'outline'}
            onPress={handleLockTag}
            leftIcon={<Ionicons name="lock-closed" size={18} color={canUseFeature('lock') ? COLORS.text : COLORS.primary} />}
            style={styles.writeButton}
          />
        </Card>
        
        {/* Veri Birleştirme */}
        {canUseFeature('data_merge') && (
          <Card style={styles.mergeCard}>
            <View style={styles.writeCardHeader}>
              <Text style={styles.writeCardTitle}>Veri Birleştir</Text>
            </View>
            
            <Text style={styles.writeCardText}>
              Bu taramayı veri birleştirme işlemine ekle.
            </Text>
            
            <Button
              title="Veri Birleştirmeye Ekle"
              onPress={handleDataMerge}
              leftIcon={<Ionicons name="git-merge" size={18} color={COLORS.text} />}
              style={styles.writeButton}
            />
          </Card>
        )}
      </ScrollView>
      
      {/* Şifre Modalı */}
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
    marginBottom: SIZES.small,
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
    marginBottom: SIZES.small,
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
    marginBottom: SIZES.small,
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
    marginBottom: SIZES.small,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
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
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  favoriteActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
  },
  favoriteText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  favoriteTextActive: {
    color: COLORS.premium,
    fontWeight: 'bold',
  },
  categoryCard: {
    marginBottom: SIZES.small,
  },
  premiumFeatureCard: {
    marginBottom: SIZES.small,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.premium,
  },
  premiumFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumFeatureTextContainer: {
    flex: 1,
  },
  premiumFeatureTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  premiumFeatureButton: {
    marginTop: 12,
  },
  tagsCard: {
    marginBottom: SIZES.small,
  },
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
  mergeCard: {
    marginTop: SIZES.small,
    marginBottom: SIZES.small,
  },
});

export default ScanDetailScreen; 
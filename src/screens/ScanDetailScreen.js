import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['scanDetail', 'common']);
  
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
        Alert.alert(t('common:alerts.error'), t('errors.scanNotFound'));
        navigation.goBack();
      }
    }
  }, [route.params]);
  
  // Şifreyi kontrol et ve içeriği çöz
  const handleDecrypt = async () => {
    try {
      if (!password) {
        setPasswordError(t('password.error.empty'));
        return;
      }
      
      if (!scanData || !scanData.data || !scanData.data.value) {
        setPasswordError(t('password.error.noEncryptedContent'));
        return;
      }
      
      // Şifreyi çöz
      const decrypted = await NfcService.decryptTagData(scanData.data.value, password);
      
      // Çözme başarılı mı kontrol et - değişiklik yoksa muhtemelen yanlış şifre
      if (decrypted === scanData.data.value || !decrypted) {
        setPasswordError(t('password.error.incorrect'));
        return;
      }
      
      // Başarılı çözme
      setDecryptedValue(decrypted);
      setShowPasswordModal(false);
      setPasswordError('');
    } catch (error) {
      console.log('Şifre çözme hatası:', error);
      setPasswordError(error.message || t('password.error.decryptFailed'));
    }
  };
  
  // Eğer tarama sonucu yoksa
  if (!scanData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
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
          <Text style={styles.contentTitle}>{t('content.encrypted.title')}</Text>
          <View style={styles.encryptedContent}>
            <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
            <Text style={styles.encryptedText}>
              {t('content.encrypted.description')}
            </Text>
            <Button
              title={t('content.encrypted.enterPassword')}
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
            <Text style={styles.contentTitle}>{t('content.decrypted.title')}</Text>
            <View style={styles.decryptedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.decryptedBadgeText}>{t('content.decrypted.badge')}</Text>
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
            <Text style={styles.contentTitle}>{t('content.types.text')}</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
          </Card>
        );
        
      case DATA_TYPES.URL:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>{t('content.types.url')}</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title={t('actions.openUrl')}
              onPress={() => Linking.openURL(data.value)}
              leftIcon={<Ionicons name="open" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      case DATA_TYPES.PHONE:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>{t('content.types.phone')}</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <View style={styles.actionRow}>
              <Button
                title={t('actions.call')}
                onPress={() => Linking.openURL(`tel:${data.value}`)}
                leftIcon={<Ionicons name="call" size={18} color={COLORS.text} />}
                style={styles.actionButton}
              />
              <Button
                title={t('actions.sendMessage')}
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
            <Text style={styles.contentTitle}>{t('content.types.email')}</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title={t('actions.sendEmail')}
              onPress={() => Linking.openURL(`mailto:${data.value}`)}
              leftIcon={<Ionicons name="mail" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      default:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>{t('content.types.data')}</Text>
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
          title: t('alerts.encryptedContent.title'),
          message: t('alerts.encryptedContent.message'),
          type: 'warning',
          buttons: [
            { text: t('password.enterPassword'), onPress: () => setShowPasswordModal(true) },
            { text: t('common:actions.cancel'), style: 'cancel' }
          ]
        });
        return;
      }
      
      const message = t('share.message', { value: shareValue });
      
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
      title: t('delete.title'),
      message: t('delete.message'),
      type: 'warning',
      buttons: [
        { text: t('common:actions.cancel'), style: 'cancel' },
        { 
          text: t('delete.button'), 
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
        title: t('common:alerts.success'),
        message: t('notes.saveSuccess'),
        type: 'success',
        buttons: [{ text: t('common:alerts.ok') }]
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
      title: t('lock.title'),
      message: t('lock.confirmMessage'),
      type: 'warning',
      buttons: [
        { text: t('common:actions.cancel'), style: 'cancel' },
        { 
          text: t('lock.button'), 
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
        title: t('lock.process.title'),
        message: t('lock.process.message'),
        type: 'info',
        buttons: []
      });
      
      // NFC tag'i kilitle
      NfcService.lockTag(
        // Başarı callback
        (message) => {
          setAlertConfig({
            visible: true,
            title: t('lock.success.title'),
            message: t('lock.success.message'),
            type: 'success',
            buttons: [{ text: t('common:alerts.ok') }]
          });
        },
        // Hata callback
        (error) => {
          setAlertConfig({
            visible: true,
            title: t('lock.error.title'),
            message: error || t('lock.error.message'),
            type: 'error',
            buttons: [{ text: t('common:alerts.ok') }]
          });
        }
      );
    } catch (error) {
      console.log('Kilitleme hatası:', error);
      setAlertConfig({
        visible: true,
        title: t('lock.error.title'),
        message: t('lock.error.message') + ': ' + error.message,
        type: 'error',
        buttons: [{ text: t('common:alerts.ok') }]
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
              <Text style={styles.passwordModalTitle}>{t('password.modal.title')}</Text>
            </View>
            
            <Text style={styles.passwordModalText}>
              {t('password.modal.description')}
            </Text>
            
            <TextInput
              style={styles.passwordModalInput}
              placeholder={t('password.modal.placeholder')}
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
                title={t('common:actions.cancel')}
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
                title={t('password.modal.decrypt')}
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
        
        <Text style={styles.headerTitle}>{t('title')}</Text>
        
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
              <Text style={[styles.infoText, { color: COLORS.primary }]}>{t('content.encrypted.status')}</Text>
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
              {isFavorite ? t('favorite.active') : t('favorite.add')}
            </Text>
          </TouchableOpacity>
        </Card>
        
        {/* Tarama içeriği */}
        {renderContentByType()}
        
        {/* Kategori Seçici - ADVANCED_HISTORY premium özelliği */}
        {canUseFeature('advanced_history') ? (
          <Card style={styles.categoryCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{t('category.title')}</Text>
            </View>
            
            <CategorySelector 
              categories={Object.entries(DEFAULT_CATEGORIES).reduce((acc, [key, category]) => ({
                ...acc,
                [category.id]: {
                  ...category,
                  name: t(category.name)
                }
              }), {})}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleCategoryChange}
            />
          </Card>
        ) : (
          <Card style={styles.premiumFeatureCard}>
            <View style={styles.premiumFeatureRow}>
              <View style={styles.premiumFeatureTextContainer}>
                <Text style={styles.premiumFeatureTitle}>
                  {t('premium.advancedHistory.title')}
                </Text>
                <Text style={styles.premiumFeatureDescription}>
                  {t('premium.advancedHistory.description')}
                </Text>
              </View>
              <PremiumBadge />
            </View>
            
            <Button
              title={t('premium.upgradeButton')}
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
              <Text style={styles.cardTitle}>{t('tags.title')}</Text>
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
            <Text style={styles.cardTitle}>{t('notes.title')}</Text>
          </View>
          
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder={t('notes.placeholder')}
            placeholderTextColor={COLORS.textDisabled}
            value={notes}
            onChangeText={setNotes}
          />
          
          <Button
            title={t('notes.saveButton')}
            onPress={handleSaveNotes}
            icon="save-outline"
            style={styles.saveButton}
          />
        </Card>
        
        {/* Yazma özelliği */}
        <Card style={styles.writeCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>{t('write.title')}</Text>
            {!canUseFeature('write') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            {t('write.description')}
          </Text>
          
          <Button
            title={t('write.button')}
            type={canUseFeature('write') ? 'primary' : 'outline'}
            onPress={handleWriteTag}
            leftIcon={<Ionicons name="create" size={18} color={canUseFeature('write') ? COLORS.text : COLORS.primary} />}
            style={styles.writeButton}
          />
        </Card>
        
        {/* Etiket Kilitleme özelliği */}
        <Card style={styles.writeCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>{t('lock.cardTitle')}</Text>
            {!canUseFeature('lock') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            {t('lock.description')}
          </Text>
          
          <Button
            title={t('lock.button')}
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
              <Text style={styles.writeCardTitle}>{t('merge.title')}</Text>
            </View>
            
            <Text style={styles.writeCardText}>
              {t('merge.description')}
            </Text>
            
            <Button
              title={t('merge.button')}
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
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
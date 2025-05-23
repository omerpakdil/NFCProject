import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const WriteTagScreen = ({ navigation, route }) => {
  // Translation hook
  const { t } = useTranslation('write');
  
  // Animation ref
  const animationRef = useRef(null);
  
  // Store
  const { canUseFeature } = useSubscriptionStore();
  
  // States
  const [isWriting, setIsWriting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [writeStatus, setWriteStatus] = useState(null); // null, 'success', 'error'
  const [dataType, setDataType] = useState(DATA_TYPES.TEXT);
  const [dataValue, setDataValue] = useState('');
  const [hasNfc, setHasNfc] = useState(null);
  const [shouldLockTag, setShouldLockTag] = useState(false);
  const [shouldPasswordProtect, setShouldPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  useEffect(() => {
    // Premium özelliği kontrol et
    if (!canUseFeature('write')) {
      setAlertConfig({
        visible: true,
        title: t('alerts.premiumFeature.title'),
        message: t('alerts.premiumFeature.message'),
        type: 'info',
        buttons: [
          { 
            text: t('alerts.premiumFeature.upgrade'), 
            onPress: () => navigation.navigate('Subscription') 
          },
          { 
            text: t('alerts.premiumFeature.cancel'), 
            style: 'cancel',
            onPress: () => navigation.goBack() 
          },
        ]
      });
      return;
    }
    
    // NFC kontrolü
    const checkNfc = async () => {
      const nfcAvailable = await NfcService.init();
      setHasNfc(nfcAvailable);
      
      if (!nfcAvailable) {
        setAlertConfig({
          visible: true,
          title: t('alerts.nfcUnavailable.title'),
          message: t('alerts.nfcUnavailable.message'),
          type: 'error',
          buttons: [
            { 
              text: t('buttons.cancel'), 
              onPress: () => navigation.goBack() 
            }
          ]
        });
      }
    };
    
    checkNfc();
    
    // Route'dan initialData parametresi kontrolü
    const { initialData } = route.params || {};
    if (initialData) {
      setDataValue(initialData);
    }
    
    // Component unmount olduğunda temizle
    return () => {
      NfcService.cleanup();
    };
  }, [t]);
  
  // Şifre kontrolü
  const validatePassword = () => {
    if (!shouldPasswordProtect) return true;
    
    if (!password) {
      setAlertConfig({
        visible: true,
        title: t('alerts.passwordRequired.title'),
        message: t('alerts.passwordRequired.message'),
        type: 'error',
        buttons: [{ text: t('buttons.cancel') }]
      });
      return false;
    }
    
    if (password.length < 4) {
      setAlertConfig({
        visible: true,
        title: t('alerts.passwordTooShort.title'),
        message: t('alerts.passwordTooShort.message'),
        type: 'error',
        buttons: [{ text: t('buttons.cancel') }]
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      setAlertConfig({
        visible: true,
        title: t('alerts.passwordMismatch.title'),
        message: t('alerts.passwordMismatch.message'),
        type: 'error',
        buttons: [{ text: t('buttons.cancel') }]
      });
      return false;
    }
    
    return true;
  };
  
  // Etiket yazma işlemi başlat
  const handleWrite = async () => {
    if (!dataValue.trim()) {
      setAlertConfig({
        visible: true,
        title: t('alerts.invalidContent.title'),
        message: t('alerts.invalidContent.message'),
        type: 'error',
        buttons: [{ text: t('buttons.cancel') }]
      });
      return;
    }
    
    // Şifre kullanılıyorsa doğrula
    if (shouldPasswordProtect && !validatePassword()) {
      return;
    }
    
    try {
      setIsWriting(true);
      setWriteStatus(null);
      
      // Şifreli mi yoksa normal mi yazalım?
      if (shouldPasswordProtect && canUseFeature('password_protection')) {
        // Şifreli yazma
        NfcService.writeProtectedTag(
          { type: dataType, value: dataValue },
          password,
          // Başarı callback
          (message) => {
            handleWriteSuccess(message);
          },
          // Hata callback
          (error) => {
            handleWriteError(error);
          }
        );
      } else {
        // Normal yazma
        NfcService.writeTag(
          { type: dataType, value: dataValue },
          // Başarı callback
          (message) => {
            handleWriteSuccess(message);
          },
          // Hata callback
          (error) => {
            handleWriteError(error);
          }
        );
      }
    } catch (error) {
      console.log('Yazma hatası:', error);
      handleWriteError('NFC etiketi yazılırken bir hata oluştu: ' + error.message);
    }
  };
  
  // Başarılı yazma
  const handleWriteSuccess = (message) => {
    setIsWriting(false);
    setWriteStatus('success');
    
    // Başarılı animasyonu oynat
    if (animationRef.current) {
      animationRef.current.play(0, 60);
    }
    
    // Eğer kilitleme seçilmişse, kullanıcıya onay sor
    if (shouldLockTag && canUseFeature('lock')) {
      setTimeout(() => {
        setAlertConfig({
          visible: true,
          title: t('alerts.confirmLock.title'),
          message: t('alerts.confirmLock.message'),
          type: 'warning',
          buttons: [
            { 
              text: t('buttons.cancel'), 
              style: 'cancel',
              onPress: () => {
                setAlertConfig({
                  visible: true,
                  title: t('status.success'),
                  message: message || t('status.success'),
                  type: 'success',
                  buttons: [{ text: t('buttons.cancel') }]
                });
              }
            },
            { 
              text: t('alerts.confirmLock.confirm'), 
              style: 'destructive',
              onPress: handleLockTag
            }
          ]
        });
      }, 1200);
    } else {
      // Kilitleme seçilmemişse normal başarı mesajı
      setTimeout(() => {
        setAlertConfig({
          visible: true,
          title: t('status.success'),
          message: message || (shouldPasswordProtect ? t('status.successProtected') : t('status.success')),
          type: 'success',
          buttons: [{ text: t('buttons.cancel') }]
        });
      }, 1200);
    }
  };
  
  // Yazma hatası
  const handleWriteError = (error) => {
    setIsWriting(false);
    setWriteStatus('error');
    setAlertConfig({
      visible: true,
      title: t('status.error'),
      message: error || t('status.error'),
      type: 'error',
      buttons: [{ text: t('buttons.cancel') }]
    });
  };
  
  // Etiket kilitleme işlemi
  const handleLockTag = async () => {
    try {
      setIsLocking(true);
      
      // NFC tag'i kilitle
      NfcService.lockTag(
        // Başarı callback
        (message) => {
          setIsLocking(false);
          setAlertConfig({
            visible: true,
            title: t('alerts.lockSuccess.title'),
            message: t('alerts.lockSuccess.message'),
            type: 'success',
            buttons: [{ text: t('buttons.cancel') }]
          });
        },
        // Hata callback
        (error) => {
          setIsLocking(false);
          setAlertConfig({
            visible: true,
            title: t('alerts.lockError.title'),
            message: error || t('alerts.lockError.message'),
            type: 'error',
            buttons: [{ text: t('buttons.cancel') }]
          });
        }
      );
    } catch (error) {
      console.log('Kilitleme hatası:', error);
      setIsLocking(false);
      setAlertConfig({
        visible: true,
        title: t('alerts.lockError.title'),
        message: t('alerts.lockError.message') + ': ' + error.message,
        type: 'error',
        buttons: [{ text: t('buttons.cancel') }]
      });
    }
  };
  
  // Veri tipi seçim butonu
  const renderDataTypeButton = (type, icon, label) => {
    const isSelected = dataType === type;
    
    return (
      <TouchableOpacity
        style={[
          styles.typeButton,
          isSelected && styles.typeButtonSelected,
        ]}
        onPress={() => setDataType(type)}
      >
        <View style={styles.typeIconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={isSelected ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
        <Text
          style={[
            styles.typeLabel,
            isSelected && styles.typeLabelSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Yazma durumu animasyonu
  const renderWriteStatus = () => {
    if (!isWriting && !writeStatus) return null;
    
    return (
      <View style={styles.statusContainer}>
        {isWriting ? (
          <>
            <LottieView
              source={require('../assets/animations/nfc-writing.json')}
              autoPlay
              loop
              style={styles.statusAnimation}
            />
            <Text style={styles.statusText}>
              {t('status.writing')}
            </Text>
          </>
        ) : writeStatus === 'success' ? (
          <>
            <LottieView
              ref={animationRef}
              source={require('../assets/animations/success.json')}
              loop={false}
              style={styles.statusAnimation}
            />
            <Text style={styles.successText}>{t('status.success')}</Text>
          </>
        ) : (
          <>
            <LottieView
              source={require('../assets/animations/error.json')}
              autoPlay
              loop={false}
              style={styles.statusAnimation}
            />
            <Text style={styles.errorText}>{t('status.error')}</Text>
          </>
        )}
      </View>
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
        <Text style={styles.headerTitle}>{t('title')}</Text>
        <View style={styles.emptySpace} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Durum */}
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons 
                  name={hasNfc ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={hasNfc ? COLORS.success : COLORS.error} 
                />
              </View>
              <View>
                <Text style={styles.infoTitle}>
                  NFC {hasNfc ? t('nfc.available') : t('nfc.unavailable')}
                </Text>
                <Text style={styles.infoText}>
                  {hasNfc 
                    ? t('nfc.instructions') 
                    : t('nfc.error')}
                </Text>
              </View>
            </View>
          </Card>
          
          {/* Veri Tipi Seçimi */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('dataType.title')}</Text>
            
            <View style={styles.typeButtonsContainer}>
              {renderDataTypeButton(DATA_TYPES.TEXT, 'text', t('dataType.text'))}
              {renderDataTypeButton(DATA_TYPES.URL, 'link', t('dataType.url'))}
              {renderDataTypeButton(DATA_TYPES.PHONE, 'call', t('dataType.phone'))}
              {renderDataTypeButton(DATA_TYPES.EMAIL, 'mail', t('dataType.email'))}
            </View>
          </Card>
          
          {/* Veri İçeriği */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('content.label')}</Text>
            
            {dataType === DATA_TYPES.URL && (
              <Text style={styles.helperText}>
                {t('content.helper.url')}
              </Text>
            )}
            
            {dataType === DATA_TYPES.PHONE && (
              <Text style={styles.helperText}>
                {t('content.helper.phone')}
              </Text>
            )}
            
            <TextInput
              style={styles.dataInput}
              placeholder={
                dataType === DATA_TYPES.TEXT ? t('content.placeholder.text') :
                dataType === DATA_TYPES.URL ? t('content.placeholder.url') :
                dataType === DATA_TYPES.PHONE ? t('content.placeholder.phone') :
                dataType === DATA_TYPES.EMAIL ? t('content.placeholder.email') :
                t('content.placeholder.default')
              }
              placeholderTextColor={COLORS.textDisabled}
              value={dataValue}
              onChangeText={setDataValue}
              multiline={dataType === DATA_TYPES.TEXT}
              keyboardType={
                dataType === DATA_TYPES.PHONE ? 'phone-pad' :
                dataType === DATA_TYPES.URL ? 'url' :
                dataType === DATA_TYPES.EMAIL ? 'email-address' :
                'default'
              }
              autoCapitalize={
                dataType === DATA_TYPES.URL || dataType === DATA_TYPES.EMAIL ?
                'none' : 'sentences'
              }
            />
          </Card>
          
          {/* Güvenlik Seçenekleri (Premium) */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('protection.title')}</Text>
            
            {/* Şifre Koruma Seçeneği */}
            <TouchableOpacity 
              style={[styles.securityOption, { marginBottom: 8 }]}
              onPress={() => {
                if (canUseFeature('password_protection')) {
                  setShouldPasswordProtect(!shouldPasswordProtect);
                } else {
                  navigation.navigate('Subscription');
                }
              }}
            >
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  shouldPasswordProtect && canUseFeature('password_protection') && styles.checkboxChecked
                ]}>
                  {shouldPasswordProtect && canUseFeature('password_protection') && (
                    <Ionicons name="checkmark" size={16} color={COLORS.text} />
                  )}
                </View>
              </View>
              
              <View style={styles.securityOptionContent}>
                <View style={styles.securityOptionHeader}>
                  <Text style={styles.securityOptionTitle}>{t('protection.password.title')}</Text>
                  {!canUseFeature('password_protection') && <Ionicons name="star" size={18} color={COLORS.premium} />}
                </View>
                
                <Text style={styles.securityOptionDescription}>
                  {t('protection.password.description')}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Şifre alanı - şifre koruması seçildiyse göster */}
            {shouldPasswordProtect && canUseFeature('password_protection') && (
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>{t('protection.password.label')}</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('protection.password.minLength')}
                  placeholderTextColor={COLORS.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <Text style={[styles.passwordLabel, { marginTop: 12 }]}>{t('protection.password.confirm')}</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('protection.password.confirmPlaceholder')}
                  placeholderTextColor={COLORS.textDisabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <View style={styles.passwordInfo}>
                  <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.passwordInfoText}>
                    {t('protection.password.warning')}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Etiket Kilitleme Seçeneği */}
            <TouchableOpacity 
              style={styles.securityOption}
              onPress={() => setShouldLockTag(!shouldLockTag)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  shouldLockTag && styles.checkboxChecked
                ]}>
                  {shouldLockTag && (
                    <Ionicons name="checkmark" size={16} color={COLORS.text} />
                  )}
                </View>
              </View>
              
              <View style={styles.securityOptionContent}>
                <View style={styles.securityOptionHeader}>
                  <Text style={styles.securityOptionTitle}>{t('protection.lock.title')}</Text>
                  <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
                </View>
                
                <Text style={styles.securityOptionDescription}>
                  {t('protection.lock.description')}
                </Text>
              </View>
            </TouchableOpacity>
            
            {shouldLockTag && (
              <View style={styles.helpBox}>
                <View style={styles.helpIconContainer}>
                  <Ionicons name="information-circle" size={22} color={COLORS.info} />
                  <Text style={styles.helpTitle}>{t('protection.lock.infoTitle')}</Text>
                </View>
                <View style={styles.helpContent}>
                  <Text style={styles.helpText}>
                    {t('protection.lock.infoText')}
                  </Text>
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.warningText}>
                      {t('protection.lock.warning')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
          
          {/* Yazma Durumu */}
          {renderWriteStatus()}
          
          {/* Yazma Butonu */}
          <Button
            title={t('buttons.write')}
            onPress={handleWrite}
            disabled={!hasNfc || isWriting || isLocking || !dataValue.trim()}
            loading={isWriting || isLocking}
            style={styles.writeButton}
            leftIcon={!isWriting && !isLocking && <Ionicons name="create" size={20} color={COLORS.text} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      
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
  emptySpace: {
    width: 40,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: SIZES.screenPadding,
  },
  infoCard: {
    marginBottom: SIZES.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.small,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
  },
  typeIconContainer: {
    marginRight: 6,
  },
  typeLabel: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
  },
  typeLabelSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    marginBottom: 8,
  },
  dataInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.medium,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: SIZES.medium,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.medium,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  securityOptionContent: {
    flex: 1,
  },
  securityOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  securityOptionTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  securityOptionDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: SIZES.medium,
  },
  statusAnimation: {
    width: 120,
    height: 120,
  },
  statusText: {
    color: COLORS.text,
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginTop: SIZES.small,
  },
  successText: {
    color: COLORS.success,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginTop: SIZES.small,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginTop: SIZES.small,
  },
  writeButton: {
    marginTop: SIZES.medium,
    marginBottom: SIZES.large,
  },
  helpBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: SIZES.borderRadius,
    padding: SIZES.medium,
    marginTop: SIZES.medium,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  helpIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  helpContent: {
    flexDirection: 'column',
  },
  helpTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.tiny,
    marginLeft: SIZES.small,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    marginBottom: SIZES.medium,
    lineHeight: 18,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: SIZES.small,
    borderRadius: SIZES.borderRadius,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: SIZES.small,
    marginLeft: SIZES.small,
    fontWeight: '600',
  },
  passwordContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.medium,
    marginVertical: SIZES.small,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  passwordLabel: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.medium,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    borderRadius: SIZES.borderRadius,
    padding: SIZES.small,
  },
  passwordInfoText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    marginLeft: 8,
    flex: 1,
  },
});

export default WriteTagScreen; 
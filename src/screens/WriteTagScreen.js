import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
        title: 'Premium Özellik',
        message: 'NFC yazma özelliği sadece premium aboneler için kullanılabilir.',
        type: 'info',
        buttons: [
          { 
            text: 'Premium\'a Geç', 
            onPress: () => navigation.navigate('Subscription') 
          },
          { 
            text: 'Geri Dön', 
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
          title: 'NFC Kullanılamıyor',
          message: 'Bu cihaz NFC desteklemiyor veya NFC devre dışı bırakılmış.',
          type: 'error',
          buttons: [
            { 
              text: 'Tamam', 
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
  }, []);
  
  // Şifre kontrolü
  const validatePassword = () => {
    if (!shouldPasswordProtect) return true;
    
    if (!password) {
      setAlertConfig({
        visible: true,
        title: 'Şifre Gerekli',
        message: 'Lütfen bir şifre girin.',
        type: 'error',
        buttons: [{ text: 'Tamam' }]
      });
      return false;
    }
    
    if (password.length < 4) {
      setAlertConfig({
        visible: true,
        title: 'Şifre Çok Kısa',
        message: 'Şifre en az 4 karakter uzunluğunda olmalıdır.',
        type: 'error',
        buttons: [{ text: 'Tamam' }]
      });
      return false;
    }
    
    if (password !== confirmPassword) {
      setAlertConfig({
        visible: true,
        title: 'Şifreler Eşleşmiyor',
        message: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.',
        type: 'error',
        buttons: [{ text: 'Tamam' }]
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
        title: 'Hata',
        message: 'Lütfen yazmak istediğiniz veriyi girin.',
        type: 'error',
        buttons: [{ text: 'Tamam' }]
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
          title: 'Etiketi Kilitle',
          message: 'NFC etiketi başarıyla yazıldı. Şimdi etiketi kilitlemek istiyor musunuz? Bu işlem geri alınamaz ve etiket bir daha yazılamaz.',
          type: 'warning',
          buttons: [
            { 
              text: 'İptal', 
              style: 'cancel',
              onPress: () => {
                setAlertConfig({
                  visible: true,
                  title: 'Başarılı',
                  message: message || 'NFC etiketi başarıyla yazıldı.',
                  type: 'success',
                  buttons: [{ text: 'Tamam' }]
                });
              }
            },
            { 
              text: 'Kilitle', 
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
          title: 'Başarılı',
          message: message || (shouldPasswordProtect ? 'NFC etiketi başarıyla şifrelendi ve yazıldı.' : 'NFC etiketi başarıyla yazıldı.'),
          type: 'success',
          buttons: [{ text: 'Tamam' }]
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
      title: 'Hata',
      message: error || 'NFC etiketi yazılırken bir hata oluştu.',
      type: 'error',
      buttons: [{ text: 'Tamam' }]
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
            title: 'Kilitleme Başarılı',
            message: 'NFC etiketi başarıyla kilitlendi. Artık bu etiket sadece okunabilir ve içeriği değiştirilemez.',
            type: 'success',
            buttons: [{ text: 'Tamam' }]
          });
        },
        // Hata callback
        (error) => {
          setIsLocking(false);
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
      setIsLocking(false);
      setAlertConfig({
        visible: true,
        title: 'Kilitleme Hatası',
        message: 'NFC etiketi kilitlenirken bir hata oluştu: ' + error.message,
        type: 'error',
        buttons: [{ text: 'Tamam' }]
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
              Yazılıyor... NFC etiketini cihazınıza yaklaştırın.
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
            <Text style={styles.successText}>Yazma Başarılı!</Text>
          </>
        ) : (
          <>
            <LottieView
              source={require('../assets/animations/error.json')}
              autoPlay
              loop={false}
              style={styles.statusAnimation}
            />
            <Text style={styles.errorText}>Yazma Hatası</Text>
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
        <Text style={styles.headerTitle}>NFC Etiketi Yaz</Text>
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
                  NFC {hasNfc ? 'Kullanılabilir' : 'Kullanılamıyor'}
                </Text>
                <Text style={styles.infoText}>
                  {hasNfc 
                    ? 'Etiketi yazmak için cihazı yaklaştırın.' 
                    : 'Bu cihaz NFC desteklemiyor veya devre dışı bırakılmış.'}
                </Text>
              </View>
            </View>
          </Card>
          
          {/* Veri Tipi Seçimi */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Veri Tipi</Text>
            
            <View style={styles.typeButtonsContainer}>
              {renderDataTypeButton(DATA_TYPES.TEXT, 'text', 'Metin')}
              {renderDataTypeButton(DATA_TYPES.URL, 'link', 'URL')}
              {renderDataTypeButton(DATA_TYPES.PHONE, 'call', 'Telefon')}
              {renderDataTypeButton(DATA_TYPES.EMAIL, 'mail', 'E-posta')}
            </View>
          </Card>
          
          {/* Veri İçeriği */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Veri İçeriği</Text>
            
            {dataType === DATA_TYPES.URL && (
              <Text style={styles.helperText}>
                URL'nin başına http:// veya https:// eklendiğinden emin olun.
              </Text>
            )}
            
            {dataType === DATA_TYPES.PHONE && (
              <Text style={styles.helperText}>
                Uluslararası format kullanmanız önerilir (ör. +90xxx).
              </Text>
            )}
            
            <TextInput
              style={styles.dataInput}
              placeholder={
                dataType === DATA_TYPES.TEXT ? "Metin girin..." :
                dataType === DATA_TYPES.URL ? "URL girin (https://...)" :
                dataType === DATA_TYPES.PHONE ? "Telefon numarası girin" :
                dataType === DATA_TYPES.EMAIL ? "E-posta adresi girin" :
                "Veri girin..."
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
            <Text style={styles.sectionTitle}>Güvenlik Seçenekleri</Text>
            
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
                  <Text style={styles.securityOptionTitle}>Şifre Koruması</Text>
                  {!canUseFeature('password_protection') && <Ionicons name="star" size={18} color={COLORS.premium} />}
                </View>
                
                <Text style={styles.securityOptionDescription}>
                  Etiketinizi şifre ile koruyun. Sadece şifreyi bilenler içeriği görebilir.
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Şifre alanı - şifre koruması seçildiyse göster */}
            {shouldPasswordProtect && canUseFeature('password_protection') && (
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Şifre Belirleyin</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Şifre (en az 4 karakter)"
                  placeholderTextColor={COLORS.textDisabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <Text style={[styles.passwordLabel, { marginTop: 12 }]}>Şifre Tekrar</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Şifreyi tekrar girin"
                  placeholderTextColor={COLORS.textDisabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <View style={styles.passwordInfo}>
                  <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.passwordInfoText}>
                    Şifreyi unutmayın! Bu şifreye sahip olmayan kişiler etiketteki veriyi göremeyecek.
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
                  <Text style={styles.securityOptionTitle}>Etiketi Kilitle</Text>
                  <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
                </View>
                
                <Text style={styles.securityOptionDescription}>
                  Yazma işleminden sonra etiketi kilitle. Bu işlem geri alınamaz ve etiket bir daha değiştirilemez.
                </Text>
              </View>
            </TouchableOpacity>
            
            {shouldLockTag && (
              <View style={styles.helpBox}>
                <View style={styles.helpIconContainer}>
                  <Ionicons name="information-circle" size={22} color={COLORS.info} />
                  <Text style={styles.helpTitle}>Etiket Kilitleme Hakkında</Text>
                </View>
                <View style={styles.helpContent}>
                  <Text style={styles.helpText}>
                    Kilitleme işlemi etiketin kalıcı olarak 'salt okunur' hale gelmesini sağlar. 
                    Bu işlem fiziksel değişiklikler yapar ve asla geri alınamaz. Kilitledikten 
                    sonra, etiket içeriği hiçbir cihaz tarafından bir daha değiştirilemez.
                  </Text>
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.warningText}>
                      Devam etmeden önce emin olun.
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
            title="NFC Etiketi Yaz"
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
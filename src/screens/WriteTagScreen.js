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
  const [writeStatus, setWriteStatus] = useState(null); // null, 'success', 'error'
  const [dataType, setDataType] = useState(DATA_TYPES.TEXT);
  const [dataValue, setDataValue] = useState('');
  const [hasNfc, setHasNfc] = useState(null);
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
    
    try {
      setIsWriting(true);
      setWriteStatus(null);
      
      // NFC tag'e yazma işlemi
      NfcService.writeTag(
        { type: dataType, value: dataValue },
        // Başarı callback
        (message) => {
          setIsWriting(false);
          setWriteStatus('success');
          
          // Başarılı animasyonu oynat
          if (animationRef.current) {
            animationRef.current.play(0, 60);
          }
          
          // Bildirim
          setTimeout(() => {
            setAlertConfig({
              visible: true,
              title: 'Başarılı',
              message: message || 'NFC etiketi başarıyla yazıldı.',
              type: 'success',
              buttons: [{ text: 'Tamam' }]
            });
          }, 1200);
        },
        // Hata callback
        (error) => {
          setIsWriting(false);
          setWriteStatus('error');
          setAlertConfig({
            visible: true,
            title: 'Hata',
            message: error || 'NFC etiketi yazılırken bir hata oluştu.',
            type: 'error',
            buttons: [{ text: 'Tamam' }]
          });
        }
      );
    } catch (error) {
      console.log('Yazma hatası:', error);
      setIsWriting(false);
      setWriteStatus('error');
      setAlertConfig({
        visible: true,
        title: 'Hata',
        message: 'NFC etiketi yazılırken bir hata oluştu: ' + error.message,
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
          
          {/* Yazma Durumu */}
          {renderWriteStatus()}
          
          {/* Yazma Butonu */}
          <Button
            title="NFC Etiketi Yaz"
            onPress={handleWrite}
            disabled={!hasNfc || isWriting || !dataValue.trim()}
            loading={isWriting}
            style={styles.writeButton}
            leftIcon={!isWriting && <Ionicons name="create" size={20} color={COLORS.text} />}
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
});

export default WriteTagScreen; 
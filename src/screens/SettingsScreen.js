import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import useSettingsStore from '../features/settings/settingsStore';
import useSubscriptionStore from '../features/subscription/subscriptionStore';
import useLanguageStore from '../localization/languageStore';

const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation('settings');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  // Stores
  const { clearAllHistory } = useHistoryStore();
  const { 
    isPremiumUser, 
    currentPlan, 
    clearSubscription,
    restorePurchases 
  } = useSubscriptionStore();
  const { settings, toggleSetting } = useSettingsStore();
  const { currentLanguage, setLanguage, getSupportedLanguages } = useLanguageStore();
  
  // Dil değiştirme işleyicisi
  const handleLanguageChange = () => {
    setLanguageModalVisible(true);
  };
  
  const handleLanguageSelect = async (langCode) => {
    setLanguageModalVisible(false);
    setLanguage(langCode);
  };
  
  const closeLanguageModal = () => {
    setLanguageModalVisible(false);
  };
  
  // Satın almaları geri yükle
  const handleRestorePurchases = async () => {
    try {
      const restoredInfo = await restorePurchases();
      
      if (restoredInfo && isPremiumUser()) {
        setAlertConfig({
          visible: true,
          title: t('common:alerts.success'),
          message: t('subscription.restoreSuccess'),
          type: 'success',
          buttons: [{ text: t('common:alerts.ok') }]
        });
      } else {
        setAlertConfig({
          visible: true,
          title: t('common:alerts.info'),
          message: t('subscription.noSubscriptionFound'),
          type: 'info',
          buttons: [{ text: t('common:alerts.ok') }]
        });
      }
    } catch (error) {
      console.error('Satın almaları geri yükleme hatası:', error);
      setAlertConfig({
        visible: true,
        title: t('common:alerts.error'),
        message: t('subscription.restoreError'),
        type: 'error',
        buttons: [{ text: t('common:alerts.ok') }]
      });
    }
  };
  
  // Tüm verileri temizle
  const handleClearData = () => {
    setAlertConfig({
      visible: true,
      title: t('clearData.title'),
      message: t('clearData.message'),
      type: 'warning',
      buttons: [
        { 
          text: t('common:actions.cancel'),
          style: 'cancel'
        },
        {
          text: t('clearData.confirm'),
          style: 'destructive',
          onPress: async () => {
            // Geçmişi temizle
            clearAllHistory();
            
            // Ayarları temizle
            try {
              await AsyncStorage.clear();
              setAlertConfig({
                visible: true,
                title: t('common:alerts.success'),
                message: t('clearData.success'),
                type: 'success',
                buttons: [{ text: t('common:alerts.ok') }]
              });
            } catch (error) {
              console.log('Veri temizleme hatası:', error);
              setAlertConfig({
                visible: true,
                title: t('common:alerts.error'),
                message: t('clearData.error'),
                type: 'error',
                buttons: [{ text: t('common:alerts.ok') }]
              });
            }
          }
        }
      ]
    });
  };
  
  // Uygulama versiyonu
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  
  // Dil seçim modalı
  const renderLanguageModal = () => {
    const languages = getSupportedLanguages();
    
    return (
      <Modal
        transparent={true}
        visible={languageModalVisible}
        animationType="fade"
        onRequestClose={closeLanguageModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeLanguageModal}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t('sections.general.language')}
                  </Text>
                  <TouchableOpacity 
                    onPress={closeLanguageModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <Text style={styles.modalSubtitle}>
                    {t('sections.general.selectLanguage')}
                  </Text>
                  
                  {Object.values(languages).map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        currentLanguage === lang.code && styles.languageOptionSelected
                      ]}
                      onPress={() => handleLanguageSelect(lang.code)}
                    >
                      <Text style={styles.languageFlag}>
                        {lang.flag}
                      </Text>
                      <Text style={[
                        styles.languageName,
                        currentLanguage === lang.code && styles.languageNameSelected
                      ]}>
                        {lang.name}
                      </Text>
                      
                      {currentLanguage === lang.code && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={24} 
                          color={COLORS.primary} 
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };
  
  // Ayar öğesi
  const renderSettingItem = (icon, title, description, value, onChange, isPremiumSetting = false) => {
    const isDisabled = isPremiumSetting && !isPremiumUser();
    
    return (
      <View style={[styles.settingItem, isDisabled && styles.settingItemDisabled]}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon} size={22} color={isDisabled ? COLORS.textDisabled : COLORS.primary} />
        </View>
        
        <View style={styles.settingContent}>
          <View style={styles.settingTitleRow}>
            <Text style={[styles.settingTitle, isDisabled && styles.settingTitleDisabled]}>
              {title}
            </Text>
            
            {isPremiumSetting && !isPremiumUser() && (
              <PremiumBadge small />
            )}
          </View>
          
          {description && (
            <Text style={[styles.settingDescription, isDisabled && styles.settingDescriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
        
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={isDisabled}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={value ? COLORS.text : COLORS.textSecondary}
          ios_backgroundColor={COLORS.border}
        />
      </View>
    );
  };
  
  // Aksiyon öğesi
  const renderActionItem = (icon, title, onPress, destructive = false) => {
    return (
      <TouchableOpacity
        style={styles.actionItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[
          styles.actionIconContainer,
          destructive && styles.actionIconContainerDestructive
        ]}>
          <Ionicons
            name={icon}
            size={22}
            color={destructive ? COLORS.secondary : COLORS.primary}
          />
        </View>
        
        <Text style={[
          styles.actionTitle,
          destructive && styles.actionTitleDestructive
        ]}>
          {title}
        </Text>
        
        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderLanguageModal()}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('title')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Abonelik durumu */}
        <Card style={styles.subscriptionCard}>
          {isPremiumUser() ? (
            <View style={styles.premiumStatus}>
              <View style={styles.premiumInfo}>
                <Text style={styles.premiumTitle}>{t('sections.premium.active')}</Text>
                <Text style={styles.premiumPlan}>
                  {t(currentPlan)} {t('sections.premium.plan')}
                </Text>
              </View>
              
              <PremiumBadge />
            </View>
          ) : (
            <View>
              <View style={styles.premiumPromo}>
                <Ionicons name="star" size={24} color={COLORS.premium} />
                <Text style={styles.premiumPromoTitle}>{t('premium.upgrade')}</Text>
              </View>
              
              <Text style={styles.premiumPromoText}>
                {t('premium.description')}
              </Text>
              
              <Button
                title={t('premium.upgradeButton')}
                type="premium"
                onPress={() => navigation.navigate('Subscription')}
                style={styles.subscribeButton}
                fullWidth={true}
              />
            </View>
          )}
        </Card>
        
        {/* Uygulamada Ayarlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.general.title')}</Text>
          
          {/* Dil seçimi */}
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={handleLanguageChange}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="language" size={22} color={COLORS.primary} />
            </View>
            
            <View style={styles.settingInfo}>
              <Text style={styles.actionTitle}>
                {t('sections.general.language')}
              </Text>
              <Text style={styles.settingSubtext}>
                {getSupportedLanguages()[currentLanguage]?.name || 'English'}
              </Text>
            </View>
            
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          
          {renderSettingItem(
            'notifications', 
            t('sections.general.notifications'), 
            t('sections.general.notificationsDesc'),
            settings.notifications,
            () => toggleSetting('notifications')
          )}
          
          {renderSettingItem(
            'vibrate', 
            t('sections.general.hapticFeedback'), 
            t('sections.general.hapticFeedbackDesc'),
            settings.hapticFeedback,
            () => toggleSetting('hapticFeedback')
          )}
          
          {renderSettingItem(
            'save', 
            t('sections.general.autoSave'), 
            t('sections.general.autoSaveDesc'),
            settings.autoSave,
            () => toggleSetting('autoSave')
          )}
        </View>
        
        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.account.title')}</Text>
          
          {renderActionItem(
            'card',
            t('sections.account.manageSubscription'),
            () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
              } else {
                Linking.openURL('https://play.google.com/store/account/subscriptions');
              }
            }
          )}
          
          {renderActionItem(
            'star',
            t('sections.account.premiumFeatures'),
            () => navigation.navigate('Subscription')
          )}
          
          {renderActionItem(
            'refresh',
            t('sections.account.restorePurchases'),
            handleRestorePurchases
          )}
          
          {/* Sadece geliştirme amaçlı, gerçek uygulamada kaldırılacak */}
          {isPremiumUser() && (
            <TouchableOpacity
              style={styles.devButton}
              onPress={() => {
                clearSubscription();
                setAlertConfig({
                  visible: true,
                  title: t('common:alerts.info'),
                  message: t('developer.removePremium'),
                  type: 'info',
                  buttons: [{ text: t('common:alerts.ok') }]
                });
              }}
            >
              <Text style={styles.devButtonText}>
                {t('developer.removePremiumButton')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Destek */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.support.title')}</Text>
          
          {renderActionItem(
            'help-circle',
            t('sections.support.help'),
            () => navigation.navigate('HelpSupport')
          )}
          
          {renderActionItem(
            'star',
            t('sections.support.rateApp'),
            () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('itms-apps://itunes.apple.com/app/id000000000?action=write-review');
              } else {
                Linking.openURL('market://details?id=com.nfcreaderpro.app');
              }
            }
          )}
          
          {renderActionItem(
            'document-text',
            t('sections.support.privacyPolicy'),
            () => navigation.navigate('PrivacyPolicy')
          )}
        </View>
        
        {/* Veri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.data.title')}</Text>
          
          {renderActionItem(
            'trash',
            t('sections.data.clearData'),
            handleClearData,
            true
          )}
        </View>
        
        {/* Sürüm Bilgisi */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            {t('appName')} v{appVersion}
          </Text>
        </View>
      </ScrollView>
      
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.xlarge,
  },
  subscriptionCard: {
    marginBottom: SIZES.medium,
  },
  premiumStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  premiumPlan: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  premiumPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumPromoTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  premiumPromoText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.medium,
  },
  subscribeButton: {
    // style artık fullWidth özelliği ile işlenecek
  },
  section: {
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.medium,
    marginBottom: SIZES.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemDisabled: {
    opacity: 0.7,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  settingTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: COLORS.textDisabled,
  },
  settingDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  settingDescriptionDisabled: {
    color: COLORS.textDisabled,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconContainerDestructive: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  actionTitle: {
    flex: 1,
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionTitleDestructive: {
    color: COLORS.secondary,
  },
  devButton: {
    padding: 10,
    marginTop: 10,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
  },
  devButtonText: {
    color: COLORS.secondary,
    textAlign: 'center',
  },
  versionContainer: {
    marginTop: SIZES.large,
    alignItems: 'center',
  },
  versionText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  settingInfo: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius * 2,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: SIZES.medium,
  },
  modalSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.medium,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(61, 125, 255, 0.08)',
    borderColor: COLORS.primary,
  },
  languageFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  languageName: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  languageNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  }
});

export default SettingsScreen; 
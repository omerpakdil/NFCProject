import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import React from 'react';
import {
  Alert,
  Linking,
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
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import useSettingsStore from '../features/settings/settingsStore';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const SettingsScreen = ({ navigation }) => {
  // Stores
  const { clearAllHistory } = useHistoryStore();
  const { 
    isPremiumUser, 
    currentPlan, 
    clearSubscription 
  } = useSubscriptionStore();
  const { settings, toggleSetting } = useSettingsStore();
  
  // Tüm verileri temizle
  const handleClearData = () => {
    Alert.alert(
      'Tüm Verileri Sil',
      'Tüm tarama geçmişiniz ve ayarlarınız silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            // Geçmişi temizle
            clearAllHistory();
            
            // Ayarları temizle
            try {
              await AsyncStorage.clear();
              Alert.alert('Başarılı', 'Tüm veriler temizlendi.');
            } catch (error) {
              console.log('Veri temizleme hatası:', error);
              Alert.alert('Hata', 'Veriler temizlenirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };
  
  // Uygulama versiyonu
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Abonelik durumu */}
        <Card style={styles.subscriptionCard}>
          {isPremiumUser() ? (
            <View style={styles.premiumStatus}>
              <View style={styles.premiumInfo}>
                <Text style={styles.premiumTitle}>Premium Üyeliğiniz Aktif</Text>
                <Text style={styles.premiumPlan}>
                  {currentPlan} plan
                </Text>
              </View>
              
              <PremiumBadge />
            </View>
          ) : (
            <View>
              <View style={styles.premiumPromo}>
                <Ionicons name="star" size={24} color={COLORS.premium} />
                <Text style={styles.premiumPromoTitle}>Premium'a Yükseltin</Text>
              </View>
              
              <Text style={styles.premiumPromoText}>
                Yazma, etiket kilitleme ve şifreleme gibi premium özelliklere erişin.
              </Text>
              
              <Button
                title="Premium'a Yükseltin"
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
          <Text style={styles.sectionTitle}>Uygulama</Text>
          
          {renderSettingItem(
            'notifications', 
            'Bildirimler', 
            'Yeni özellikler ve güncellemeler hakkında bildirimler alın',
            settings.notifications,
            () => toggleSetting('notifications')
          )}
          
          {renderSettingItem(
            'vibrate', 
            'Titreşim Geri Bildirimi', 
            'NFC tarama ve yazma işlemlerinde titreşimli geri bildirim',
            settings.hapticFeedback,
            () => toggleSetting('hapticFeedback')
          )}
          
          {renderSettingItem(
            'save', 
            'Otomatik Kaydetme', 
            'Taramaları otomatik olarak geçmişe kaydet',
            settings.autoSave,
            () => toggleSetting('autoSave')
          )}
        </View>
        
        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesabım</Text>
          
          {renderActionItem(
            'card',
            'Abonelik Yönetimi',
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
            'Premium Özellikler',
            () => navigation.navigate('Subscription')
          )}
          
          {/* Sadece geliştirme amaçlı, gerçek uygulamada kaldırılacak */}
          {isPremiumUser() && (
            <TouchableOpacity
              style={styles.devButton}
              onPress={() => {
                clearSubscription();
                Alert.alert('Bilgi', 'Premium aboneliğiniz kaldırıldı (geliştirici modu).');
              }}
            >
              <Text style={styles.devButtonText}>
                Premium Aboneliği Kaldır (Geliştirici)
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Destek */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          
          {renderActionItem(
            'help-circle',
            'Yardım & Destek',
            () => Linking.openURL('https://nfcreaderpro.com/help')
          )}
          
          {renderActionItem(
            'star',
            'Uygulamamızı Değerlendirin',
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
            'Gizlilik Politikası',
            () => Linking.openURL('https://nfcreaderpro.com/privacy')
          )}
        </View>
        
        {/* Veri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri</Text>
          
          {renderActionItem(
            'trash',
            'Tüm Verileri Sil',
            handleClearData,
            true
          )}
        </View>
        
        {/* Sürüm Bilgisi */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            NFC Reader Pro v{appVersion}
          </Text>
        </View>
      </ScrollView>
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
});

export default SettingsScreen; 
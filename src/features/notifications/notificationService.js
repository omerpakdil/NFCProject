import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import useSettingsStore from '../settings/settingsStore';

// Bildirimlerin nasıl gösterileceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.expoPushToken = null;
  }

  // İzin kontrolü
  async checkPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    this.hasPermission = finalStatus === 'granted';
    return this.hasPermission;
  }

  // Bildirim gönder
  async sendNotification(title, body, data = {}) {
    // Ayarlardan bildirimlerin açık olup olmadığını kontrol et
    const notificationsEnabled = useSettingsStore.getState().settings.notifications;
    
    if (!notificationsEnabled) {
      console.log('Bildirimler kapalı');
      return;
    }
    
    // İzin kontrolü
    if (!this.hasPermission) {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.log('Bildirim izni yok');
        return;
      }
    }
    
    // Bildirim içeriği
    const notificationContent = {
      title,
      body,
      data,
      sound: true,
    };
    
    // Android için ekstra ayarlar
    if (Platform.OS === 'android') {
      notificationContent.android = {
        channelId: 'default',
        color: '#3D7DFF',
        priority: 'high',
      };
    }
    
    // Bildirimi gönder
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Hemen göster
    });
  }
  
  // Yeni özellik bildirimi
  async sendFeatureNotification(featureName, description) {
    await this.sendNotification(
      `Yeni Özellik: ${featureName}`,
      description,
      { type: 'new_feature' }
    );
  }
  
  // Güncelleme bildirimi
  async sendUpdateNotification(version, description) {
    await this.sendNotification(
      `Uygulama Güncellendi: v${version}`,
      description,
      { type: 'update' }
    );
  }
  
  // Premium hatırlatıcı bildirimi
  async sendPremiumReminder() {
    await this.sendNotification(
      'Premium Özellikleri Keşfedin',
      'NFC Reader Pro\'nun tüm özelliklerinden yararlanmak için premium aboneliğe geçin.',
      { type: 'premium_reminder' }
    );
  }
  
  // Bildirimleri temizle
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }
}

export default new NotificationService(); 
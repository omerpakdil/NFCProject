import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// RevenueCat API Anahtarları
const API_KEYS = {
  ios: 'appl_VhVDjEbJULCzCohEVqWhQxgWkTG',
  android: 'goog_MNvPxeWOPJLjJwslzXZuxKdGFyp',
};

class RevenueCatService {
  constructor() {
    this.isConfigured = false;
    this.offerings = null;
    this.currentPurchaserInfo = null;
  }

  // RevenueCat'i yapılandır ve başlat
  async configure() {
    if (this.isConfigured) return;

    try {
      const apiKey = Platform.select({
        ios: API_KEYS.ios,
        android: API_KEYS.android,
      });

      await Purchases.configure({ apiKey });
      this.isConfigured = true;
      console.log('RevenueCat başarıyla yapılandırıldı.');
      
      // Mevcut kullanıcı bilgilerini hemen al
      await this.getPurchaserInfo();
    } catch (error) {
      console.error('RevenueCat yapılandırma hatası:', error);
    }
  }

  // Kullanıcı tanımlama (opsiyonel)
  async identify(userId) {
    if (!this.isConfigured) await this.configure();
    
    try {
      await Purchases.logIn(userId);
      console.log('Kullanıcı RevenueCat ile tanımlandı:', userId);
      await this.getPurchaserInfo(); // Tanımlamadan sonra bilgileri güncelle
      return true;
    } catch (error) {
      console.error('RevenueCat kullanıcı tanımlama hatası:', error);
      return false;
    }
  }

  // Kullanıcı çıkış yaptığında
  async logout() {
    if (!this.isConfigured) return;
    
    try {
      await Purchases.logOut();
      console.log('Kullanıcı RevenueCat\'ten çıkış yaptı');
      await this.getPurchaserInfo(); // Çıkış sonrası bilgileri güncelle
      return true;
    } catch (error) {
      console.error('RevenueCat çıkış hatası:', error);
      return false;
    }
  }

  // Mevcut satın alma tekliflerini al
  async getOfferings() {
    if (!this.isConfigured) await this.configure();
    
    try {
      const offerings = await Purchases.getOfferings();
      this.offerings = offerings;
      console.log('RevenueCat teklifleri alındı:', offerings);
      return offerings;
    } catch (error) {
      console.error('RevenueCat teklifleri alma hatası:', error);
      return null;
    }
  }

  // Teklifleri çeşitli şekillerde al
  async getCurrentOffering() {
    const offerings = await this.getOfferings();
    return offerings?.current;
  }

  async getOfferingByIdentifier(identifier) {
    const offerings = await this.getOfferings();
    return offerings?.all?.[identifier];
  }

  // Satın alma işlemi yap
  async purchasePackage(packageToPurchase) {
    if (!this.isConfigured) await this.configure();
    if (!packageToPurchase) {
      console.error('Satın alınacak paket belirtilmedi');
      return null;
    }
    
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      console.log('Satın alma başarılı:', productIdentifier);
      this.currentPurchaserInfo = customerInfo;
      return { customerInfo, productIdentifier };
    } catch (error) {
      if (!error.userCancelled) {
        console.error('Satın alma hatası:', error);
      } else {
        console.log('Kullanıcı satın alma işlemini iptal etti');
      }
      return null;
    }
  }

  // Abonelik durumunu al
  async getPurchaserInfo() {
    if (!this.isConfigured) await this.configure();
    
    try {
      const purchaserInfo = await Purchases.getCustomerInfo();
      this.currentPurchaserInfo = purchaserInfo;
      console.log('Kullanıcı abonelik bilgisi alındı:', purchaserInfo);
      return purchaserInfo;
    } catch (error) {
      console.error('Kullanıcı bilgisi alma hatası:', error);
      return null;
    }
  }

  // Premium erişimi kontrol et
  async hasPremiumAccess() {
    const purchaserInfo = await this.getPurchaserInfo();
    return this.checkPremiumAccessFromInfo(purchaserInfo);
  }

  // PurchaserInfo'dan premium erişimi kontrol et
  checkPremiumAccessFromInfo(purchaserInfo) {
    if (!purchaserInfo) return false;

    // Entitlements'da "premium" anahtarı kontrol edilir
    // Bu, RevenueCat dashboardında tanımlanmalıdır
    return purchaserInfo.entitlements.active.hasOwnProperty('premium');
  }

  // Belirli bir özelliğe erişim var mı kontrol et
  async canAccessFeature(featureId) {
    // Önce premium kontrolü yap
    const hasPremium = await this.hasPremiumAccess();
    
    // Premium özellik listesini tanımla
    const premiumFeatures = [
      'write',
      'lock',
      'password_protection',
      'data_storage',
      'data_merge',
      'advanced_history',
    ];
    
    // Özellik premium değilse herkes kullanabilir
    if (!premiumFeatures.includes(featureId)) {
      return true;
    }
    
    // Premium bir özellikse sadece premium kullanıcılar kullanabilir
    return hasPremium;
  }

  // Aboneliği yenile (satın alma problemlerini çözmek için)
  async restorePurchases() {
    if (!this.isConfigured) await this.configure();
    
    try {
      const purchaserInfo = await Purchases.restorePurchases();
      this.currentPurchaserInfo = purchaserInfo;
      console.log('Satın almalar geri yüklendi:', purchaserInfo);
      return purchaserInfo;
    } catch (error) {
      console.error('Satın almaları geri yükleme hatası:', error);
      return null;
    }
  }
}

// Singleton instance
const revenueCatService = new RevenueCatService();

export default revenueCatService; 
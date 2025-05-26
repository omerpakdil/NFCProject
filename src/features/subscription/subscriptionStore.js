import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import revenueCatService from './revenuecat';

// Abonelik planları
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
};

// Abonelik özellikleri
export const FEATURES = {
  READ: {
    id: 'read',
    name: 'features.read',
    isPremium: false,
  },
  HISTORY_VIEW: {
    id: 'history_view',
    name: 'features.history_view',
    isPremium: false,
  },
  WRITE: {
    id: 'write',
    name: 'features.write',
    isPremium: true,
  },
  LOCK: {
    id: 'lock',
    name: 'features.lock',
    isPremium: true,
  },
  PASSWORD_PROTECTION: {
    id: 'password_protection',
    name: 'features.password_protection',
    isPremium: true,
  },
  DATA_STORAGE: {
    id: 'data_storage',
    name: 'features.data_storage',
    isPremium: true,
  },
  DATA_MERGE: {
    id: 'data_merge',
    name: 'features.data_merge',
    isPremium: true,
  },
  ADVANCED_HISTORY: {
    id: 'advanced_history',
    name: 'features.advanced_history',
    isPremium: true,
  },
};

// Fiyatlandırma bilgisi
export const PRICING = {
  [SUBSCRIPTION_PLANS.WEEKLY]: {
    price: '$1.99',
    priceNumeric: 1.99,
    period: 'period.weekly',
    productId: 'weekly_subscription',
  },
  [SUBSCRIPTION_PLANS.MONTHLY]: {
    price: '$4.99',
    priceNumeric: 4.99,
    period: 'period.monthly',
    productId: 'monthly_subscription',
  },
  [SUBSCRIPTION_PLANS.YEARLY]: {
    price: '$39.99',
    priceNumeric: 39.99,
    period: 'period.yearly',
    productId: 'yearly_subscription',
    discount: 'plans.yearly.discount',
  },
  [SUBSCRIPTION_PLANS.LIFETIME]: {
    price: '$79.99',
    priceNumeric: 79.99,
    period: 'period.lifetime',
    productId: 'lifetime_access',
  },
};

const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      // Kullanıcı abonelik durumu - Test için varsayılan olarak premium
      currentPlan: SUBSCRIPTION_PLANS.MONTHLY,
      subscriptionEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 gün sonra
      isLifetime: false,
      
      // RevenueCat'ten alınan abonelik bilgileri
      revenueCatCustomerInfo: null,
      lastSyncTime: null,
      
      // Abonelik durumu kontrol fonksiyonları
      isPremiumUser: () => {
        const { currentPlan, subscriptionEndDate, isLifetime, revenueCatCustomerInfo } = get();
        
        // İlk olarak RevenueCat ile kontrol et (eğer senkronize edilmiş ise)
        if (revenueCatCustomerInfo) {
          const hasPremium = revenueCatService.checkPremiumAccessFromInfo(revenueCatCustomerInfo);
          if (hasPremium) return true;
        }
        
        // RevenueCat bilgisi yoksa veya aktif abonelik yoksa yerel duruma bak
        // Ömür boyu erişim varsa veya abonelik süresi dolmamışsa premium
        if (isLifetime) return true;
        
        if (currentPlan !== SUBSCRIPTION_PLANS.FREE && subscriptionEndDate) {
          const now = new Date();
          const endDate = new Date(subscriptionEndDate);
          return now < endDate; // Abonelik hala geçerli mi?
        }
        
        return false;
      },
      
      // Belirli bir özelliğin kullanılabilirliğini kontrol et
      canUseFeature: async (featureId) => {
        // Önce RevenueCat üzerinden kontrol etmeyi dene
        try {
          await revenueCatService.configure();
          return await revenueCatService.canAccessFeature(featureId);
        } catch (error) {
          console.error('RevenueCat özellik erişim kontrolü hatası:', error);
          
          // Yerel kontrol - Özellik premium değilse herkes kullanabilir
          const feature = Object.values(FEATURES).find(f => f.id === featureId);
          if (!feature || !feature.isPremium) return true;
          
          // Premium özellikse, sadece premium kullanıcılar kullanabilir
          return get().isPremiumUser();
        }
      },
      
      // Abonelik durumunu RevenueCat ile senkronize et
      syncWithRevenueCat: async () => {
        try {
          // RevenueCat'i başlat
          await revenueCatService.configure();
          
          // Kullanıcı bilgilerini al
          const customerInfo = await revenueCatService.getPurchaserInfo();
          
          // Senkronizasyon zamanını güncelle
          const now = new Date();
          
          // RevenueCat'ten alınan bilgileri kaydet
          set({ 
            revenueCatCustomerInfo: customerInfo,
            lastSyncTime: now.toISOString()
          });
          
          // Premium durumunu kontrol et
          const hasPremium = revenueCatService.checkPremiumAccessFromInfo(customerInfo);
          
          // Eğer RevenueCat'te premium varsa, yerelde de ayarla
          if (hasPremium) {
            // Eğer entitlement'ın süresini alabilirsek, onunla ayarlayabiliriz
            const premiumEntitlement = customerInfo?.entitlements?.active?.premium;
            
            if (premiumEntitlement) {
              // Lifetime planı mı kontrol et
              const isLifetimePlan = premiumEntitlement.productIdentifier === PRICING[SUBSCRIPTION_PLANS.LIFETIME].productId;
              
              // Süre bilgisi
              const expirationDate = premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : null;
              
              // Plan tipini belirle
              let planType = SUBSCRIPTION_PLANS.MONTHLY; // Varsayılan olarak aylık
              
              // Ürün tanımlayıcısına göre plan belirle
              Object.entries(PRICING).forEach(([plan, details]) => {
                if (premiumEntitlement.productIdentifier === details.productId) {
                  planType = plan;
                }
              });
              
              // Aboneliği güncelle
              set({ 
                currentPlan: planType, 
                subscriptionEndDate: expirationDate ? expirationDate.toISOString() : null,
                isLifetime: isLifetimePlan
              });
            }
          }
          
          return customerInfo;
        } catch (error) {
          console.error('RevenueCat senkronizasyon hatası:', error);
          return null;
        }
      },
      
      // Paket satın al
      purchasePackage: async (packageToPurchase) => {
        try {
          const result = await revenueCatService.purchasePackage(packageToPurchase);
          if (result) {
            // Satın alma başarılı, store'u güncelle
            await get().syncWithRevenueCat();
            return result;
          }
          return null;
        } catch (error) {
          console.error('Paket satın alma hatası:', error);
          return null;
        }
      },
      
      // Satın almaları geri yükle
      restorePurchases: async () => {
        try {
          const restoredInfo = await revenueCatService.restorePurchases();
          if (restoredInfo) {
            // Geri yükleme başarılı, store'u güncelle
            await get().syncWithRevenueCat();
            return restoredInfo;
          }
          return null;
        } catch (error) {
          console.error('Satın almaları geri yükleme hatası:', error);
          return null;
        }
      },
      
      // Abonelik ayarla (yerel)
      setSubscription: (plan, endDate = null, isLifetime = false) => {
        set({ 
          currentPlan: plan, 
          subscriptionEndDate: endDate,
          isLifetime: isLifetime 
        });
      },
      
      // Abonelikten çık (sadece geliştirme için)
      clearSubscription: () => {
        set({ 
          currentPlan: SUBSCRIPTION_PLANS.FREE, 
          subscriptionEndDate: null,
          isLifetime: false
        });
      }
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// RevenueCat için başlangıç işlemleri
export const initializeRevenueCat = async () => {
  try {
    // RevenueCat'i yapılandır
    await revenueCatService.configure();
    
    // Abonelik durumunu senkronize et
    await useSubscriptionStore.getState().syncWithRevenueCat();
    
    return true;
  } catch (error) {
    console.error('RevenueCat başlatma hatası:', error);
    return false;
  }
};

export default useSubscriptionStore; 
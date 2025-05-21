import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
    name: 'NFC Okuma',
    isPremium: false,
  },
  HISTORY_VIEW: {
    id: 'history_view',
    name: 'Geçmiş Görüntüleme',
    isPremium: false,
  },
  WRITE: {
    id: 'write',
    name: 'NFC Yazma',
    isPremium: true,
  },
  LOCK: {
    id: 'lock',
    name: 'Etiket Kilitleme',
    isPremium: true,
  },
  PASSWORD_PROTECTION: {
    id: 'password_protection',
    name: 'Şifre Koruması',
    isPremium: true,
  },
  DATA_STORAGE: {
    id: 'data_storage',
    name: 'Kapsamlı Veri Depolama',
    isPremium: true,
  },
  DATA_MERGE: {
    id: 'data_merge',
    name: 'Veri Birleştirme',
    isPremium: true,
  },
  ADVANCED_HISTORY: {
    id: 'advanced_history',
    name: 'Gelişmiş Geçmiş Yönetimi',
    isPremium: true,
  },
};

// Fiyatlandırma bilgisi
export const PRICING = {
  [SUBSCRIPTION_PLANS.WEEKLY]: {
    price: '$1.99',
    priceNumeric: 1.99,
    period: 'haftalık',
    productId: 'weekly_subscription',
  },
  [SUBSCRIPTION_PLANS.MONTHLY]: {
    price: '$4.99',
    priceNumeric: 4.99,
    period: 'aylık',
    productId: 'monthly_subscription',
  },
  [SUBSCRIPTION_PLANS.YEARLY]: {
    price: '$39.99',
    priceNumeric: 39.99,
    period: 'yıllık',
    productId: 'yearly_subscription',
    discount: '33% indirim',
  },
  [SUBSCRIPTION_PLANS.LIFETIME]: {
    price: '$79.99',
    priceNumeric: 79.99,
    period: 'ömür boyu',
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
      
      // Abonelik durumu kontrol fonksiyonları
      isPremiumUser: () => {
        const { currentPlan, subscriptionEndDate, isLifetime } = get();
        
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
      canUseFeature: (featureId) => {
        // Özellik premium değilse herkes kullanabilir
        const feature = Object.values(FEATURES).find(f => f.id === featureId);
        if (!feature || !feature.isPremium) return true;
        
        // Premium özellikse, sadece premium kullanıcılar kullanabilir
        return get().isPremiumUser();
      },
      
      // Abonelik ayarla
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

export default useSubscriptionStore; 
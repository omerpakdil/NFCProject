import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Button from '../components/Button';
import { COLORS, SIZES } from '../constants/theme';

// Store ve abonelik verileri
import revenueCatService from '../features/subscription/revenuecat';
import useSubscriptionStore, {
  FEATURES,
  PRICING,
  SUBSCRIPTION_PLANS
} from '../features/subscription/subscriptionStore';

const SubscriptionScreen = ({ navigation }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  
  // Store
  const { 
    isPremiumUser, 
    currentPlan, 
    purchasePackage, 
    restorePurchases,
    syncWithRevenueCat
  } = useSubscriptionStore();
  
  // Seçili plan
  const [selectedPlan, setSelectedPlan] = useState(
    currentPlan !== SUBSCRIPTION_PLANS.FREE ? currentPlan : SUBSCRIPTION_PLANS.MONTHLY
  );
  
  // RevenueCat'ten teklifleri yükleme
  useEffect(() => {
    const loadOfferings = async () => {
      setLoading(true);
      try {
        // RevenueCat'i başlat
        await revenueCatService.configure();
        
        // Premium durumunu senkronize et
        await syncWithRevenueCat();
        
        // Teklifleri al
        const offerings = await revenueCatService.getCurrentOffering();
        
        if (offerings && offerings.availablePackages) {
          console.log('RevenueCat teklifleri yüklendi:', offerings.availablePackages);
          setPackages(offerings.availablePackages);
          
          // Varsayılan olarak ilk paketi seç (varsa)
          if (offerings.availablePackages.length > 0) {
            setSelectedPackage(offerings.availablePackages[0]);
            
            // Eski seçim sistemini de desteklemek için
            const planType = offerings.availablePackages[0].packageType.toLowerCase();
            const matchingPlan = Object.values(SUBSCRIPTION_PLANS).find(
              plan => plan.toLowerCase().includes(planType)
            );
            if (matchingPlan) {
              setSelectedPlan(matchingPlan);
            }
          }
        } else {
          console.log('RevenueCat teklifleri alınamadı veya boş');
        }
      } catch (error) {
        console.error('RevenueCat teklifleri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOfferings();
  }, []);
  
  // Premium satın alma
  const handlePurchase = async () => {
    // RevenueCat paketleri varsa, onlarla satın alma yapalım
    if (packages.length > 0 && selectedPackage) {
      setProcessingPurchase(true);
      
      try {
        // RevenueCat üzerinden satın alma
        const result = await purchasePackage(selectedPackage);
        
        if (result) {
          Alert.alert(
            'Başarılı',
            'Premium aboneliğiniz aktif edildi. Tüm özellikler artık kullanılabilir.',
            [{ text: 'Tamam', onPress: () => navigation.goBack() }]
          );
        } else {
          console.log('Satın alma başarısız veya iptal edildi');
        }
      } catch (error) {
        console.error('Satın alma hatası:', error);
        Alert.alert('Hata', 'Satın alma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setProcessingPurchase(false);
      }
      return;
    }
    
    // RevenueCat paketleri yoksa, eski simülasyon modunu kullan
    setProcessingPurchase(true);
    
    try {
      setTimeout(() => {
        // Abonelik tipine göre farklı işlemler
        const now = new Date();
        let endDate = null;
        let isLifetime = false;
        
        switch (selectedPlan) {
          case SUBSCRIPTION_PLANS.WEEKLY:
            // 1 hafta ekle
            endDate = new Date(now);
            endDate.setDate(now.getDate() + 7);
            break;
            
          case SUBSCRIPTION_PLANS.MONTHLY:
            // 1 ay ekle
            endDate = new Date(now);
            endDate.setMonth(now.getMonth() + 1);
            break;
            
          case SUBSCRIPTION_PLANS.YEARLY:
            // 1 yıl ekle
            endDate = new Date(now);
            endDate.setFullYear(now.getFullYear() + 1);
            break;
            
          case SUBSCRIPTION_PLANS.LIFETIME:
            // Ömür boyu
            isLifetime = true;
            endDate = null;
            break;
        }
        
        // Abonelik bilgisini güncelle
        useSubscriptionStore.getState().setSubscription(
          selectedPlan, 
          endDate ? endDate.toISOString() : null, 
          isLifetime
        );
        
        // Başarılı bildirim
        Alert.alert(
          'Başarılı',
          'Premium aboneliğiniz aktif edildi. Tüm özellikler artık kullanılabilir.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
        
        setProcessingPurchase(false);
      }, 1500); // Sahte işlem süresi
    } catch (error) {
      console.log('Satın alma hatası:', error);
      Alert.alert('Hata', 'Satın alma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setProcessingPurchase(false);
    }
  };
  
  // Satın almaları geri yükle
  const handleRestorePurchases = async () => {
    setProcessingPurchase(true);
    
    try {
      const restoredInfo = await restorePurchases();
      
      if (restoredInfo && isPremiumUser()) {
        Alert.alert(
          'Başarılı', 
          'Aboneliğiniz başarıyla geri yüklendi!',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Bilgi', 'Geri yüklenecek aktif bir abonelik bulunamadı.');
      }
    } catch (error) {
      console.error('Satın almaları geri yükleme hatası:', error);
      Alert.alert('Hata', 'Abonelikler geri yüklenirken bir hata oluştu.');
    } finally {
      setProcessingPurchase(false);
    }
  };
  
  // RevenueCat paketi seç
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    
    // Eski sistem için de seçimi güncelle
    const planType = pkg.packageType.toLowerCase();
    if (planType.includes('annual') || planType.includes('yearly')) {
      setSelectedPlan(SUBSCRIPTION_PLANS.YEARLY);
    } else if (planType.includes('month')) {
      setSelectedPlan(SUBSCRIPTION_PLANS.MONTHLY);
    } else if (planType.includes('week')) {
      setSelectedPlan(SUBSCRIPTION_PLANS.WEEKLY);
    } else if (planType.includes('lifetime') || planType.includes('forever')) {
      setSelectedPlan(SUBSCRIPTION_PLANS.LIFETIME);
    }
  };
  
  // RevenueCat paketlerini render et
  const renderRevenueCatPackages = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Teklifler yükleniyor...</Text>
        </View>
      );
    }
    
    if (packages.length === 0) {
      return (
        <View style={styles.plansContainer}>
          {renderPlanCard(SUBSCRIPTION_PLANS.WEEKLY)}
          {renderPlanCard(SUBSCRIPTION_PLANS.MONTHLY)}
          {renderPlanCard(SUBSCRIPTION_PLANS.YEARLY)}
          {renderPlanCard(SUBSCRIPTION_PLANS.LIFETIME)}
        </View>
      );
    }
    
    return (
      <View style={styles.revenueCatPackages}>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.identifier}
            activeOpacity={0.8}
            onPress={() => handleSelectPackage(pkg)}
            style={[
              styles.planCard,
              selectedPackage?.identifier === pkg.identifier && styles.selectedPlanCard,
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>
                {pkg.packageType === 'ANNUAL' ? 'YEARLY' : pkg.packageType}
              </Text>
              {pkg.packageType === 'ANNUAL' && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>33% indirim</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
            <Text style={styles.planPeriod}>
              /{pkg.packageType === 'ANNUAL' ? 'yıllık' : 
                pkg.packageType === 'MONTHLY' ? 'aylık' : 
                pkg.packageType === 'WEEKLY' ? 'haftalık' : 'ömür boyu'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Satın alma butonunu render et
  const renderPurchaseButton = () => {
    if (isPremiumUser() && packages.length === 0) {
      return (
        <Button
          title="Mevcut Abonelik"
          disabled
          fullWidth
          style={styles.purchaseButton}
        />
      );
    }
    
    return (
      <>
        <Button
          title={isPremiumUser() ? "Aboneliği Değiştir" : "Abone Ol"}
          type="premium"
          onPress={handlePurchase}
          loading={processingPurchase}
          fullWidth
          style={styles.purchaseButton}
        />
        
        <TouchableOpacity 
          style={styles.restorePurchasesButton}
          onPress={handleRestorePurchases}
          disabled={processingPurchase}
        >
          <Text style={styles.restorePurchasesText}>
            Satın Almaları Geri Yükle
          </Text>
        </TouchableOpacity>
      </>
    );
  };
  
  // Premium özellik öğesini render et
  const renderFeatureItem = (feature) => {
    const isPremium = feature.isPremium;
    
    return (
      <View key={feature.id} style={styles.featureItem}>
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={isPremium ? COLORS.premium : COLORS.success}
        />
        <Text style={styles.featureText}>{feature.name}</Text>
        
        {isPremium && (
          <View style={styles.premiumIndicator}>
            <Ionicons name="star" size={12} color={COLORS.premium} />
          </View>
        )}
      </View>
    );
  };
  
  // Plan kartını render et
  const renderPlanCard = (planType) => {
    const plan = PRICING[planType];
    const isSelected = selectedPlan === planType;
    const isCurrentPlan = currentPlan === planType;
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedPlan(planType)}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          isCurrentPlan && styles.currentPlanCard,
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{planType}</Text>
          {plan.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{plan.discount}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>/{plan.period}</Text>
        
        {isCurrentPlan && (
          <Text style={styles.currentPlanText}>Mevcut Plan</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Premium içeriği */}
        <View style={styles.premiumContent}>
          <View style={styles.premiumHeader}>
            <Ionicons name="star" size={48} color={COLORS.premium} />
            <Text style={styles.premiumSubtitle}>
              Sınırsız tarama, gelişmiş özellikler ve daha fazlası
            </Text>
          </View>

          {/* Premium özellikleri */}
          <View style={styles.featuresList}>
            {Object.values(FEATURES).map(renderFeatureItem)}
          </View>

          {/* Abonelik planları */}
          {renderRevenueCatPackages()}
        </View>
        
        {/* Satın alma butonu */}
        <View style={styles.purchaseContainer}>
          {renderPurchaseButton()}
          
          <Text style={styles.disclaimerText}>
            * Abonelikler otomatik olarak yenilenir. İstediğiniz zaman ayarlardan iptal edebilirsiniz.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    paddingBottom: 16,
  },
  premiumContent: {
    flex: 1,
    alignItems: 'center',
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  featuresList: {
    gap: 6,
    marginBottom: 25,
  },
  planCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.cardRadius,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPlanCard: {
    borderColor: COLORS.premium,
    borderWidth: 2,
  },
  currentPlanCard: {
    backgroundColor: COLORS.surface,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  planPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  discountBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentPlanText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: 'bold',
  },
  purchaseContainer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  purchaseButton: {
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  premiumIndicator: {
    marginLeft: 4,
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  revenueCatPackages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 32,
    width: '100%',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  restorePurchasesButton: {
    marginBottom: 15,
    padding: 8,
    alignSelf: 'center',
  },
  restorePurchasesText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default SubscriptionScreen; 
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import useSubscriptionStore, {
  FEATURES,
  PRICING,
  SUBSCRIPTION_PLANS
} from '../features/subscription/subscriptionStore';

const SubscriptionScreen = ({ navigation }) => {
  // Store
  const { isPremiumUser, setSubscription, currentPlan } = useSubscriptionStore();
  
  // Seçili plan
  const [selectedPlan, setSelectedPlan] = useState(
    currentPlan !== SUBSCRIPTION_PLANS.FREE ? currentPlan : SUBSCRIPTION_PLANS.MONTHLY
  );
  
  // Satın alma işlemi devam ediyor mu?
  const [isPurchasing, setPurchasing] = useState(false);
  
  // Premium satın alma
  const handlePurchase = async () => {
    // Gerçek satın alma işlemlerini burada entegre edeceğiz
    // Şimdilik sadece simüle ediyoruz
    setPurchasing(true);
    
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
        setSubscription(selectedPlan, endDate ? endDate.toISOString() : null, isLifetime);
        
        // Başarılı bildirim
        Alert.alert(
          'Başarılı',
          'Premium aboneliğiniz aktif edildi. Tüm özellikler artık kullanılabilir.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
        
        setPurchasing(false);
      }, 1500); // Sahte işlem süresi
    } catch (error) {
      console.log('Satın alma hatası:', error);
      Alert.alert('Hata', 'Satın alma işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setPurchasing(false);
    }
  };
  
  // Satın alma butonunu render et
  const renderPurchaseButton = () => {
    if (isPremiumUser() && currentPlan === selectedPlan) {
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
      <Button
        title={isPremiumUser() ? "Aboneliği Değiştir" : "Abone Ol"}
        type="premium"
        onPress={handlePurchase}
        loading={isPurchasing}
        fullWidth
        style={styles.purchaseButton}
      />
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
          <View style={styles.plansContainer}>
            {renderPlanCard(SUBSCRIPTION_PLANS.WEEKLY)}
            {renderPlanCard(SUBSCRIPTION_PLANS.MONTHLY)}
            {renderPlanCard(SUBSCRIPTION_PLANS.YEARLY)}
            {renderPlanCard(SUBSCRIPTION_PLANS.LIFETIME)}
          </View>
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
});

export default SubscriptionScreen; 
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const PrivacyPolicyScreen = () => {
  const { t } = useTranslation('privacy');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('title')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. {t('sections.dataCollection.title')}</Text>
          <Text style={styles.text}>
            {t('sections.dataCollection.description')}
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• {t('sections.dataCollection.items.scanHistory')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.dataCollection.items.appPreferences')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.dataCollection.items.purchaseInfo')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. {t('sections.dataUsage.title')}</Text>
          <Text style={styles.text}>
            {t('sections.dataUsage.description')}
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• {t('sections.dataUsage.items.displayHistory')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.dataUsage.items.savePreferences')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.dataUsage.items.managePremium')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. {t('sections.dataStorage.title')}</Text>
          <Text style={styles.text}>
            {t('sections.dataStorage.description')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. {t('sections.thirdParty.title')}</Text>
          <Text style={styles.text}>
            {t('sections.thirdParty.description')}
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• {t('sections.thirdParty.items.revenueCat')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.thirdParty.items.appStore')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. {t('sections.permissions.title')}</Text>
          <Text style={styles.text}>
            {t('sections.permissions.description')}
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• {t('sections.permissions.items.nfc')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.permissions.items.storage')}</Text>
            <Text style={styles.bulletPoint}>• {t('sections.permissions.items.notifications')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. {t('sections.contact.title')}</Text>
          <Text style={styles.text}>
            {t('sections.contact.description')}
          </Text>
          <Text style={styles.email}>{t('sections.contact.email')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. {t('sections.updates.title')}</Text>
          <Text style={styles.text}>
            {t('sections.updates.description')}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('footer.lastUpdated', { date: new Date().toLocaleDateString() })}
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
    flex: 1,
    padding: SIZES.medium,
  },
  section: {
    marginBottom: SIZES.large,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.small,
  },
  text: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SIZES.small,
  },
  bulletPoints: {
    marginLeft: SIZES.small,
  },
  bulletPoint: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  email: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginTop: 8,
  },
  footer: {
    marginTop: SIZES.large,
    marginBottom: SIZES.xlarge,
  },
  footerText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PrivacyPolicyScreen; 
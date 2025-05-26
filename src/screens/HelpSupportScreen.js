import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../components/Card';
import { COLORS, SIZES } from '../constants/theme';

const HelpSupportScreen = () => {
  const { t } = useTranslation('help');

  const handleEmailSupport = () => {
    Linking.openURL('mailto:callousity@gmail.com?subject=NFC Reader Pro Support');
  };

  const renderFAQItem = (question, answer) => (
    <Card style={styles.faqCard}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.answer}>{answer}</Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('sections.support.help')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.title')}</Text>
          <Card style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactContent}>
                <Ionicons name="mail" size={24} color={COLORS.primary} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>{t('contact.email')}</Text>
                  <Text style={styles.contactText}>callousity@gmail.com</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('faq.title')}</Text>
          
          {renderFAQItem(
            t('faq.nfcSupport.question'),
            t('faq.nfcSupport.answer')
          )}
          
          {renderFAQItem(
            t('faq.writeTag.question'),
            t('faq.writeTag.answer')
          )}
          
          {renderFAQItem(
            t('faq.dataTypes.question'),
            t('faq.dataTypes.answer')
          )}
          
          {renderFAQItem(
            t('faq.premium.question'),
            t('faq.premium.answer')
          )}
          
          {renderFAQItem(
            t('faq.restore.question'),
            t('faq.restore.answer')
          )}
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('troubleshooting.title')}</Text>
          
          <Card style={styles.troubleshootingCard}>
            <View style={styles.troubleshootingItem}>
              <Ionicons name="warning" size={24} color={COLORS.warning} style={styles.troubleshootingIcon} />
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>{t('troubleshooting.nfcNotWorking.title')}</Text>
                <Text style={styles.troubleshootingText}>{t('troubleshooting.nfcNotWorking.solution')}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.troubleshootingItem}>
              <Ionicons name="alert-circle" size={24} color={COLORS.error} style={styles.troubleshootingIcon} />
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>{t('troubleshooting.readError.title')}</Text>
                <Text style={styles.troubleshootingText}>{t('troubleshooting.readError.solution')}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.troubleshootingItem}>
              <Ionicons name="information-circle" size={24} color={COLORS.info} style={styles.troubleshootingIcon} />
              <View style={styles.troubleshootingContent}>
                <Text style={styles.troubleshootingTitle}>{t('troubleshooting.writeError.title')}</Text>
                <Text style={styles.troubleshootingText}>{t('troubleshooting.writeError.solution')}</Text>
              </View>
            </View>
          </Card>
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
    marginBottom: SIZES.medium,
  },
  contactCard: {
    padding: 0,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.medium,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    marginLeft: SIZES.medium,
  },
  contactTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  contactText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  faqCard: {
    marginBottom: SIZES.small,
  },
  question: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.small,
  },
  answer: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  troubleshootingCard: {
    padding: SIZES.medium,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.small,
    paddingVertical: SIZES.small,
  },
  troubleshootingIcon: {
    marginRight: SIZES.medium,
    marginTop: 2,
    flexShrink: 0,
  },
  troubleshootingContent: {
    flex: 1,
  },
  troubleshootingTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  troubleshootingText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.medium,
  },
});

export default HelpSupportScreen;
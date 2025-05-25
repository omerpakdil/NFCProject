import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import NfcService, { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const DataMergeScreen = ({ navigation }) => {
  const { t } = useTranslation('dataMerge');
  
  // Store
  const { scans } = useHistoryStore();
  const { canUseFeature } = useSubscriptionStore();
  
  // State
  const [selectedScans, setSelectedScans] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  // Premium özellik kontrolü
  useEffect(() => {
    if (!canUseFeature('data_merge')) {
      navigation.replace('Subscription');
    }
  }, []);
  
  // Tarama seçildiğinde veya kaldırıldığında
  const toggleScanSelection = (scan) => {
    if (selectedScans.find(s => s.id === scan.id)) {
      // Zaten seçiliyse, kaldır
      setSelectedScans(selectedScans.filter(s => s.id !== scan.id));
    } else {
      // Seçili değilse, ekle
      setSelectedScans([...selectedScans, scan]);
    }
  };
  
  // Birleştirme için veri yazma
  const handleWriteMergedData = async () => {
    try {
      if (selectedScans.length === 0) {
        setAlertConfig({
          visible: true,
          title: t('alerts.error'),
          message: t('alerts.selectData'),
          type: 'error',
          buttons: [{ text: t('common:alerts.ok') }]
        });
        return;
      }
      
      setIsWriting(true);
      
      // Seçilen verileri al
      const dataItems = selectedScans.map(scan => scan.data);
      
      // Veri yazma işlemi
      NfcService.mergeAndWriteTag(
        dataItems,
        handleWriteSuccess,
        handleWriteError
      );
      
      // Yazma mesajı
      setAlertConfig({
        visible: true,
        title: t('alerts.writingTag'),
        message: t('alerts.bringPhoneNear'),
        type: 'info',
        buttons: []
      });
    } catch (error) {
      console.log('Veri yazma hatası:', error);
      setIsWriting(false);
      setAlertConfig({
        visible: true,
        title: t('alerts.error'),
        message: t('alerts.writeFailed') + ': ' + error.message,
        type: 'error',
        buttons: [{ text: t('common:alerts.ok') }]
      });
    }
  };
  
  // Başarılı yazma
  const handleWriteSuccess = (message) => {
    setIsWriting(false);
    setAlertConfig({
      visible: true,
      title: t('alerts.success'),
      message: t('alerts.mergeSuccess'),
      type: 'success',
      buttons: [
        { 
          text: t('common:alerts.ok'), 
          onPress: () => {
            setSelectedScans([]);
            navigation.goBack();
          } 
        }
      ]
    });
  };
  
  // Hatalı yazma
  const handleWriteError = (error) => {
    setIsWriting(false);
    setAlertConfig({
      visible: true,
      title: t('alerts.error'),
      message: error || t('alerts.writeFailed'),
      type: 'error',
      buttons: [{ text: t('common:alerts.ok') }]
    });
  };
  
  // Tarama için ikon belirleme
  const getIconName = (scan) => {
    if (!scan || !scan.data) return "document-text";
    
    switch(scan.data.type) {
      case DATA_TYPES.URL:
        return "link";
      case DATA_TYPES.PHONE:
        return "call";
      case DATA_TYPES.EMAIL:
        return "mail";
      case DATA_TYPES.WIFI:
        return "wifi";
      case DATA_TYPES.CONTACT:
        return "person";
      case DATA_TYPES.TEXT:
        return "document-text";
      case DATA_TYPES.PROTECTED:
        return "lock-closed";
      case DATA_TYPES.MERGED:
        return "git-merge";
      case DATA_TYPES.CUSTOM:
      default:
        return "code-working";
    }
  };
  
  // Filtreleme fonksiyonu ekleyelim
  const getFilteredScans = () => {
    // Şifreli içerikleri filtreleme seçeneğini kullanıcıya bırakmak için yorum satırı olarak bırakıyorum
    // const filteredList = scans.filter(scan => scan.data.type !== DATA_TYPES.PROTECTED);
    
    // Taramaları tarih sırasına göre sırala (yeniden eskiye)
    return scans.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };
  
  // Render scanItem'ı güncelleyelim
  const renderScanItem = ({ item }) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString('tr-TR');
    const isSelected = selectedScans.some(s => s.id === item.id);
    const isEncrypted = item.data.type === DATA_TYPES.PROTECTED;
    
    return (
      <TouchableOpacity 
        onPress={() => toggleScanSelection(item)}
        activeOpacity={0.7}
        disabled={isEncrypted} // Şifreli içerikleri seçilemez yap
      >
        <Card 
          style={[
            styles.scanCard,
            isSelected && styles.selectedScanCard,
            isEncrypted && styles.encryptedScanCard
          ]}
        >
          <View style={styles.scanCardContent}>
            <View style={[
              styles.scanTypeIcon,
              isSelected && styles.selectedScanTypeIcon,
              isEncrypted && styles.encryptedScanTypeIcon
            ]}>
              <Ionicons 
                name={getIconName(item)} 
                size={24} 
                color={isSelected ? COLORS.text : isEncrypted ? COLORS.warning : COLORS.primary} 
              />
            </View>
            <View style={styles.scanInfo}>
              <Text style={styles.scanTitle} numberOfLines={1}>
                {item.data.value || t('nfcTag')}
              </Text>
              <Text style={styles.scanSubtext}>
                {item.tagType} • {item.data.type} • {formattedDate}
              </Text>
              
              {isEncrypted && (
                <View style={styles.encryptedBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.warning} />
                  <Text style={styles.encryptedBadgeText}>{t('encryptedContent')}</Text>
                </View>
              )}
            </View>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Boş liste gösterimi
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="apps" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>{t('empty.title')}</Text>
      <Text style={styles.emptyText}>
        {t('empty.description')}
      </Text>
      <Button
        title={t('empty.scanButton')}
        onPress={() => navigation.navigate('Home')}
        style={styles.emptyButton}
        icon="scan"
      />
    </View>
  );

  // Seçim özeti
  const renderSelectionSummary = () => {
    if (selectedScans.length === 0) return null;
    
    return (
      <View style={styles.selectionSummary}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionCount}>{t('selection.count', { count: selectedScans.length })}</Text>
          <TouchableOpacity onPress={() => setSelectedScans([])}>
            <Text style={styles.clearSelection}>{t('selection.clear')}</Text>
          </TouchableOpacity>
        </View>
        <Button
          title={t('selection.mergeButton')}
          onPress={handleWriteMergedData}
          style={styles.mergeButton}
          icon="git-merge"
          disabled={isWriting}
        />
      </View>
    );
  };

  // Ana render
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('title')}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.info} />
        <Text style={styles.infoText}>
          {t('infoText')}
        </Text>
      </View>

      <FlatList
        data={getFilteredScans()}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
      />

      {renderSelectionSummary()}
      
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: 60,
    paddingBottom: SIZES.small,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 16,
    marginHorizontal: SIZES.screenPadding,
    marginBottom: 16,
    borderRadius: SIZES.borderRadius,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.text,
    fontSize: SIZES.small,
  },
  listContent: {
    padding: SIZES.screenPadding,
    paddingTop: 0,
    flexGrow: 1,
  },
  scanCard: {
    marginBottom: SIZES.small,
    paddingVertical: SIZES.small,
  },
  selectedScanCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanTypeIcon: {
    backgroundColor: COLORS.surface,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  selectedScanTypeIcon: {
    backgroundColor: COLORS.primary,
  },
  scanInfo: {
    flex: 1,
    marginRight: 10,
  },
  scanTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  scanSubtext: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
  selectionSummary: {
    backgroundColor: COLORS.cardBackground,
    padding: SIZES.medium,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  selectionCount: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearSelection: {
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  mergeButton: {
    marginTop: SIZES.small,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  encryptedScanCard: {
    opacity: 0.8,
    borderColor: COLORS.warning,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
  },
  encryptedScanTypeIcon: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  encryptedBadgeText: {
    fontSize: 10,
    color: COLORS.warning,
    marginLeft: 4,
  },
});

export default DataMergeScreen; 
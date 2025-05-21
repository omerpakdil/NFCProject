import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import { COLORS, SIZES } from '../constants/theme';
import useHistoryStore from '../features/history/historyStore';
import { DATA_TYPES, TAG_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

// Tag tiplerinden gösterilecek listesi
const TAG_TYPE_OPTIONS = Object.values(TAG_TYPES);

// Veri tiplerinden gösterilecek liste
const DATA_TYPE_OPTIONS = Object.values(DATA_TYPES);

const HistoryScreen = ({ navigation }) => {
  // Search ve filtreleme state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  // Filtreler
  const [filters, setFilters] = useState({
    tagTypes: [],
    dataTypes: [],
    startDate: null,
    endDate: null,
    savedOnly: false,
  });
  
  // Tarih filtreleri için text giriş alanları
  const [startDateText, setStartDateText] = useState('');
  const [endDateText, setEndDateText] = useState('');
  
  // Store
  const { scans, searchScans, clearAllHistory } = useHistoryStore();
  const { isPremiumUser, canUseFeature } = useSubscriptionStore();
  
  // Filtrelenmiş tarama listesi
  const filteredScans = searchQuery || Object.keys(activeFilters).length > 0 
    ? searchScans(searchQuery, activeFilters) 
    : scans;
  
  // Tüm geçmişi temizle
  const handleClearHistory = () => {
    setAlertConfig({
      visible: true,
      title: 'Geçmişi Temizle',
      message: 'Tüm tarama geçmişiniz silinecek. Bu işlem geri alınamaz.',
      type: 'warning',
      buttons: [
        { 
          text: 'İptal', 
          style: 'cancel' 
        },
        { 
          text: 'Temizle', 
          style: 'destructive', 
          onPress: () => clearAllHistory() 
        }
      ]
    });
  };
  
  // Filtreleri uygula
  const applyFilters = () => {
    const newActiveFilters = {};
    
    // Tag tipleri filtresi
    if (filters.tagTypes.length > 0) {
      newActiveFilters.tagTypes = filters.tagTypes;
    }
    
    // Veri tipleri filtresi
    if (filters.dataTypes.length > 0) {
      newActiveFilters.dataTypes = filters.dataTypes;
    }
    
    // Tarih filtreleri
    try {
      // Başlangıç tarihi
      if (startDateText) {
        const parsedStartDate = parseDate(startDateText);
        if (parsedStartDate) {
          newActiveFilters.startDate = parsedStartDate.toISOString();
        }
      }
      
      // Bitiş tarihi
      if (endDateText) {
        const parsedEndDate = parseDate(endDateText);
        if (parsedEndDate) {
          // Bitiş tarihini günün sonuna ayarla (23:59:59)
          parsedEndDate.setHours(23, 59, 59, 999);
          newActiveFilters.endDate = parsedEndDate.toISOString();
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Geçersiz tarih formatı. Lütfen GG.AA.YYYY formatında girin.');
      return;
    }
    
    // Kaydedilenler filtresi
    if (filters.savedOnly) {
      newActiveFilters.savedOnly = true;
    }
    
    setActiveFilters(newActiveFilters);
    setFilterModalVisible(false);
  };
  
  // Filtreleri sıfırla
  const resetFilters = () => {
    setFilters({
      tagTypes: [],
      dataTypes: [],
      startDate: null,
      endDate: null,
      savedOnly: false,
    });
    setStartDateText('');
    setEndDateText('');
  };
  
  // Tarih metni ayrıştırma (GG.AA.YYYY veya GG/AA/YYYY formatında)
  const parseDate = (dateText) => {
    if (!dateText) return null;
    
    // Nokta veya slash ile ayrılmış olabilir
    const parts = dateText.split(/[.\/]/);
    
    if (parts.length !== 3) {
      throw new Error('Geçersiz tarih formatı');
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript'te aylar 0-11 arasındadır
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error('Geçersiz tarih değerleri');
    }
    
    const date = new Date(year, month, day);
    
    // Geçerli tarih kontrolü
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      throw new Error('Geçersiz tarih');
    }
    
    return date;
  };
  
  // Tag tipi seç/kaldır
  const toggleTagTypeFilter = (tagType) => {
    setFilters(prev => {
      if (prev.tagTypes.includes(tagType)) {
        return {
          ...prev,
          tagTypes: prev.tagTypes.filter(t => t !== tagType)
        };
      } else {
        return {
          ...prev,
          tagTypes: [...prev.tagTypes, tagType]
        };
      }
    });
  };
  
  // Veri tipi seç/kaldır
  const toggleDataTypeFilter = (dataType) => {
    setFilters(prev => {
      if (prev.dataTypes.includes(dataType)) {
        return {
          ...prev,
          dataTypes: prev.dataTypes.filter(t => t !== dataType)
        };
      } else {
        return {
          ...prev,
          dataTypes: [...prev.dataTypes, dataType]
        };
      }
    });
  };
  
  // Filter modalı
  const renderFilterModal = () => {
    return (
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gelişmiş Filtreler</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Tag tipleri filtreleme */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Etiket Tipi</Text>
                <View style={styles.tagOptionsContainer}>
                  {TAG_TYPE_OPTIONS.map((tagType) => (
                    <TouchableOpacity
                      key={tagType}
                      style={[
                        styles.tagOption,
                        filters.tagTypes.includes(tagType) && styles.tagOptionSelected
                      ]}
                      onPress={() => toggleTagTypeFilter(tagType)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          filters.tagTypes.includes(tagType) && styles.tagOptionTextSelected
                        ]}
                      >
                        {tagType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Veri tipi filtreleme */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Veri Tipi</Text>
                <View style={styles.tagOptionsContainer}>
                  {DATA_TYPE_OPTIONS.map((dataType) => (
                    <TouchableOpacity
                      key={dataType}
                      style={[
                        styles.tagOption,
                        filters.dataTypes.includes(dataType) && styles.tagOptionSelected
                      ]}
                      onPress={() => toggleDataTypeFilter(dataType)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          filters.dataTypes.includes(dataType) && styles.tagOptionTextSelected
                        ]}
                      >
                        {dataType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Tarih aralığı */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tarih Aralığı</Text>
                <Text style={styles.filterSectionSubtitle}>
                  Tarihleri GG.AA.YYYY formatında girin
                </Text>
                
                <View style={styles.dateInputsContainer}>
                  <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateInputLabel}>Başlangıç</Text>
                    <View style={styles.dateInput}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.dateInputText}
                        placeholder="GG.AA.YYYY"
                        placeholderTextColor={COLORS.textDisabled}
                        value={startDateText}
                        onChangeText={setStartDateText}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateInputLabel}>Bitiş</Text>
                    <View style={styles.dateInput}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.dateInputText}
                        placeholder="GG.AA.YYYY"
                        placeholderTextColor={COLORS.textDisabled}
                        value={endDateText}
                        onChangeText={setEndDateText}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Notları olan taramalar */}
              <View style={styles.filterSection}>
                <View style={styles.switchRow}>
                  <Text style={styles.filterSectionTitle}>Sadece Notlar</Text>
                  <Switch
                    value={filters.savedOnly}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, savedOnly: value }))}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={filters.savedOnly ? COLORS.text : COLORS.textSecondary}
                  />
                </View>
                <Text style={styles.filterSectionSubtitle}>
                  Sadece notları olan taramaları göster
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Sıfırla"
                mode="text"
                onPress={resetFilters}
                style={styles.resetButton}
                textStyle={styles.resetButtonText}
              />
              <Button
                title="Filtreleri Uygula"
                onPress={applyFilters}
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Boş içerik
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>Henüz Tarama Yok</Text>
      <Text style={styles.emptyText}>
        Tarama geçmişiniz burada görüntülenecek.
      </Text>
    </View>
  );
  
  // Filtre göstergesi
  const renderActiveFiltersBadge = () => {
    const filterCount = Object.keys(activeFilters).length;
    
    if (filterCount === 0) return null;
    
    return (
      <View style={styles.activeFiltersBadge}>
        <Text style={styles.activeFiltersBadgeText}>{filterCount}</Text>
      </View>
    );
  };

  // Scan için doğru ikon belirleme
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
      case DATA_TYPES.CUSTOM:
      default:
        return "code-working";
    }
  };
  
  // Tarama elemanı
  const renderScanItem = ({ item }) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleDateString('tr-TR');
    const formattedTime = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return (
      <Card 
        style={styles.scanCard}
        onPress={() => navigation.navigate('ScanDetailScreen', { scanId: item.id })}
      >
        <View style={styles.scanCardContent}>
          <View style={styles.scanTypeIcon}>
            <Ionicons 
              name={getIconName(item)} 
              size={24} 
              color={COLORS.text} 
            />
          </View>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle} numberOfLines={1}>
              {item.data.value || 'NFC Etiket'}
            </Text>
            <Text style={styles.scanSubtext}>
              {item.tagType} • {formattedDate} {formattedTime}
            </Text>
            {item.notes && (
              <View style={styles.noteIndicator}>
                <Ionicons name="chatbubble" size={12} color={COLORS.primary} />
                <Text style={styles.noteIndicatorText}>Not</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </Card>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geçmiş</Text>
        
        {scans.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Ionicons name="trash-outline" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {scans.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Premium kullanıcılar için gelişmiş arama seçenekleri */}
          {isPremiumUser() && canUseFeature('advanced_history') && (
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="filter" size={22} color={COLORS.primary} />
              {renderActiveFiltersBadge()}
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <FlatList
        data={filteredScans}
        keyExtractor={(item) => item.id}
        renderItem={renderScanItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
      />
      
      {renderFilterModal()}
      
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
  searchContainer: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SIZES.medium,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    fontSize: SIZES.medium,
  },
  filterButton: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFiltersBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersBadgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.screenPadding,
  },
  scanCard: {
    marginBottom: SIZES.small,
    paddingVertical: SIZES.small,
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
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  noteIndicatorText: {
    fontSize: SIZES.xsmall,
    color: COLORS.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.medium,
    marginBottom: SIZES.small,
  },
  emptyText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
    maxHeight: '70%',
  },
  modalFooter: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterSectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  tagOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagOption: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagOptionSelected: {
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    borderColor: COLORS.primary,
  },
  tagOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  tagOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    color: COLORS.textSecondary,
  },
  applyButton: {
    minWidth: 150,
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateInputWrapper: {
    width: '48%',
  },
  dateInputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateInputText: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 14,
  },
});

export default HistoryScreen; 
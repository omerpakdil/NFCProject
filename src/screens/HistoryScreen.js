import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
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
import TagInput from '../components/TagInput';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import useHistoryStore, { DEFAULT_CATEGORIES } from '../features/history/historyStore';
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
  const [sortOption, setSortOption] = useState('date_desc');
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
    favoritesOnly: false,
    categories: [],
    tags: [],
  });
  
  // Tarih filtreleri için text giriş alanları
  const [startDateText, setStartDateText] = useState('');
  const [endDateText, setEndDateText] = useState('');
  
  // Store
  const { scans, searchScans, clearAllHistory, exportScans } = useHistoryStore();
  const { isPremiumUser, canUseFeature } = useSubscriptionStore();
  const remainingScans = useHistoryStore(state => state.getRemainingScans());
  const isStorageLimitReached = useHistoryStore(state => state.isStorageLimitReached());
  
  // Sıralama seçenekleri
  const SORT_OPTIONS = [
    { id: 'date_desc', label: 'En Yeni', icon: 'time' },
    { id: 'date_asc', label: 'En Eski', icon: 'time-outline' },
    { id: 'type', label: 'Etiket Tipi', icon: 'pricetag' },
    { id: 'data_type', label: 'Veri Tipi', icon: 'document-text' },
  ];

  // Filtrelenmiş ve sıralanmış tarama listesi
  const getFilteredAndSortedScans = () => {
    let result = searchQuery || Object.keys(activeFilters).length > 0 
      ? searchScans(searchQuery, activeFilters) 
      : scans;

    // Sıralama uygula
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'date_desc':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'date_asc':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'type':
          return a.tagType.localeCompare(b.tagType);
        case 'data_type':
          return a.data.type.localeCompare(b.data.type);
        default:
          return 0;
      }
    });

    return result;
  };

  // Dışa aktarma işlemi
  const handleExport = () => {
    const format = 'csv'; // veya 'json'
    const exportedData = exportScans(format, activeFilters);
    
    // Dosya adı oluştur
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `nfc_scans_${timestamp}.${format}`;
    
    // Dosyayı kaydet veya paylaş
    Share.share({
      title: fileName,
      message: exportedData,
    });
  };
  
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

    // Favoriler filtresi
    if (filters.favoritesOnly) {
      newActiveFilters.favoritesOnly = true;
    }

    // Kategori filtresi
    if (filters.categories.length > 0) {
      newActiveFilters.categories = filters.categories;
    }

    // Etiket filtresi
    if (filters.tags.length > 0) {
      newActiveFilters.tags = filters.tags;
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
      favoritesOnly: false,
      categories: [],
      tags: [],
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
              {/* Sıralama seçenekleri */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sıralama</Text>
                <View style={styles.sortOptionsContainer}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.sortOption,
                        sortOption === option.id && styles.sortOptionSelected
                      ]}
                      onPress={() => setSortOption(option.id)}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={18} 
                        color={sortOption === option.id ? COLORS.primary : COLORS.textSecondary} 
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortOption === option.id && styles.sortOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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

              {/* Favoriler filtresi */}
              <View style={styles.filterSection}>
                <View style={styles.switchRow}>
                  <Text style={styles.filterSectionTitle}>Sadece Favoriler</Text>
                  <Switch
                    value={filters.favoritesOnly}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, favoritesOnly: value }))}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor={filters.favoritesOnly ? COLORS.text : COLORS.textSecondary}
                  />
                </View>
              </View>

              {/* Kategori filtresi */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategoriler</Text>
                <View style={styles.tagOptionsContainer}>
                  {Object.values(DEFAULT_CATEGORIES).map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        filters.categories.includes(category.id) && styles.categoryOptionSelected,
                        { borderColor: category.color }
                      ]}
                      onPress={() => {
                        setFilters(prev => ({
                          ...prev,
                          categories: prev.categories.includes(category.id)
                            ? prev.categories.filter(id => id !== category.id)
                            : [...prev.categories, category.id]
                        }));
                      }}
                    >
                      <Ionicons 
                        name={category.icon} 
                        size={16} 
                        color={filters.categories.includes(category.id) ? category.color : COLORS.textSecondary} 
                      />
                      <Text
                        style={[
                          styles.categoryOptionText,
                          filters.categories.includes(category.id) && { color: category.color }
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Etiket filtresi */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Etiketler</Text>
                <TagInput
                  tags={filters.tags}
                  availableTags={useHistoryStore.getState().allTags}
                  onAddTag={(tag) => setFilters(prev => ({
                    ...prev,
                    tags: [...prev.tags, tag]
                  }))}
                  onRemoveTag={(tag) => setFilters(prev => ({
                    ...prev,
                    tags: prev.tags.filter(t => t !== tag)
                  }))}
                  maxTags={5}
                />
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
              <View style={styles.modalFooterButtons}>
                <Button
                  title="Dışa Aktar"
                  mode="outlined"
                  onPress={handleExport}
                  icon="download"
                  style={styles.exportButton}
                />
                <Button
                  title="Uygula"
                  onPress={applyFilters}
                  style={styles.applyButton}
                />
              </View>
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
      
      {/* Premium olmayan kullanıcılar için depolama limiti bilgisi */}
      {!isPremiumUser() && (
        <View style={styles.storageLimitContainer}>
          <View style={styles.storageLimitHeader}>
            <View style={styles.storageLimitTitleContainer}>
              <Ionicons 
                name={isStorageLimitReached ? "alert-circle" : "save-outline"} 
                size={22} 
                color={isStorageLimitReached ? COLORS.warning : COLORS.primary} 
              />
              <Text style={styles.storageLimitTitle}>
                {isStorageLimitReached ? "Depolama Limiti Aşıldı" : "Depolama Durumu"}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.upgradePremiumButton}
              onPress={() => navigation.navigate('Home', { screen: 'Subscription' })}
            >
              <Ionicons name="star" size={16} color={COLORS.premium} />
              <Text style={styles.upgradePremiumText}>Premium</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.storageLimitContent}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(100, (1 - remainingScans / useHistoryStore.getState().maxFreeScans) * 100)}%`,
                    backgroundColor: isStorageLimitReached ? COLORS.warning : COLORS.primary 
                  }
                ]} 
              />
            </View>
            
            <View style={styles.storageLimitStats}>
              <Text style={styles.storageLimitText}>
                {isStorageLimitReached
                  ? "Yeni taramalar en eski kayıtların üzerine yazılacak"
                  : `${remainingScans} / ${useHistoryStore.getState().maxFreeScans} tarama hakkınız kaldı`}
              </Text>
              
              <TouchableOpacity 
                style={styles.unlimitedStorageButton}
                onPress={() => navigation.navigate('Home', { screen: 'Subscription' })}
              >
                <Text style={styles.unlimitedStorageText}>Sınırsız Depolama Al</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
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
        data={getFilteredAndSortedScans()}
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
  // Depolama limiti stilleri
  storageLimitContainer: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SIZES.screenPadding,
    marginBottom: SIZES.medium,
    padding: SIZES.medium,
    borderRadius: SIZES.cardRadius,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storageLimitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageLimitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storageLimitTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  storageLimitContent: {
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  storageLimitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLimitText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    flex: 1,
  },
  upgradePremiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.buttonRadius,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  upgradePremiumText: {
    color: COLORS.premium,
    fontSize: SIZES.small,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  unlimitedStorageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  unlimitedStorageText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontWeight: '600',
    marginRight: 4,
  },
  // Yeni stiller
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOptionSelected: {
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 6,
  },
  sortOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  categoryOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    minWidth: 120,
  },
});

export default HistoryScreen; 
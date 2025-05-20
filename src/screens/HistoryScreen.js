import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, SIZES } from '../constants/theme';
import useHistoryStore from '../features/history/historyStore';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const HistoryScreen = ({ navigation }) => {
  // Search ve filtreleme state'leri
  const [searchQuery, setSearchQuery] = useState('');
  
  // Store
  const { scans, searchScans, clearAllHistory } = useHistoryStore();
  const { isPremiumUser, canUseFeature } = useSubscriptionStore();
  
  // Filtrelenmiş tarama listesi
  const filteredScans = searchQuery ? searchScans(searchQuery) : scans;
  
  // Tüm geçmişi temizle
  const handleClearHistory = () => {
    Alert.alert(
      'Geçmişi Temizle',
      'Tüm tarama geçmişiniz silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: () => clearAllHistory() }
      ]
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
        onPress={() => navigation.navigate('ScanDetail', { scanId: item.id })}
      >
        <View style={styles.scanCardContent}>
          <View style={styles.scanTypeIcon}>
            <Ionicons 
              name={item.data.type === 'URL' ? 'link' : 'text'} 
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
            <Button
              title="Filtreler"
              type="outline"
              small
              leftIcon={<Ionicons name="filter" size={16} color={COLORS.primary} />}
              style={styles.filterButton}
              onPress={() => {
                // Premium özellik: Gelişmiş arama
                Alert.alert('Premium Özellik', 'Gelişmiş arama ve filtreleme özellikleri yakında eklenecek.');
              }}
            />
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
    paddingHorizontal: SIZES.screenPadding,
    paddingTop: SIZES.large,
    paddingBottom: SIZES.medium,
  },
  headerTitle: {
    fontSize: SIZES.xlarge,
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
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: SIZES.screenPadding,
  },
  scanCard: {
    marginBottom: SIZES.medium,
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
});

export default HistoryScreen; 
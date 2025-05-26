import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DATA_TYPES, TAG_TYPES } from '../nfc/nfcService';
import useSubscriptionStore from '../subscription/subscriptionStore';

// Default kategorileri tanımla
export const DEFAULT_CATEGORIES = {
  BUSINESS: {
    id: 'business',
    name: 'categories.business',
    color: '#3D7DFF', // Mavi
    icon: 'briefcase'
  },
  PERSONAL: {
    id: 'personal',
    name: 'categories.personal',
    color: '#4CAF50', // Yeşil
    icon: 'person'
  },
  TRANSPORT: {
    id: 'transport',
    name: 'categories.transport',
    color: '#FF9800', // Turuncu
    icon: 'bus'
  },
  TECH: {
    id: 'tech',
    name: 'categories.tech',
    color: '#9C27B0', // Mor
    icon: 'hardware-chip'
  },
  OTHER: {
    id: 'other',
    name: 'categories.other',
    color: '#607D8B', // Gri
    icon: 'ellipsis-horizontal'
  }
};

// Örnek test verileri
const sampleData = [
  {
    id: '1700000001000',
    tagType: TAG_TYPES.NDEF,
    data: {
      type: DATA_TYPES.TEXT,
      value: 'Örnek metin içeriği',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 gün önce
    notes: 'Önemli not: Bu bir test etiketidir.',
    isFavorite: false, // Favori durumu
    categoryId: 'business', // Kategori ID
    tags: ['önemli', 'test'] // Etiketler
  },
  {
    id: '1700000002000',
    tagType: TAG_TYPES.NFC_A,
    data: {
      type: DATA_TYPES.URL,
      value: 'https://www.example.com',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 gün önce
    isFavorite: true,
    categoryId: 'tech',
    tags: ['web', 'site']
  },
  {
    id: '1700000003000',
    tagType: TAG_TYPES.MIFARE_CLASSIC,
    data: {
      type: DATA_TYPES.PHONE,
      value: '+905551234567',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 hafta önce
    notes: 'Şirket kartviziti',
    isFavorite: false,
    categoryId: 'business',
    tags: ['telefon', 'iletişim']
  },
  {
    id: '1700000004000',
    tagType: TAG_TYPES.MIFARE_ULTRALIGHT,
    data: {
      type: DATA_TYPES.EMAIL,
      value: 'ornek@mail.com',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() // 10 gün önce
  },
  {
    id: '1700000005000',
    tagType: TAG_TYPES.NFC_B,
    data: {
      type: DATA_TYPES.CUSTOM,
      value: 'Özel veri formatı: 0xAB3D9F',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 gün önce
    notes: 'Bilinmeyen etiket formatı'
  },
  {
    id: '1700000006000',
    tagType: TAG_TYPES.ISODEP,
    data: {
      type: DATA_TYPES.TEXT,
      value: 'ISO-DEP uyumlu etiket içeriği',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString() // 20 gün önce
  },
  {
    id: '1700000007000',
    tagType: TAG_TYPES.NFC_F,
    data: {
      type: DATA_TYPES.URL,
      value: 'https://www.example.org/products',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString() // 25 gün önce
  },
  {
    id: '1700000008000',
    tagType: TAG_TYPES.NFC_V,
    data: {
      type: DATA_TYPES.TEXT,
      value: 'NFC-V standardı etiket içeriği',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 gün önce
    notes: 'Bu etiket V tipi NFC standardını destekliyor'
  }
];

const useHistoryStore = create(
  persist(
    (set, get) => ({
      // Tüm tarama geçmişi
      scans: [...sampleData], // Örnek verileri başlangıçta ekleyelim
      
      // Kullanıcı kategorileri
      categories: { ...DEFAULT_CATEGORIES },
      
      // Kullanıcı etiketleri (tags) listesi
      allTags: ['önemli', 'test', 'web', 'site', 'telefon', 'iletişim'],
      
      // En fazla saklanan tarama sayısı (ücretsiz kullanıcılar için)
      maxFreeScans: 10,
      
      // Geçmişe yeni tarama ekle
      addScan: (scan) => {
        // Scan: { id, tagType, data, timestamp, notes (optional) }
        const { scans, maxFreeScans } = get();
        const newScan = {
          ...scan,
          id: scan.id || Date.now().toString(),
          timestamp: scan.timestamp || new Date().toISOString(),
          isFavorite: false, // Varsayılan olarak favori değil
          categoryId: 'other', // Varsayılan kategori
          tags: [] // Boş etiket listesi
        };
        
        // Abonelik durumunu kontrol et
        const isPremium = useSubscriptionStore.getState().isPremiumUser();
        
        // Eğer premium değilse ve tarama limiti aşıldıysa en eski taramayı sil
        if (!isPremium && scans.length >= maxFreeScans) {
          // En eski taramayı bul ve sil
          const oldestScanIndex = scans
            .map((s, index) => ({ index, timestamp: new Date(s.timestamp).getTime() }))
            .sort((a, b) => a.timestamp - b.timestamp)[0]?.index;
            
          // Yeni tarama dizisi oluştur, en eski taramayı çıkar
          let updatedScans = [...scans];
          if (oldestScanIndex !== undefined) {
            updatedScans.splice(oldestScanIndex, 1);
          }
          
          set({ scans: [newScan, ...updatedScans] });
        } else {
          set({ scans: [newScan, ...scans] });
        }
        
        return newScan;
      },
      
      // Tarama limitinin aşılıp aşılmadığını kontrol et
      isStorageLimitReached: () => {
        const { scans, maxFreeScans } = get();
        const isPremium = useSubscriptionStore.getState().isPremiumUser();
        
        // Premium kullanıcılar için sınır yok
        if (isPremium) return false;
        
        // Ücretsiz kullanıcılar için tarama sayısı kontrolü
        return scans.length >= maxFreeScans;
      },
      
      // Kalan tarama sayısını göster
      getRemainingScans: () => {
        const { scans, maxFreeScans } = get();
        const isPremium = useSubscriptionStore.getState().isPremiumUser();
        
        // Premium kullanıcılar için sınırsız
        if (isPremium) return Infinity;
        
        // Ücretsiz kullanıcılar için kalan tarama sayısı
        return Math.max(0, maxFreeScans - scans.length);
      },
      
      // Tarama güncelle
      updateScan: (id, updates) => {
        const { scans, allTags } = get();
        
        // Yeni tagler varsa global listeye ekle
        if (updates.tags) {
          const uniqueTags = [...new Set([...allTags, ...updates.tags])];
          set({ allTags: uniqueTags });
        }
        
        const updatedScans = scans.map(scan => 
          scan.id === id ? { ...scan, ...updates } : scan
        );
        
        set({ scans: updatedScans });
      },
      
      // Tarama sil
      deleteScan: (id) => {
        const { scans } = get();
        const filteredScans = scans.filter(scan => scan.id !== id);
        
        set({ scans: filteredScans });
      },
      
      // Favoriye ekleme / çıkarma (yeni)
      toggleFavorite: (id) => {
        const { scans } = get();
        const updatedScans = scans.map(scan => 
          scan.id === id ? { ...scan, isFavorite: !scan.isFavorite } : scan
        );
        
        set({ scans: updatedScans });
      },
      
      // Taramayı kategoriye atama (yeni)
      assignCategory: (id, categoryId) => {
        const { scans } = get();
        const updatedScans = scans.map(scan => 
          scan.id === id ? { ...scan, categoryId } : scan
        );
        
        set({ scans: updatedScans });
      },
      
      // Taramaya etiket ekleme (yeni)
      addTag: (id, tag) => {
        const { scans, allTags } = get();
        const normalizedTag = tag.toLowerCase().trim();
        
        if (!normalizedTag) return;
        
        // Global tag listesine ekle
        if (!allTags.includes(normalizedTag)) {
          set({ allTags: [...allTags, normalizedTag] });
        }
        
        // Taramaya etiketi ekle
        const updatedScans = scans.map(scan => {
          if (scan.id === id) {
            const updatedTags = [...(scan.tags || [])];
            if (!updatedTags.includes(normalizedTag)) {
              updatedTags.push(normalizedTag);
            }
            return { ...scan, tags: updatedTags };
          }
          return scan;
        });
        
        set({ scans: updatedScans });
      },
      
      // Taramadan etiket çıkarma (yeni)
      removeTag: (id, tag) => {
        const { scans } = get();
        const normalizedTag = tag.toLowerCase().trim();
        
        // Taramadan etiketi çıkar
        const updatedScans = scans.map(scan => {
          if (scan.id === id && scan.tags) {
            return { 
              ...scan, 
              tags: scan.tags.filter(t => t !== normalizedTag) 
            };
          }
          return scan;
        });
        
        set({ scans: updatedScans });
        
        // Artık kullanılmayan etiketleri kaldır
        const usedTags = new Set();
        updatedScans.forEach(scan => {
          if (scan.tags) {
            scan.tags.forEach(tag => usedTags.add(tag));
          }
        });
        set({ allTags: [...usedTags] });
      },
      
      // Yeni kategori ekleme (yeni)
      addCategory: (category) => {
        const { categories } = get();
        set({ 
          categories: { 
            ...categories, 
            [category.id]: category 
          } 
        });
      },
      
      // Kategori güncelleme (yeni)
      updateCategory: (id, updates) => {
        const { categories } = get();
        set({ 
          categories: { 
            ...categories, 
            [id]: { 
              ...categories[id], 
              ...updates 
            } 
          } 
        });
      },
      
      // Kategori silme (yeni)
      deleteCategory: (id) => {
        if (id === 'other') return; // "Diğer" kategori silinemez
        
        const { categories, scans } = get();
        const { [id]: _, ...remainingCategories } = categories;
        
        // Silinen kategorideki taramaların kategorisini "Diğer" olarak güncelle
        const updatedScans = scans.map(scan => 
          scan.categoryId === id ? { ...scan, categoryId: 'other' } : scan
        );
        
        set({ 
          categories: remainingCategories,
          scans: updatedScans
        });
      },

      // Filtreleme ile tarama ara (geliştirilmiş)
      searchScans: (query = '', filter = {}) => {
        const { scans } = get();
        
        // Boş arama sorgusu varsa ve hiç filtre yoksa tüm taramaları döndür
        if (!query && Object.keys(filter).length === 0) return scans;
        
        return scans.filter(scan => {
          // Metin araması
          const textMatch = !query || 
            scan.tagType.toLowerCase().includes(query.toLowerCase()) ||
            (scan.data && scan.data.value && scan.data.value.toLowerCase().includes(query.toLowerCase())) ||
            (scan.notes && scan.notes.toLowerCase().includes(query.toLowerCase())) ||
            (scan.tags && scan.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())));
          
          // Filtreler kontrol edilir
          let filterMatch = true;
          
          // Tarih filtreleri
          if (filter.startDate) {
            filterMatch = filterMatch && new Date(scan.timestamp) >= new Date(filter.startDate);
          }
          if (filter.endDate) {
            filterMatch = filterMatch && new Date(scan.timestamp) <= new Date(filter.endDate);
          }
          
          // Tag tipi filtreleri
          if (filter.tagTypes && filter.tagTypes.length > 0) {
            filterMatch = filterMatch && filter.tagTypes.includes(scan.tagType);
          }
          
          // Veri tipi filtreleri
          if (filter.dataTypes && filter.dataTypes.length > 0) {
            filterMatch = filterMatch && filter.dataTypes.includes(scan.data.type);
          }
          
          // Sadece notları olanlar
          if (filter.savedOnly) {
            filterMatch = filterMatch && scan.notes && scan.notes.trim().length > 0;
          }
          
          // Sadece favoriler
          if (filter.favoritesOnly) {
            filterMatch = filterMatch && scan.isFavorite === true;
          }
          
          // Kategori filtreleri
          if (filter.categories && filter.categories.length > 0) {
            filterMatch = filterMatch && filter.categories.includes(scan.categoryId);
          }
          
          // Etiket filtreleri
          if (filter.tags && filter.tags.length > 0) {
            filterMatch = filterMatch && 
              scan.tags && scan.tags.some(tag => filter.tags.includes(tag.toLowerCase()));
          }
          
          return textMatch && filterMatch;
        });
      },
      
      // Taramaları istatistik için analiz et (yeni)
      getStatistics: () => {
        const { scans } = get();
        
        // Boş veri durumu
        if (scans.length === 0) {
          return {
            totalScans: 0,
            favoriteScans: 0,
            categoryCounts: {},
            tagTypeCounts: {},
            dataTypeCounts: {},
            scansByDay: [],
            topTags: []
          };
        }
        
        // Toplam tarama sayısı
        const totalScans = scans.length;
        
        // Favori taramalar
        const favoriteScans = scans.filter(scan => scan.isFavorite).length;
        
        // Kategori dağılımı
        const categoryCounts = scans.reduce((acc, scan) => {
          const categoryId = scan.categoryId || 'other';
          acc[categoryId] = (acc[categoryId] || 0) + 1;
          return acc;
        }, {});
        
        // Tag tipi dağılımı
        const tagTypeCounts = scans.reduce((acc, scan) => {
          acc[scan.tagType] = (acc[scan.tagType] || 0) + 1;
          return acc;
        }, {});
        
        // Veri tipi dağılımı
        const dataTypeCounts = scans.reduce((acc, scan) => {
          if (scan.data && scan.data.type) {
            acc[scan.data.type] = (acc[scan.data.type] || 0) + 1;
          }
          return acc;
        }, {});
        
        // Günlere göre tarama sayısı (son 30 gün)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const scansByDay = scans
          .filter(scan => new Date(scan.timestamp) >= thirtyDaysAgo)
          .reduce((acc, scan) => {
            const date = new Date(scan.timestamp).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {});
          
        // En çok kullanılan etiketler
        const tagCounts = {};
        scans.forEach(scan => {
          if (scan.tags) {
            scan.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
        
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }));
        
        return {
          totalScans,
          favoriteScans,
          categoryCounts,
          tagTypeCounts,
          dataTypeCounts,
          scansByDay,
          topTags
        };
      },
      
      // Tarama verilerini dışa aktarma (yeni)
      exportScans: (format = 'json', filter = {}) => {
        const { searchScans } = get();
        const filteredScans = searchScans('', filter);
        
        // Dışa aktarılacak verileri hazırla
        const exportData = filteredScans.map(scan => ({
          id: scan.id,
          timestamp: scan.timestamp,
          tagType: scan.tagType,
          dataType: scan.data.type,
          value: scan.data.value,
          notes: scan.notes || '',
          isFavorite: scan.isFavorite,
          category: scan.categoryId,
          tags: scan.tags ? scan.tags.join(', ') : ''
        }));
        
        switch (format) {
          case 'json':
            return JSON.stringify(exportData, null, 2);
            
          case 'csv':
            // CSV başlık satırı
            const headers = Object.keys(exportData[0] || {}).join(',');
            // CSV içerik satırları
            const rows = exportData.map(item => 
              Object.values(item).map(value => 
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
              ).join(',')
            );
            return [headers, ...rows].join('\n');
            
          default:
            return JSON.stringify(exportData);
        }
      },
      
      // Tüm tarama geçmişini temizle
      clearAllHistory: () => {
        set({ scans: [] });
      },
      
      // Belirli bir taramayı getir
      getScanById: (id) => {
        const { scans } = get();
        return scans.find(scan => scan.id === id);
      },
    }),
    {
      name: 'nfc-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useHistoryStore; 
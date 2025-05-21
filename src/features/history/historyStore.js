import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DATA_TYPES, TAG_TYPES } from '../nfc/nfcService';

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
    notes: 'Önemli not: Bu bir test etiketidir.'
  },
  {
    id: '1700000002000',
    tagType: TAG_TYPES.NFC_A,
    data: {
      type: DATA_TYPES.URL,
      value: 'https://www.example.com',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 gün önce
  },
  {
    id: '1700000003000',
    tagType: TAG_TYPES.MIFARE_CLASSIC,
    data: {
      type: DATA_TYPES.PHONE,
      value: '+905551234567',
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 hafta önce
    notes: 'Şirket kartviziti'
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
      
      // En fazla saklanan tarama sayısı (ücretsiz kullanıcılar için)
      maxFreeScans: 10,
      
      // Geçmişe yeni tarama ekle
      addScan: (scan) => {
        // Scan: { id, tagType, data, timestamp, notes (optional) }
        const { scans } = get();
        const newScan = {
          ...scan,
          id: scan.id || Date.now().toString(),
          timestamp: scan.timestamp || new Date().toISOString(),
        };
        
        set({ scans: [newScan, ...scans] });
        return newScan;
      },
      
      // Tarama güncelle
      updateScan: (id, updates) => {
        const { scans } = get();
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
      
      // Filtreleme ile tarama ara
      searchScans: (query = '', filter = {}) => {
        const { scans } = get();
        
        // Boş arama sorgusu varsa ve hiç filtre yoksa tüm taramaları döndür
        if (!query && Object.keys(filter).length === 0) return scans;
        
        return scans.filter(scan => {
          // Metin araması
          const textMatch = !query || 
            scan.tagType.toLowerCase().includes(query.toLowerCase()) ||
            (scan.data && scan.data.value && scan.data.value.toLowerCase().includes(query.toLowerCase())) ||
            (scan.notes && scan.notes.toLowerCase().includes(query.toLowerCase()));
          
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
          
          return textMatch && filterMatch;
        });
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
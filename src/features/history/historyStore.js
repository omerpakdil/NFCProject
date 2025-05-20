import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const useHistoryStore = create(
  persist(
    (set, get) => ({
      // Tüm tarama geçmişi
      scans: [],
      
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
        
        // Boş arama sorgusu varsa tüm taramaları döndür
        if (!query && Object.keys(filter).length === 0) return scans;
        
        return scans.filter(scan => {
          // Metin araması
          const textMatch = !query || 
            scan.tagType.toLowerCase().includes(query.toLowerCase()) ||
            (scan.notes && scan.notes.toLowerCase().includes(query.toLowerCase()));
          
          // Filtreler kontrol edilir (tarih aralığı, etiket tipi, vb.)
          let filterMatch = true;
          if (filter.startDate) {
            filterMatch = filterMatch && new Date(scan.timestamp) >= new Date(filter.startDate);
          }
          if (filter.endDate) {
            filterMatch = filterMatch && new Date(scan.timestamp) <= new Date(filter.endDate);
          }
          if (filter.tagType) {
            filterMatch = filterMatch && scan.tagType === filter.tagType;
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
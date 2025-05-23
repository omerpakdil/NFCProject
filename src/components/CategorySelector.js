import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS, SHADOWS, SIZES } from '../constants/theme';

const CategorySelector = ({
  categories = {},
  selectedCategoryId,
  onSelectCategory,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Kategorileri FlatList için diziye dönüştür
  const categoryList = Object.values(categories);

  // Seçili kategori bilgisini güncelle
  useEffect(() => {
    // Kategori ID'si ile eşleşen kategoriyi bul
    const category = categoryList.find(cat => cat.id === selectedCategoryId);
    setSelectedCategory(category || null);
  }, [selectedCategoryId, categories]);

  // Modal'ı aç/kapa
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  // Kategori'ye tıklandığında
  const handleCategoryPress = (categoryId) => {
    onSelectCategory(categoryId);
    closeModal();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.selector} onPress={openModal}>
        <View
          style={[
            styles.colorIndicator,
            { backgroundColor: selectedCategory?.color || COLORS.border },
          ]}
        />
        <Text style={[
          styles.categoryName, 
          selectedCategory && styles.selectedCategoryName
        ]}>
          {selectedCategory?.name || 'Kategori seç'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={0.9}
          onPress={closeModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>
            
            <FlatList
              data={categoryList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === item.id && styles.selectedCategoryItem,
                  ]}
                  onPress={() => handleCategoryPress(item.id)}
                >
                  <View style={styles.categoryItemContent}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: item.color || COLORS.border },
                      ]}
                    >
                      <Ionicons name={item.icon} size={18} color={COLORS.text} />
                    </View>
                    <Text style={[
                      styles.categoryItemText,
                      selectedCategoryId === item.id && styles.selectedCategoryItemText
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedCategoryId === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              style={styles.categoriesList}
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.small,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
  },
  selectedCategoryName: {
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.screenPadding,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    width: '90%',
    maxWidth: 350,
    padding: SIZES.medium,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  categoriesList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  selectedCategoryItemText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(61, 125, 255, 0.1)',
  },
  closeButton: {
    backgroundColor: COLORS.surface,
    padding: SIZES.medium,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginTop: SIZES.medium,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
});

export default CategorySelector; 
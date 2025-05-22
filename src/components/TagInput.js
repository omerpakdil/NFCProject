import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { COLORS, SIZES } from '../constants/theme';

const TagInput = ({ 
  tags = [], 
  availableTags = [],
  onAddTag, 
  onRemoveTag,
  maxTags = 10,
  style 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Kullanıcı zaten eklenmiş olmayan etiketleri öner
  const getSuggestions = () => {
    if (!inputValue.trim()) return [];
    
    const userTags = tags.map(tag => tag.toLowerCase());
    return availableTags
      .filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) && 
        !userTags.includes(tag.toLowerCase())
      )
      .slice(0, 5); // En fazla 5 öneri göster
  };
  
  // Etiket ekle
  const handleAddTag = (tag) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (
      normalizedTag && 
      !tags.includes(normalizedTag) && 
      tags.length < maxTags
    ) {
      onAddTag(normalizedTag);
      setInputValue('');
    }
  };

  // Enter tuşu veya boşluk ile etiket ekle
  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === ' ' || e.nativeEvent.key === 'Enter') {
      if (inputValue.trim()) {
        handleAddTag(inputValue);
        e.preventDefault();
      }
    }
  };
  
  // Önerilerden etiket seçildiğinde
  const handleSelectSuggestion = (suggestion) => {
    handleAddTag(suggestion);
    setShowSuggestions(false);
  };

  // Önerileri göster/gizle
  const renderSuggestions = () => {
    const suggestions = getSuggestions();
    
    if (!showSuggestions || suggestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Etiket listesi */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScrollView}
        contentContainerStyle={styles.tagsList}
      >
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => onRemoveTag(tag)}>
              <Ionicons name="close-circle" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* Etiket giriş alanı */}
        {tags.length < maxTags && (
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyPress={handleKeyPress}
              placeholder={tags.length === 0 ? "Etiket ekle..." : ""}
              placeholderTextColor={COLORS.textSecondary}
              onSubmitEditing={() => handleAddTag(inputValue)}
            />
            {inputValue ? (
              <TouchableOpacity onPress={() => handleAddTag(inputValue)}>
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Etiket önerileri */}
      {renderSuggestions()}
      
      {/* Maksimum etiket uyarısı */}
      {tags.length >= maxTags && (
        <Text style={styles.maxTagsWarning}>
          Maksimum {maxTags} etiket ekleyebilirsiniz
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tagsScrollView: {
    flexDirection: 'row',
    width: '100%',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  tagText: {
    color: COLORS.text,
    fontSize: SIZES.small,
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  input: {
    color: COLORS.text,
    fontSize: SIZES.small,
    minWidth: 60,
    paddingVertical: 6,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.borderRadius,
    marginTop: 4,
    maxHeight: 150,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  suggestionItem: {
    padding: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    color: COLORS.text,
    fontSize: SIZES.small,
  },
  maxTagsWarning: {
    color: COLORS.secondary,
    fontSize: SIZES.xsmall,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default TagInput; 
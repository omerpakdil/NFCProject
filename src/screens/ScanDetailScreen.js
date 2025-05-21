import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import CustomAlert from '../components/CustomAlert';
import PremiumBadge from '../components/PremiumBadge';
import { COLORS, SIZES } from '../constants/theme';

// Store ve servisler
import useHistoryStore from '../features/history/historyStore';
import { DATA_TYPES } from '../features/nfc/nfcService';
import useSubscriptionStore from '../features/subscription/subscriptionStore';

const ScanDetailScreen = ({ navigation, route }) => {
  // Store
  const { getScanById, deleteScan, updateScan } = useHistoryStore();
  const { canUseFeature } = useSubscriptionStore();
  
  // Tarama verisi
  const [scanData, setScanData] = useState(null);
  
  // Notlar (premium özelliği)
  const [notes, setNotes] = useState('');
  
  // Alert Durumu
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  useEffect(() => {
    // Route'dan scanId parametresini al
    const { scanId } = route.params || {};
    
    if (scanId) {
      // Geçmiş store'dan taramayı al
      const scan = getScanById(scanId);
      
      if (scan) {
        setScanData(scan);
        setNotes(scan.notes || '');
      } else {
        // Tarama bulunamadı, geri dön
        Alert.alert('Hata', 'Tarama kaydı bulunamadı.');
        navigation.goBack();
      }
    }
  }, [route.params]);
  
  // Eğer tarama sonucu yoksa
  if (!scanData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Tarama verisinin türüne göre içerik
  const renderContentByType = () => {
    const { data } = scanData;
    
    switch (data.type) {
      case DATA_TYPES.TEXT:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Metin</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
          </Card>
        );
        
      case DATA_TYPES.URL:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>URL</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title="URL'yi Aç"
              onPress={() => Linking.openURL(data.value)}
              leftIcon={<Ionicons name="open" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      case DATA_TYPES.PHONE:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Telefon Numarası</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <View style={styles.actionRow}>
              <Button
                title="Ara"
                onPress={() => Linking.openURL(`tel:${data.value}`)}
                leftIcon={<Ionicons name="call" size={18} color={COLORS.text} />}
                style={styles.actionButton}
              />
              <Button
                title="Mesaj Gönder"
                type="outline"
                onPress={() => Linking.openURL(`sms:${data.value}`)}
                leftIcon={<Ionicons name="chatbubble" size={18} color={COLORS.primary} />}
                style={[styles.actionButton, { marginLeft: 10 }]}
              />
            </View>
          </Card>
        );
        
      case DATA_TYPES.EMAIL:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>E-posta Adresi</Text>
            <Text style={styles.contentText} selectable>{data.value}</Text>
            <Button
              title="E-posta Gönder"
              onPress={() => Linking.openURL(`mailto:${data.value}`)}
              leftIcon={<Ionicons name="mail" size={18} color={COLORS.text} />}
              style={styles.actionButton}
            />
          </Card>
        );
        
      default:
        return (
          <Card style={styles.contentCard}>
            <Text style={styles.contentTitle}>Veri</Text>
            <Text style={styles.contentText} selectable>{JSON.stringify(data.value)}</Text>
          </Card>
        );
    }
  };
  
  // Veri paylaş
  const handleShare = async () => {
    try {
      const { data } = scanData;
      const message = `NFC Reader Pro ile tarandı: ${data.value}`;
      
      await Share.share({
        message,
      });
    } catch (error) {
      console.log('Paylaşım hatası:', error);
    }
  };
  
  // Taramayı sil
  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Taramayı Sil',
      message: 'Bu tarama kaydını silmek istediğinize emin misiniz?',
      type: 'warning',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            deleteScan(scanData.id);
            navigation.goBack();
          },
        },
      ]
    });
  };
  
  // Yeni bir NFC etiketi yaz (premium özellik)
  const handleWriteTag = () => {
    if (canUseFeature('write')) {
      navigation.navigate('WriteTag', { initialData: scanData.data.value });
    } else {
      navigation.navigate('Subscription');
    }
  };
  
  // Notları kaydet
  const handleSaveNotes = () => {
    if (scanData) {
      updateScan(scanData.id, { notes });
      setAlertConfig({
        visible: true,
        title: 'Başarılı',
        message: 'Notlar kaydedildi.',
        type: 'success',
        buttons: [{ text: 'Tamam' }]
      });
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Tarama Detayı</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarih ve saat bilgisi */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {new Date(scanData.timestamp).toLocaleString('tr-TR')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{scanData.tagType}</Text>
          </View>
        </Card>
        
        {/* Tarama içeriği */}
        {renderContentByType()}
        
        {/* Notlar Bölümü */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Notlar</Text>
            {canUseFeature('advanced_history') ? (
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveNotes}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            ) : (
              <PremiumBadge small />
            )}
          </View>
          
          <TextInput
            style={styles.notesInput}
            placeholder="Bu tarama hakkında notlar ekleyin..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={canUseFeature('advanced_history')}
          />
          
          {!canUseFeature('advanced_history') && (
            <View style={styles.premiumNotesInfo}>
              <Text style={styles.premiumNotesText}>
                Not eklemek için premium aboneliğe geçin
              </Text>
              <Button
                title="Premium'a Geç"
                style={styles.premiumButton}
                small
                onPress={() => navigation.navigate('Subscription')}
              />
            </View>
          )}
        </Card>
        
        {/* Yazma özelliği */}
        <Card style={styles.writeCard}>
          <View style={styles.writeCardHeader}>
            <Text style={styles.writeCardTitle}>NFC Etiketi Yaz</Text>
            {!canUseFeature('write') && <PremiumBadge small />}
          </View>
          
          <Text style={styles.writeCardText}>
            Bu veriyi yeni bir NFC etiketine yazmak için aşağıdaki butonu kullanın.
          </Text>
          
          <Button
            title="NFC Etiketi Yaz"
            type={canUseFeature('write') ? 'primary' : 'outline'}
            onPress={handleWriteTag}
            leftIcon={
              <Ionicons 
                name="create" 
                size={18} 
                color={canUseFeature('write') ? COLORS.text : COLORS.primary} 
              />
            }
            style={styles.writeButton}
          />
        </Card>
      </ScrollView>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: SIZES.medium,
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  content: {
    padding: SIZES.screenPadding,
  },
  infoCard: {
    marginBottom: SIZES.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    marginLeft: 8,
  },
  contentCard: {
    marginBottom: SIZES.medium,
  },
  contentTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  contentText: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SIZES.medium,
  },
  actionButton: {
    marginTop: SIZES.medium,
  },
  writeCard: {
    marginTop: SIZES.small,
    marginBottom: SIZES.large,
  },
  writeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  writeCardTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  writeCardText: {
    fontSize: SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  writeButton: {
    marginTop: SIZES.medium,
  },
  notesCard: {
    marginBottom: SIZES.medium,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.medium,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: SIZES.small,
  },
  premiumNotesInfo: {
    marginTop: SIZES.medium,
    alignItems: 'center',
  },
  premiumNotesText: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontSize: SIZES.small,
  },
  premiumButton: {
    marginTop: 8,
  },
});

export default ScanDetailScreen; 
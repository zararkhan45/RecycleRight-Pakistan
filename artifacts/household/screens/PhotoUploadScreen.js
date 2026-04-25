/**
 * RecycleRight Pakistan — Photo Upload Screen
 *
 * Optional verification step where the user attaches a photo of their
 * bagged waste before pickup. Selection is simulated via a bottom action
 * sheet — no real camera/gallery wiring in the demo.
 */

import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import HeaderBar from '../../collector/components/HeaderBar';
import { typography } from '../../collector/theme.js';

const PRIMARY = '#1E9B6B';
const PRIMARY_DARK = '#17784F';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';
const BG = '#F8FAFB';
const DANGER = '#EF4444';

const PHOTO_TIPS = [
  '✅ Good lighting',
  '✅ Show all the waste bags',
  '✅ Avoid blurry images',
  '✅ Include size reference if possible',
];

export default function PhotoUploadScreen({ navigation }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleBack = () =>
    navigation?.canGoBack?.()
      ? navigation.goBack()
      : navigation?.navigate?.('HomeDashboardScreen');

  const handleSkip = () => handleBack();

  const openSheet = () => setSheetVisible(true);
  const closeSheet = () => setSheetVisible(false);

  const pickFromCamera = () => {
    setSelectedPhoto({ source: 'camera', filename: 'IMG_camera_001.jpg' });
    closeSheet();
  };

  const pickFromGallery = () => {
    setSelectedPhoto({ source: 'gallery', filename: 'gallery_photo_042.jpg' });
    closeSheet();
  };

  const removePhoto = () => setSelectedPhoto(null);

  const handleUpload = () => {
    if (!selectedPhoto) return;
    Alert.alert(
      'Photo uploaded successfully! (Demo mode — no actual upload)',
      undefined,
      [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar
        title="Add Photo Evidence"
        showBack
        onBack={handleBack}
        rightComponent={
          <TouchableOpacity onPress={handleSkip} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        }
      />

      <SafeAreaView style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructional card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📷</Text>
            <Text style={styles.infoTitle}>
              Photo helps verify your waste
            </Text>
            <Text style={styles.infoBody}>
              Clear photos of your waste bags improve collector accuracy and
              earn you bonus verification points.
            </Text>
          </View>

          {/* Upload area / selected preview */}
          {selectedPhoto ? (
            <View style={styles.previewWrap}>
              <View style={styles.previewBox}>
                <Text style={styles.previewIcon}>🖼️</Text>
                <Text style={styles.previewFilename} numberOfLines={1}>
                  {selectedPhoto.filename}
                </Text>
              </View>
              <TouchableOpacity
                onPress={removePhoto}
                style={styles.removeButton}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={openSheet}
              activeOpacity={0.85}
              style={styles.uploadArea}
            >
              <Text style={styles.uploadIcon}>📁</Text>
              <Text style={styles.uploadTitle}>Upload a Photo</Text>
              <Text style={styles.uploadSub}>JPG or PNG, max 5MB</Text>
            </TouchableOpacity>
          )}

          {/* Photo Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Photo Tips</Text>
            {PHOTO_TIPS.map((tip) => (
              <Text key={tip} style={styles.tipRow}>
                {tip}
              </Text>
            ))}
          </View>

          {/* Upload and Continue */}
          <Pressable
            onPress={handleUpload}
            disabled={!selectedPhoto}
            style={({ pressed }) => [
              styles.uploadButton,
              !selectedPhoto && styles.uploadButtonDisabled,
              pressed && selectedPhoto && styles.uploadButtonPressed,
            ]}
          >
            <Text style={styles.uploadButtonText}>Upload and Continue</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Action Sheet modal */}
      <Modal
        transparent
        visible={sheetVisible}
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <TouchableOpacity
              onPress={pickFromCamera}
              style={styles.sheetRow}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetRowText}>Take Photo 📷</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromGallery}
              style={[styles.sheetRow, styles.sheetRowLast]}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetRowText}>Choose from Gallery 🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={closeSheet}
              style={styles.sheetCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  skipText: {
    color: MUTED,
    fontSize: 14,
    fontFamily: typography.fontFamily,
    paddingHorizontal: 4,
  },

  /* Info card */
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  infoBody: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
    fontFamily: typography.fontFamily,
  },

  /* Upload area */
  uploadArea: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  uploadIcon: {
    fontSize: 48,
  },
  uploadTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
  },
  uploadSub: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
  },

  /* Selected preview */
  previewWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    position: 'relative',
  },
  previewBox: {
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewIcon: {
    fontSize: 48,
  },
  previewFilename: {
    marginTop: 8,
    fontSize: 13,
    color: MUTED,
    fontFamily: typography.fontFamily,
    maxWidth: '80%',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  removeButtonText: {
    color: DANGER,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Tips card */
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    fontFamily: typography.fontFamilyMedium,
    marginBottom: 8,
  },
  tipRow: {
    fontSize: 13,
    color: MUTED,
    paddingVertical: 4,
    fontFamily: typography.fontFamily,
  },

  /* Upload button */
  uploadButton: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 52,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonPressed: {
    backgroundColor: PRIMARY_DARK,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },

  /* Action sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetRowLast: {
    borderBottomWidth: 0,
  },
  sheetRowText: {
    fontSize: 16,
    color: TEXT,
    fontFamily: typography.fontFamily,
  },
  sheetCancel: {
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 16,
    color: DANGER,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMedium,
  },
});

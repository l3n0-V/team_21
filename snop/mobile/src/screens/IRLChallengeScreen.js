import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function IRLChallengeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { challenge } = route.params;
  const { submitIRLChallenge } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();

  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera access is required to take photos for IRL challenges.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Compress to reduce file size
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('Photo required', 'Please take a photo to complete this IRL challenge.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitIRLChallenge(token, challenge.id, photoUri);

      Alert.alert(
        'Success! 🎉',
        `You earned ${result.xp_gained} XP!\n\n${result.feedback}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting IRL challenge:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit challenge. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        {/* Challenge Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>IRL Challenge</Text>
        </View>

        {/* Challenge Details */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>
            {challenge.title_no || challenge.title}
          </Text>
          {challenge.title_no && challenge.title && (
            <Text style={[styles.challengeSubtitle, { color: colors.textSecondary }]}>
              {challenge.title}
            </Text>
          )}

          {challenge.description_no && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Mission:
              </Text>
              <Text style={[styles.description, { color: colors.textPrimary }]}>
                {challenge.description_no}
              </Text>
              {challenge.description && (
                <Text style={[styles.descriptionEn, { color: colors.textSecondary }]}>
                  ({challenge.description})
                </Text>
              )}
            </View>
          )}

          {challenge.target && (
            <View style={[styles.targetBox, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
              <Text style={[styles.targetLabel, { color: colors.primary }]}>
                SAY IN NORWEGIAN:
              </Text>
              <Text style={[styles.targetText, { color: colors.primary }]}>
                {challenge.target}
              </Text>
            </View>
          )}

          {/* Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Verification:
            </Text>
            <Text style={[styles.requirement, { color: colors.textPrimary }]}>
              📸 Photo required
            </Text>
          </View>

          {/* Reward */}
          <View style={styles.rewardSection}>
            <Text style={[styles.reward, { color: colors.accent }]}>
              Reward: 50 XP
            </Text>
            <Text style={[styles.difficulty, { color: colors.textSecondary }]}>
              Difficulty: {'⭐'.repeat(challenge.difficulty || 1)}
            </Text>
          </View>
        </View>

        {/* Photo Section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📸 Upload Proof Photo
          </Text>

          {photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.retakeButton, { backgroundColor: colors.accent }]}
                onPress={handleTakePhoto}
              >
                <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.cameraButton, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={[styles.cameraButtonText, { color: colors.primary }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: photoUri ? colors.primary : colors.disabled },
            !photoUri && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || !photoUri}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {photoUri ? 'Submit Challenge' : 'Take Photo First'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  descriptionEn: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  targetBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  targetText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  requirementsSection: {
    marginBottom: 12,
  },
  requirement: {
    fontSize: 14,
    marginBottom: 4,
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reward: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  difficulty: {
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cameraButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

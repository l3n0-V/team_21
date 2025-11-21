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
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

// Step constants
const STEPS = {
  INTRO: 0,
  SPEECH: 1,
  TEXT: 2,
  PHOTO: 3,
  REVIEW: 4
};

// Example phrases by topic for speech practice
const PRACTICE_PHRASES = {
  // A1-A2 topics
  cafe: { no: "Kan jeg få en kaffe, takk?", en: "Can I have a coffee, please?" },
  food: { no: "Jeg vil gjerne ha frokost.", en: "I would like to have breakfast." },
  greetings: { no: "Hei, hvordan har du det?", en: "Hi, how are you?" },
  shopping: { no: "Hvor mye koster dette?", en: "How much does this cost?" },
  transport: { no: "Når går neste buss?", en: "When does the next bus leave?" },
  weather: { no: "Det er fint vær i dag.", en: "The weather is nice today." },
  colors: { no: "Hvilken farge liker du best?", en: "Which color do you like best?" },
  daily_routine: { no: "Jeg står opp klokken sju.", en: "I wake up at seven o'clock." },
  describing: { no: "Han er høy og har brunt hår.", en: "He is tall and has brown hair." },

  // B1-B2 topics
  work: { no: "Jeg jobber som lærer.", en: "I work as a teacher." },
  health: { no: "Jeg trenger å gå til apoteket.", en: "I need to go to the pharmacy." },
  travel: { no: "Jeg skal reise til Bergen i morgen.", en: "I'm going to travel to Bergen tomorrow." },
  hobbies: { no: "Jeg liker å lese bøker.", en: "I like to read books." },
  ambitions: { no: "Jeg drømmer om å bli lege.", en: "I dream of becoming a doctor." },
  news: { no: "Har du lest nyheten i dag?", en: "Have you read the news today?" },
  debate: { no: "Jeg er enig med deg, men...", en: "I agree with you, but..." },
  formal: { no: "Med vennlig hilsen.", en: "Kind regards." },
  society: { no: "Dette er et viktig samfunnsspørsmål.", en: "This is an important social issue." },
  technical: { no: "Prosessen består av tre trinn.", en: "The process consists of three steps." },

  // C1-C2 topics
  academic: { no: "Forskningen viser at...", en: "The research shows that..." },
  idiom: { no: "Det er ikke min kopp te.", en: "It's not my cup of tea." },
  professional: { no: "Vi foreslår følgende løsning.", en: "We propose the following solution." },
  nuance: { no: "På den ene siden... på den andre siden...", en: "On the one hand... on the other hand..." },
  register: { no: "Jeg vil gjerne diskutere dette nærmere.", en: "I would like to discuss this further." },
  literary: { no: "Fortellingen handler om kjærlighet og tap.", en: "The story is about love and loss." },
  dialect: { no: "Det er forskjeller mellom dialektene.", en: "There are differences between the dialects." },
  precision: { no: "For å være mer presis...", en: "To be more precise..." },
  colloquial: { no: "Det var skikkelig kult!", en: "That was really cool!" },
  irony: { no: "Ja, det var jo veldig overraskende.", en: "Yes, that was very surprising." },
  conversation: { no: "Hva synes du om det?", en: "What do you think about that?" },

  default: { no: "Jeg lærer norsk.", en: "I am learning Norwegian." }
};

export default function IRLChallengeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { challenge } = route.params;
  const { submitIRLChallenge } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();
  const { begin, end, lastUri } = useAudio();

  const [currentStep, setCurrentStep] = useState(STEPS.INTRO);
  const [photoUri, setPhotoUri] = useState(null);
  const [textDescription, setTextDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEarlySubmitModal, setShowEarlySubmitModal] = useState(false);
  const [result, setResult] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Get practice phrase for this challenge topic
  const getPracticePhrase = () => {
    const topic = challenge.topic || 'default';
    return PRACTICE_PHRASES[topic] || PRACTICE_PHRASES.default;
  };

  // Get word count requirement based on CEFR level
  const getWordRequirement = () => {
    const requirements = {
      'A1': 5, 'A2': 10, 'B1': 15, 'B2': 25, 'C1': 35, 'C2': 45
    };
    return requirements[challenge.cefr_level] || 10;
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera access is required to take photos for IRL challenges.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
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

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Photo library access is required to select photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3]
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleEarlySubmit = () => {
    setShowEarlySubmitModal(true);
  };

  const confirmEarlySubmit = async () => {
    setShowEarlySubmitModal(false);
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!token) {
      setErrorMessage('Authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      // Convert photo to base64 if exists
      let photoBase64 = null;
      if (photoUri) {
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: FileSystem.EncodingType.Base64
        });
        photoBase64 = `data:image/jpeg;base64,${base64}`;
      }

      // Convert audio to base64 if exists
      let audioBase64 = null;
      if (audioUri) {
        try {
          const audio64 = await FileSystem.readAsStringAsync(audioUri, {
            encoding: 'base64'
          });
          audioBase64 = `data:audio/m4a;base64,${audio64}`;
        } catch (audioError) {
          console.error('Error reading audio file:', audioError);
          // Continue without audio if it fails
        }
      }

      const apiResult = await submitIRLChallenge(token, challenge.id, photoBase64, {
        text_description: textDescription || undefined,
        audio_base64: audioBase64,
        expected_phrase: getPracticePhrase().no
      });

      setResult(apiResult);
      setCurrentStep(STEPS.REVIEW);
    } catch (error) {
      console.error('Error submitting IRL challenge:', error);
      setErrorMessage(error.message || 'Failed to submit challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierInfo = (tier) => {
    switch (tier) {
      case 'gold':
        return { emoji: '🥇', label: 'Gold', color: '#FFD700', percent: '100%' };
      case 'silver':
        return { emoji: '🥈', label: 'Silver', color: '#C0C0C0', percent: '50%' };
      default:
        return { emoji: '🥉', label: 'Bronze', color: '#CD7F32', percent: '20%' };
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Start', 'Speak', 'Text', 'Photo', 'Done'].map((label, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepDot,
            {
              backgroundColor: index <= currentStep ? colors.primary : colors.disabled,
              borderColor: index === currentStep ? colors.accent : 'transparent'
            }
          ]}>
            <Text style={styles.stepDotText}>{index + 1}</Text>
          </View>
          <Text style={[
            styles.stepLabel,
            { color: index <= currentStep ? colors.textPrimary : colors.textSecondary }
          ]}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderIntroStep = () => (
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

      {/* Tiered Rewards Explanation */}
      <View style={[styles.tierCard, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Reward Tiers:
        </Text>
        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥇</Text>
          <Text style={[styles.tierText, { color: colors.textPrimary }]}>
            Gold (100%): Photo + Text verified by AI
          </Text>
        </View>
        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥈</Text>
          <Text style={[styles.tierText, { color: colors.textPrimary }]}>
            Silver (50%): Photo OR Text verified
          </Text>
        </View>
        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥉</Text>
          <Text style={[styles.tierText, { color: colors.textPrimary }]}>
            Bronze (20%): Quick submit
          </Text>
        </View>
        <Text style={[styles.maxReward, { color: colors.accent }]}>
          Max Reward: {challenge.xp_reward || 50} XP
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setCurrentStep(STEPS.SPEECH)}
      >
        <Text style={styles.primaryButtonText}>Start Challenge</Text>
      </TouchableOpacity>
    </View>
  );

  const handleStartRecording = async () => {
    setIsRecording(true);
    await begin();
  };

  const handleStopRecording = async () => {
    const uri = await end();
    setIsRecording(false);
    if (uri) {
      setAudioUri(uri);
    }
  };

  const renderSpeechStep = () => {
    const phrase = getPracticePhrase();

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Step 1: Practice Speaking
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Practice your pronunciation by saying the phrase below. Tap to record and we'll score your pronunciation.
        </Text>

        {/* Practice Phrase */}
        <View style={[styles.phraseBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Text style={[styles.phraseLabel, { color: colors.textSecondary }]}>
            SAY THIS IN NORWEGIAN:
          </Text>
          <Text style={[styles.phraseNorwegian, { color: colors.primary }]}>
            "{phrase.no}"
          </Text>
          <Text style={[styles.phraseEnglish, { color: colors.textSecondary }]}>
            ({phrase.en})
          </Text>
        </View>

        {/* Record Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? (colors.error || '#F44336') : colors.primary }
          ]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        >
          <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎤'}</Text>
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : (audioUri ? 'Record Again' : 'Tap to Record')}
          </Text>
        </TouchableOpacity>

        {/* Audio recorded indicator */}
        {audioUri && !isRecording && (
          <View style={[styles.audioRecorded, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.audioRecordedText, { color: colors.success || '#4CAF50' }]}>
              ✓ Audio recorded
            </Text>
          </View>
        )}

        {audioUri && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                { flex: 1 }
              ]}
              onPress={handleEarlySubmit}
            >
              <Text style={styles.primaryButtonText}>Submit (Bronze)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                { flex: 1, marginLeft: 8 }
              ]}
              onPress={() => setCurrentStep(STEPS.TEXT)}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTextStep = () => {
    const wordCount = textDescription.trim().split(/\s+/).filter(w => w).length;
    const wordReq = getWordRequirement();
    const meetsRequirement = wordCount >= wordReq;

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Step 2: Write in Norwegian
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Describe your experience or what you did in Norwegian. AI will analyze your writing.
        </Text>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background,
              color: colors.textPrimary,
              borderColor: meetsRequirement ? colors.success || '#4CAF50' : colors.border
            }
          ]}
          placeholder={`Write at least ${wordReq} words in Norwegian...`}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          value={textDescription}
          onChangeText={setTextDescription}
          textAlignVertical="top"
        />

        <View style={styles.wordCountRow}>
          <Text style={[
            styles.wordCount,
            { color: meetsRequirement ? colors.success || '#4CAF50' : colors.textSecondary }
          ]}>
            {wordCount} / {wordReq} words {meetsRequirement ? '✓' : ''}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.warningButton, { backgroundColor: colors.warning || '#FFA500' }]}
            onPress={handleEarlySubmit}
          >
            <Text style={styles.warningButtonText}>Submit (Silver)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: meetsRequirement ? colors.primary : colors.disabled },
              { flex: 1, marginLeft: 8 }
            ]}
            onPress={() => setCurrentStep(STEPS.PHOTO)}
            disabled={!meetsRequirement}
          >
            <Text style={styles.primaryButtonText}>
              {meetsRequirement ? 'Continue' : `Need ${wordReq - wordCount} more words`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPhotoStep = () => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        Step 3: Take a Photo
      </Text>
      <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
        Take a photo as proof of completing the challenge. AI will verify the photo matches the task.
      </Text>

      {photoUri ? (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={handleTakePhoto}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Retake
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={handlePickPhoto}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.photoButtonRow}>
          <TouchableOpacity
            style={[styles.cameraButton, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
            onPress={handleTakePhoto}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={[styles.cameraButtonText, { color: colors.primary }]}>
              Take Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraButton, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
            onPress={handlePickPhoto}
          >
            <Text style={styles.cameraIcon}>🖼️</Text>
            <Text style={[styles.cameraButtonText, { color: colors.primary }]}>
              Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.warningButton, { backgroundColor: colors.warning || '#FFA500' }]}
          onPress={handleEarlySubmit}
        >
          <Text style={styles.warningButtonText}>Submit (Silver)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: photoUri ? colors.primary : colors.disabled },
            { flex: 1, marginLeft: 8 }
          ]}
          onPress={handleSubmit}
          disabled={!photoUri || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {photoUri ? 'Submit for Gold' : 'Take Photo First'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResultStep = () => {
    if (!result) return null;

    const tierInfo = getTierInfo(result.tier);

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultEmoji}>{tierInfo.emoji}</Text>
          <Text style={[styles.resultTier, { color: tierInfo.color }]}>
            {tierInfo.label} Tier!
          </Text>
        </View>

        <View style={[styles.xpBox, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.xpGained, { color: colors.primary }]}>
            +{result.xp_gained} XP
          </Text>
          <Text style={[styles.xpMax, { color: colors.textSecondary }]}>
            of {result.max_xp || challenge.xp_reward || 50} possible ({tierInfo.percent})
          </Text>
        </View>

        {/* AI Verification Notice */}
        <View style={[styles.aiNotice, { backgroundColor: colors.background }]}>
          <Text style={[styles.aiNoticeText, { color: colors.textSecondary }]}>
            🤖 Verified by AI
          </Text>
        </View>

        <Text style={[styles.feedback, { color: colors.textPrimary }]}>
          {result.feedback}
        </Text>

        {result.feedback_no && (
          <Text style={[styles.feedbackNo, { color: colors.textSecondary }]}>
            {result.feedback_no}
          </Text>
        )}

        {/* Pronunciation Result */}
        {result.pronunciation && (
          <View style={styles.verificationResult}>
            <Text style={[styles.verificationLabel, { color: colors.textSecondary }]}>
              Pronunciation:
            </Text>
            <Text style={[
              styles.verificationStatus,
              { color: result.pronunciation.pass ? (colors.success || '#4CAF50') : (colors.error || '#F44336') }
            ]}>
              {result.pronunciation.pass ? '✓ Good!' : '✗ Needs practice'}
              {result.pronunciation.similarity !== undefined &&
                ` (${Math.round(result.pronunciation.similarity * 100)}% match)`}
            </Text>
            {result.pronunciation.transcription && (
              <Text style={[styles.transcription, { color: colors.textSecondary }]}>
                You said: "{result.pronunciation.transcription}"
              </Text>
            )}
            {result.pronunciation.feedback && (
              <Text style={[styles.pronunciationFeedback, { color: colors.textPrimary }]}>
                {result.pronunciation.feedback}
              </Text>
            )}
          </View>
        )}

        {/* Photo Verification Result */}
        {result.photo_verification && (
          <View style={styles.verificationResult}>
            <Text style={[styles.verificationLabel, { color: colors.textSecondary }]}>
              Photo Verification:
            </Text>
            <Text style={[
              styles.verificationStatus,
              { color: result.photo_verification.verified ? (colors.success || '#4CAF50') : (colors.error || '#F44336') }
            ]}>
              {result.photo_verification.verified ? '✓ Verified' : '✗ Not verified'}
              {result.photo_verification.confidence &&
                ` (${Math.round(result.photo_verification.confidence * 100)}% confidence)`}
            </Text>
          </View>
        )}

        {/* Text Verification Result */}
        {result.text_verification && (
          <View style={styles.verificationResult}>
            <Text style={[styles.verificationLabel, { color: colors.textSecondary }]}>
              Text Analysis:
            </Text>
            <Text style={[
              styles.verificationStatus,
              { color: result.text_verification.verified ? (colors.success || '#4CAF50') : (colors.error || '#F44336') }
            ]}>
              {result.text_verification.verified ? '✓ Verified' : '✗ Needs improvement'}
              {result.text_verification.score && ` (Score: ${result.text_verification.score}/100)`}
            </Text>
            {result.text_verification.suggestions && result.text_verification.suggestions.length > 0 && (
              <View style={styles.suggestions}>
                <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                  Suggestions:
                </Text>
                {result.text_verification.suggestions.map((suggestion, idx) => (
                  <Text key={idx} style={[styles.suggestionItem, { color: colors.textPrimary }]}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Early Submit Warning Modal
  const renderEarlySubmitModal = () => (
    <Modal
      visible={showEarlySubmitModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowEarlySubmitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
          <Text style={styles.modalEmoji}>⚠️</Text>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Submit Early?
          </Text>
          <Text style={[styles.modalText, { color: colors.textSecondary }]}>
            You are about to submit without completing all steps. This will result in reduced XP:
          </Text>

          <View style={[styles.modalTierInfo, { backgroundColor: (colors.warning || '#FFA500') + '20', borderColor: colors.warning || '#FFA500' }]}>
            {currentStep === STEPS.SPEECH && (
              <Text style={[styles.modalTierText, { color: '#CD7F32' }]}>
                🥉 Bronze: 20% XP ({Math.round((challenge.xp_reward || 50) * 0.2)} XP)
              </Text>
            )}
            {currentStep === STEPS.TEXT && (
              <>
                {textDescription.trim().split(/\s+/).filter(w => w).length >= getWordRequirement() ? (
                  <Text style={[styles.modalTierText, { color: '#C0C0C0' }]}>
                    🥈 Silver: 50% XP ({Math.round((challenge.xp_reward || 50) * 0.5)} XP)
                  </Text>
                ) : (
                  <Text style={[styles.modalTierText, { color: '#CD7F32' }]}>
                    🥉 Bronze: 20% XP ({Math.round((challenge.xp_reward || 50) * 0.2)} XP)
                    {'\n'}
                    <Text style={{ fontSize: 12 }}>(Need more words for Silver)</Text>
                  </Text>
                )}
              </>
            )}
            {currentStep === STEPS.PHOTO && (
              <Text style={[styles.modalTierText, { color: '#C0C0C0' }]}>
                🥈 Silver: 50% XP ({Math.round((challenge.xp_reward || 50) * 0.5)} XP)
              </Text>
            )}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.disabled }]}
              onPress={() => setShowEarlySubmitModal(false)}
            >
              <Text style={styles.modalButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.warning || '#FFA500' }]}
              onPress={confirmEarlySubmit}
            >
              <Text style={styles.modalButtonText}>Submit Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🎯</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>IRL Challenge</Text>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.levelBadgeText}>{challenge.cefr_level}</Text>
          </View>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error || '#F44336' }]}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Text style={styles.errorBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step Indicator */}
        {currentStep !== STEPS.REVIEW && renderStepIndicator()}

        {/* Content based on step */}
        {currentStep === STEPS.INTRO && renderIntroStep()}
        {currentStep === STEPS.SPEECH && renderSpeechStep()}
        {currentStep === STEPS.TEXT && renderTextStep()}
        {currentStep === STEPS.PHOTO && renderPhotoStep()}
        {currentStep === STEPS.REVIEW && renderResultStep()}
      </ScrollView>

      {/* Early Submit Modal */}
      {renderEarlySubmitModal()}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
              AI is verifying your submission...
            </Text>
          </View>
        </View>
      )}
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
    paddingBottom: 32,
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
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  stepDotText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
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
  tierCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  tierText: {
    fontSize: 14,
  },
  maxReward: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  photoButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cameraButton: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  wordCountRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultTier: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  xpBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  xpGained: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  xpMax: {
    fontSize: 14,
    marginTop: 4,
  },
  aiNotice: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  aiNoticeText: {
    fontSize: 12,
  },
  feedback: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackNo: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationResult: {
    marginBottom: 12,
  },
  verificationLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  verificationStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestions: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  suggestionItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTierInfo: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modalTierText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  phraseBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  phraseLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  phraseNorwegian: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  phraseEnglish: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  recordIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recordButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  audioRecorded: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  audioRecordedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  errorBannerClose: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  transcription: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pronunciationFeedback: {
    fontSize: 14,
    marginTop: 4,
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, SafeAreaView } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import { useUserStats } from "../context/UserStatsContext";
import { usePerformance } from "../context/PerformanceContext";
import { useNavigation } from "@react-navigation/native";
import RecordButton from "../components/RecordButton";
import { api } from "../services/api";
import { speak } from "../services/ttsService";
import { uploadAudioFile } from "../services/audioService";
import { useTheme } from "../context/ThemeContext";

export default function DailyScreen({ route }) {
  const { challenges, loadTodaysChallenges, loadUserProgress } = useChallenges();
  const navigation = useNavigation();
  const { colors } = useTheme();
  // Use passed challenge or default to first challenge
  const daily = route?.params?.challenge || challenges.daily[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const { token, user } = useAuth();
  const { refreshStats } = useUserStats();
  const { updatePerformance } = usePerformance();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    try {
      console.log('=== BUTTON PRESSED ===');
      console.log('lastUri:', lastUri);
      console.log('daily:', daily);
      console.log('user:', user);
      console.log('token:', token);

      // Check if recording exists
      if (!lastUri) {
        console.log('ERROR: No recording found');
        Alert.alert("Error", "No recording found");
        return;
      }

      // Check if we have a challenge
      if (!daily?.id) {
        console.log('ERROR: Challenge not loaded');
        Alert.alert("Error", "Challenge not loaded");
        return;
      }

      // Check if user is authenticated
      if (!user?.uid) {
        console.log('ERROR: User not authenticated');
        Alert.alert("Error", "User not authenticated");
        return;
      }

      console.log('=== ALL CHECKS PASSED - Starting submission ===');
      setLoading(true);

      // Step 1: Upload audio file to Firebase Storage
      console.log('Uploading audio file...');
      const audioUrl = await uploadAudioFile(lastUri, user.uid, daily.id);
      console.log('Audio uploaded successfully:', audioUrl);

      // Show platform-specific warning for web testing
      if (Platform.OS === 'web') {
        console.warn('');
        console.warn('WEB TESTING MODE ACTIVE');
        console.warn('Backend will receive local file URL and cannot process actual audio');
        console.warn('You will see mock/error responses from backend');
        console.warn('');
      }

      // Step 2: Submit to backend for pronunciation scoring
      console.log('Submitting for pronunciation scoring...');
      const response = await api.scoreDaily(daily.id, audioUrl, token);
      console.log('Scoring result:', response);

      setResult(response);

      // Update performance tracking
      try {
        await updatePerformance({
          challenge: daily,
          score: response.pronunciation_score || response.similarity || (response.pass ? 100 : 50),
          passed: response.pass,
          xpEarned: response.xp_gained,
        });
      } catch (perfError) {
        console.warn("Failed to update performance:", perfError);
      }

      // Reload today's challenges and progress to update completion status
      await loadTodaysChallenges(token);
      await loadUserProgress(token);

      // Show success message if the user passed
      if (response.pass) {
        Alert.alert(
          "Success!",
          `You earned ${response.xp_gained} XP!`
        );
        // Refresh stats to show updated XP and streak
        refreshStats();
      } else {
        Alert.alert("Keep Practicing", "Try again to improve your pronunciation!");
      }
    } catch (error) {
      console.error('=== CRITICAL ERROR ===', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data
      });

      // Detailed error messages for debugging
      let errorTitle = "Submission Failed";
      let errorMessage = "An error occurred. Please try again.";

      if (error.message.includes('Network request failed')) {
        errorTitle = "No Connection";
        errorMessage = "Cannot reach server. Is the backend running on http://localhost:5000?";
      } else if (error.response?.status === 401) {
        errorTitle = "Authentication Error";
        errorMessage = "Your session expired. Please log in again.";
      } else if (error.response?.status === 404) {
        errorTitle = "Challenge Not Found";
        errorMessage = "This challenge doesn't exist on the server.";
      } else if (error.response?.status === 500) {
        errorTitle = "Server Error";
        errorMessage = error.response?.data?.details || "The server encountered an error processing your audio.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: "OK" },
        {
          text: "View Logs",
          onPress: () => console.log('Full error:', JSON.stringify(error, null, 2))
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: `${colors.primary}1A` },
            pressed && styles.backButtonPressed
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </Pressable>

        {/* Norwegian title (prominent) */}
        <Text style={[styles.header, { color: colors.primary }]}>{daily?.title_no || daily?.title}</Text>
      {daily?.title_no && (
        <Text style={[styles.headerHelper, { color: colors.textSecondary }]}>({daily?.title})</Text>
      )}

      {/* Norwegian description (main) */}
      <Text style={[styles.descriptionNorwegian, { color: colors.textPrimary }]}>{daily?.description_no || daily?.description}</Text>
      {daily?.description_no && (
        <Text style={[styles.descriptionHelper, { color: colors.textLight }]}>({daily?.description})</Text>
      )}

      {/* Target phrase section - Norwegian prominent */}
      <View style={[styles.targetSection, { backgroundColor: colors.backgroundAccent, borderLeftColor: colors.accent, shadowColor: colors.shadow }]}>
        <Text style={[styles.targetLabel, { color: colors.accent }]}>SI PÅ NORSK:</Text>
        <Text style={[styles.targetPhrase, { color: colors.accent }]}>"{daily?.target}"</Text>
        <Text style={[styles.targetTranslation, { color: colors.textSecondary }]}>({daily?.prompt})</Text>
      </View>

      <View style={{ height: 16 }} />
      <Pressable
        onPress={() => speak(daily?.target)}
        style={({ pressed }) => [
          styles.playTargetButton,
          pressed && { opacity: 0.7 }
        ]}
      >
        <Text style={[styles.playTargetText, { color: colors.accent }]}>Play target phrase</Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable
          disabled={!lastUri || loading}
          onPress={playLast}
          style={({ pressed }) => [
            styles.btnSecondary,
            { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
            (!lastUri || loading) && { backgroundColor: colors.disabledBackground, borderColor: colors.border },
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            styles.btnSecondaryText,
            { color: colors.textPrimary },
            (!lastUri || loading) && { color: colors.disabled }
          ]}>
            Play
          </Text>
        </Pressable>
        <Pressable
          disabled={!lastUri || loading}
          onPress={handleScore}
          style={({ pressed }) => [
            styles.btnPrimary,
            { backgroundColor: colors.primary, shadowColor: colors.shadow },
            (!lastUri || loading) && { backgroundColor: colors.disabledBackground, borderColor: colors.border },
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            styles.btnPrimaryText,
            { color: colors.textWhite },
            (!lastUri || loading) && { color: colors.disabled }
          ]}>
            {loading ? "Submitting..." : "Upload"}
          </Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing your pronunciation...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={[
          styles.card,
          { shadowColor: colors.shadow },
          result.pass ? { backgroundColor: colors.successLight, borderColor: colors.success } : { backgroundColor: colors.warningLight, borderColor: colors.warning }
        ]}>
          <Text style={[
            styles.resultTitle,
            result.pass ? { color: colors.success } : { color: colors.warning }
          ]}>
            {result.pass ? "Bestått! (Passed!)" : "Fortsett å øve (Keep Practicing)"}
          </Text>
          <Text style={[styles.feedback, { color: colors.textPrimary }]}>{result.feedback}</Text>
          {result.pronunciation_score && (
            <Text style={[styles.score, { color: colors.textSecondary }]}>
              Uttalescore: {result.pronunciation_score}/100
            </Text>
          )}
          <Text style={[styles.xp, { color: colors.success }]}>+{result.xp_gained} XP</Text>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
  },
  headerHelper: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  descriptionNorwegian: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "500",
    lineHeight: 24,
  },
  descriptionHelper: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  targetSection: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    borderLeftWidth: 5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  targetPhrase: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
  },
  targetTranslation: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 10,
  },
  playTargetButton: {
    paddingVertical: 8,
  },
  playTargetText: {
    fontWeight: "600",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  btnPrimary: {
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPrimaryText: {
    fontWeight: "700",
    fontSize: 15,
  },
  btnSecondary: {
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontWeight: "600",
    fontSize: 15,
  },
  btnDisabled: {
  },
  btnDisabledText: {
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSuccess: {
  },
  cardWarning: {
  },
  resultTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 10,
  },
  resultTitleSuccess: {
  },
  resultTitleWarning: {
  },
  feedback: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
  },
  score: {
    fontSize: 14,
    marginBottom: 4,
  },
  xp: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
});

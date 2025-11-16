import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import { useUserStats } from "../context/UserStatsContext";
import RecordButton from "../components/RecordButton";
import { api } from "../services/api";
import { speak } from "../services/ttsService";
import { uploadAudioFile } from "../services/audioService";
import { colors, shadows } from "../styles/colors";

export default function MonthlyScreen({ route }) {
  const { challenges } = useChallenges();
  // Use passed challenge or default to first challenge
  const monthly = route?.params?.challenge || challenges.monthly[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const { token, user } = useAuth();
  const { refreshStats } = useUserStats();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    try {
      console.log('=== MONTHLY BUTTON PRESSED ===');
      console.log('lastUri:', lastUri);
      console.log('monthly:', monthly);
      console.log('user:', user);
      console.log('token:', token);

      // Check if recording exists
      if (!lastUri) {
        console.log('ERROR: No recording found');
        Alert.alert("Error", "No recording found");
        return;
      }

      // Check if we have a challenge
      if (!monthly?.id) {
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
      const audioUrl = await uploadAudioFile(lastUri, user.uid, monthly.id);
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
      const response = await api.scoreMonthly(monthly.id, audioUrl, token);
      console.log('Scoring result:', response);

      setResult(response);

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
        name: error.name
      });
      Alert.alert(
        "Submission Failed",
        error.message || "Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Norwegian title (prominent) */}
      <Text style={styles.header}>{monthly?.title_no || monthly?.title}</Text>
      {monthly?.title_no && (
        <Text style={styles.headerHelper}>({monthly?.title})</Text>
      )}

      {/* Norwegian description (main) */}
      <Text style={styles.descriptionNorwegian}>{monthly?.description_no || monthly?.description}</Text>
      {monthly?.description_no && (
        <Text style={styles.descriptionHelper}>({monthly?.description})</Text>
      )}

      {/* Target phrase section - Norwegian prominent */}
      {monthly?.target && (
        <View style={styles.targetSection}>
          <Text style={styles.targetLabel}>SI PÅ NORSK:</Text>
          <Text style={styles.targetPhrase}>"{monthly.target}"</Text>
          <Text style={styles.targetTranslation}>({monthly?.prompt})</Text>
        </View>
      )}

      {monthly?.target && (
        <>
          <View style={{ height: 16 }} />
          <Pressable
            onPress={() => speak(monthly?.target)}
            style={({ pressed }) => [
              styles.playTargetButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={styles.playTargetText}>Spill av målfrasen (Play target phrase)</Text>
          </Pressable>
        </>
      )}

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} label="Trykk for å ta opp (Tap to record)" />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable
          disabled={!lastUri || loading}
          onPress={playLast}
          style={({ pressed }) => [
            styles.btnSecondary,
            (!lastUri || loading) && styles.btnDisabled,
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            styles.btnSecondaryText,
            (!lastUri || loading) && styles.btnDisabledText
          ]}>
            Spill av (Play)
          </Text>
        </Pressable>
        <Pressable
          disabled={!lastUri || loading}
          onPress={handleScore}
          style={({ pressed }) => [
            styles.btnPrimary,
            (!lastUri || loading) && styles.btnDisabled,
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            styles.btnPrimaryText,
            (!lastUri || loading) && styles.btnDisabledText
          ]}>
            {loading ? "Sender inn..." : "Last opp (Upload)"}
          </Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyserer uttalen din...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={[
          styles.card,
          result.pass ? styles.cardSuccess : styles.cardWarning
        ]}>
          <Text style={[
            styles.resultTitle,
            result.pass ? styles.resultTitleSuccess : styles.resultTitleWarning
          ]}>
            {result.pass ? "Bestått! (Passed!)" : "Fortsett å øve (Keep Practicing)"}
          </Text>
          <Text style={styles.feedback}>{result.feedback}</Text>
          {result.pronunciation_score && (
            <Text style={styles.score}>
              Uttalescore: {result.pronunciation_score}/100
            </Text>
          )}
          <Text style={styles.xp}>+{result.xp_gained} XP</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
  },
  headerHelper: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  descriptionNorwegian: {
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
    fontWeight: "500",
    lineHeight: 24,
  },
  descriptionHelper: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: "italic",
    marginTop: 4,
  },
  targetSection: {
    marginTop: 20,
    backgroundColor: colors.backgroundAccent,
    padding: 18,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: colors.accent,
    ...shadows.small,
  },
  targetLabel: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  targetPhrase: {
    fontSize: 24,
    color: colors.accent,
    fontWeight: "700",
    lineHeight: 32,
  },
  targetTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 10,
  },
  playTargetButton: {
    paddingVertical: 8,
  },
  playTargetText: {
    color: colors.accent,
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
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    ...shadows.small,
  },
  btnPrimaryText: {
    fontWeight: "700",
    color: colors.textWhite,
    fontSize: 15,
  },
  btnSecondary: {
    padding: 14,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    fontWeight: "600",
    color: colors.textPrimary,
    fontSize: 15,
  },
  btnDisabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.border,
  },
  btnDisabledText: {
    color: colors.disabled,
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
    color: colors.textSecondary,
    marginTop: 8,
  },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    ...shadows.medium,
  },
  cardSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  cardWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  resultTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 10,
  },
  resultTitleSuccess: {
    color: colors.success,
  },
  resultTitleWarning: {
    color: colors.warning,
  },
  feedback: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  score: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  xp: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.success,
    marginTop: 10,
  },
});

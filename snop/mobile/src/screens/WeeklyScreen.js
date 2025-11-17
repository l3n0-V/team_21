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
import { shadows } from "../styles/colors";
import { useTheme } from "../context/ThemeContext";

export default function WeeklyScreen({ route }) {
  const { colors } = useTheme();
  const { challenges } = useChallenges();
  const navigation = useNavigation();
  // Use passed challenge or default to first challenge
  const weekly = route?.params?.challenge || challenges.weekly[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const { token, user } = useAuth();
  const { refreshStats } = useUserStats();
  const { updatePerformance } = usePerformance();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    try {
      console.log('=== WEEKLY BUTTON PRESSED ===');
      console.log('lastUri:', lastUri);
      console.log('weekly:', weekly);
      console.log('user:', user);
      console.log('token:', token);

      // Check if recording exists
      if (!lastUri) {
        console.log('ERROR: No recording found');
        Alert.alert("Error", "No recording found");
        return;
      }

      // Check if we have a challenge
      if (!weekly?.id) {
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
      const audioUrl = await uploadAudioFile(lastUri, user.uid, weekly.id);
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
      const response = await api.scoreWeekly(weekly.id, audioUrl, token);
      console.log('Scoring result:', response);

      setResult(response);

      // Update performance tracking
      try {
        await updatePerformance({
          challenge: weekly,
          score: response.pronunciation_score || response.similarity || (response.pass ? 100 : 50),
          passed: response.pass,
          xpEarned: response.xp_gained,
        });
      } catch (perfError) {
        console.warn("Failed to update performance:", perfError);
      }

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12, borderRadius: 8, backgroundColor: `${colors.primary}1A` },
            pressed && styles.backButtonPressed
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>← Back</Text>
        </Pressable>

        {/* Norwegian title (prominent) */}
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.primary }}>{weekly?.title_no || weekly?.title}</Text>
        {weekly?.title_no && (
          <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: "italic", marginTop: 2 }}>({weekly?.title})</Text>
      )}

      {/* Norwegian description (main) */}
      <Text style={{ fontSize: 16, color: colors.textPrimary, marginTop: 12, fontWeight: "500", lineHeight: 24 }}>{weekly?.description_no || weekly?.description}</Text>
      {weekly?.description_no && (
        <Text style={{ fontSize: 13, color: colors.textLight, fontStyle: "italic", marginTop: 4 }}>({weekly?.description})</Text>
      )}

      {/* Target phrase section - Norwegian prominent */}
      {weekly?.target && (
        <View style={{ marginTop: 20, backgroundColor: colors.backgroundAccent, padding: 18, borderRadius: 14, borderLeftWidth: 5, borderLeftColor: colors.accent, ...shadows.small }}>
          <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "800", marginBottom: 10, letterSpacing: 0.5 }}>SI PÅ NORSK:</Text>
          <Text style={{ fontSize: 24, color: colors.accent, fontWeight: "700", lineHeight: 32 }}>"{weekly?.target}"</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, fontStyle: "italic", marginTop: 10 }}>({weekly?.prompt})</Text>
        </View>
      )}

      {weekly?.target && (
        <>
          <View style={{ height: 16 }} />
          <Pressable
            onPress={() => speak(weekly?.target)}
            style={({ pressed }) => [
              styles.playTargetButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 15 }}>Play target phrase</Text>
          </Pressable>
        </>
      )}

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} label="Tap to record" />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable
          disabled={!lastUri || loading}
          onPress={playLast}
          style={({ pressed }) => [
            { padding: 14, backgroundColor: colors.backgroundTertiary, borderRadius: 12, flex: 1, alignItems: "center", borderWidth: 1, borderColor: colors.border },
            (!lastUri || loading) && { backgroundColor: colors.disabledBackground, borderColor: colors.border },
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            { fontWeight: "600", color: colors.textPrimary, fontSize: 15 },
            (!lastUri || loading) && { color: colors.disabled }
          ]}>
            Play
          </Text>
        </Pressable>
        <Pressable
          disabled={!lastUri || loading}
          onPress={handleScore}
          style={({ pressed }) => [
            { padding: 14, backgroundColor: colors.primary, borderRadius: 12, flex: 1, alignItems: "center", ...shadows.small },
            (!lastUri || loading) && { backgroundColor: colors.disabledBackground, borderColor: colors.border },
            pressed && !loading && lastUri && styles.btnPressed
          ]}
        >
          <Text style={[
            { fontWeight: "700", color: colors.textWhite, fontSize: 15 },
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
  backButtonPressed: {
    opacity: 0.7,
  },
  playTargetButton: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
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
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    ...shadows.medium,
  },
  resultTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 10,
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

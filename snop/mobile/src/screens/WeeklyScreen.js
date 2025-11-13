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

export default function WeeklyScreen() {
  const { challenges } = useChallenges();
  const weekly = challenges.weekly[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const { token, user } = useAuth();
  const { refreshStats } = useUserStats();
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
        console.warn('⚠️  WEB TESTING MODE ACTIVE');
        console.warn('⚠️  Backend will receive local file URL and cannot process actual audio');
        console.warn('⚠️  You will see mock/error responses from backend');
        console.warn('');
      }

      // Step 2: Submit to backend for pronunciation scoring
      console.log('Submitting for pronunciation scoring...');
      const response = await api.scoreWeekly(weekly.id, audioUrl, token);
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
      <Text style={styles.header}>Weekly: {weekly?.title}</Text>
      <Text style={styles.sub}>Real-life task: {weekly?.description}</Text>

      {weekly?.target && (
        <>
          <View style={{ height: 16 }} />
          <Text style={styles.target}>Target phrase: "{weekly.target}"</Text>
          <Pressable
            onPress={() => speak(weekly?.target)}
            style={({ pressed }) => [
              pressed && { opacity: 0.6 }
            ]}
          >
            <Text style={styles.link}>🔊 Play target phrase</Text>
          </Pressable>
        </>
      )}

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} label="Tap to record a sample" />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable
          disabled={!lastUri || loading}
          onPress={playLast}
          style={({ pressed }) => [
            styles.btn,
            (!lastUri || loading) && styles.btnDisabled,
            pressed && !loading && lastUri && { opacity: 0.6, transform: [{ scale: 0.98 }] }
          ]}
        >
          <Text style={styles.btnText}>
            ▶︎ Play
          </Text>
        </Pressable>
        <Pressable
          disabled={!lastUri || loading}
          onPress={handleScore}
          style={({ pressed }) => [
            styles.btn,
            (!lastUri || loading) && styles.btnDisabled,
            pressed && !loading && lastUri && { opacity: 0.6, transform: [{ scale: 0.98 }] }
          ]}
        >
          <Text style={styles.btnText}>
            {loading ? "Submitting..." : "⬆ Upload for feedback"}
          </Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Analyzing your pronunciation...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.card}>
          <Text style={styles.resultTitle}>
            {result.pass ? "✅ Passed!" : "📝 Keep Practicing"}
          </Text>
          <Text style={styles.feedback}>{result.feedback}</Text>
          {result.pronunciation_score && (
            <Text style={styles.score}>
              Pronunciation Score: {result.pronunciation_score}/100
            </Text>
          )}
          <Text style={styles.xp}>+{result.xp_gained} XP</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 16, color: "#374151", marginTop: 6 },
  target: { fontSize: 15, color: "#111827", marginTop: 8, fontWeight: "600" },
  link: { color: "#2563eb", fontWeight: "600", marginTop: 4 },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  btn: {
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    flex: 1,
    alignItems: "center"
  },
  btnText: {
    fontWeight: "600",
    color: "#111827"
  },
  btnDisabled: {
    backgroundColor: "#f3f4f6"
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  resultTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8,
    color: "#111827"
  },
  feedback: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 22
  },
  score: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4
  },
  xp: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 8
  }
});

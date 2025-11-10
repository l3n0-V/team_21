import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import RecordButton from "../components/RecordButton";
import { api } from "../services/api";
import { speak } from "../services/ttsService";
import { uploadAudioFile } from "../services/audioService";

export default function DailyScreen() {
  const { challenges } = useChallenges();
  const daily = challenges.daily[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const { token, user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    // Check if recording exists
    if (!lastUri) {
      Alert.alert("Error", "No recording found");
      return;
    }

    // Check if we have a challenge
    if (!daily?.id) {
      Alert.alert("Error", "Challenge not loaded");
      return;
    }

    // Check if user is authenticated
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload audio file to Firebase Storage
      console.log('Uploading audio file...');
      const audioUrl = await uploadAudioFile(lastUri, user.uid, daily.id);
      console.log('Audio uploaded successfully:', audioUrl);

      // Step 2: Submit to backend for pronunciation scoring
      console.log('Submitting for pronunciation scoring...');
      const response = await api.scoreDaily(daily.id, audioUrl, token);
      console.log('Scoring result:', response);

      setResult(response);

      // Show success message if the user passed
      if (response.pass) {
        Alert.alert(
          "Success!",
          `You earned ${response.xp_gained} XP!`
        );
      } else {
        Alert.alert("Keep Practicing", "Try again to improve your pronunciation!");
      }
    } catch (error) {
      console.error('Submission error:', error);
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
      <Text style={styles.header}>Daily: {daily?.title}</Text>
      <Text style={styles.sub}>Say: "{daily?.target}"</Text>

      <View style={{ height: 16 }} />
      <Pressable onPress={() => speak(daily?.target)}>
        <Text style={styles.link}>🔊 Play target phrase</Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable disabled={!lastUri || loading} onPress={playLast}>
          <Text style={[styles.btn, (!lastUri || loading) && styles.btnDisabled]}>
            ▶︎ Play
          </Text>
        </Pressable>
        <Pressable disabled={!lastUri || loading} onPress={handleScore}>
          <Text style={[styles.btn, (!lastUri || loading) && styles.btnDisabled]}>
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
  sub: { fontSize: 16, color: "#374151", marginTop: 4 },
  link: { color: "#2563eb", fontWeight: "600" },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  btn: { padding: 12, backgroundColor: "#e5e7eb", borderRadius: 10, fontWeight: "600" },
  btnDisabled: { backgroundColor: "#f3f4f6", color: "#9ca3af" },
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

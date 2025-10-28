import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useAudio } from "../context/AudioContext";
import RecordButton from "../components/RecordButton";
import api from "../services/api";
import { speak } from "../services/ttsService";

export default function DailyScreen() {
  const { challenges } = useChallenges();
  const daily = challenges.daily[0];
  const { begin, end, lastUri, playLast } = useAudio();
  const [result, setResult] = useState(null);
  const prompt = daily?.prompt || "How to order coffee";

  const handleScore = async () => {
    try {
      const form = new FormData();
      form.append("audio", { uri: lastUri, name: "recording.m4a", type: "audio/m4a" });
      form.append("prompt", prompt);
      const resp = await api.audio.upload(form);
      setResult(resp.data);
    } catch (e) {
      Alert.alert("Upload failed", String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily: {daily?.title}</Text>
      <Text style={styles.sub}>Say: “{daily?.target}”</Text>

      <View style={{ height: 16 }} />
      <Pressable onPress={() => speak(daily?.target)}>
        <Text style={styles.link}>🔊 Play target phrase</Text>
      </Pressable>

      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} />

      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <Pressable disabled={!lastUri} onPress={playLast}><Text style={styles.btn}>▶︎ Play</Text></Pressable>
        <Pressable disabled={!lastUri} onPress={handleScore}><Text style={styles.btn}>⬆ Upload for feedback</Text></Pressable>
      </View>

      {result && (
        <View style={styles.card}>
          <Text style={styles.resultTitle}>Feedback</Text>
          <Text>STT: {result.text}</Text>
          <Text>Pronunciation: {result.pronunciationScore}/100</Text>
          <Text>Tips: {result.grammarTips.join(", ")}</Text>
          <Text>+{result.snops} snops</Text>
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
  btn: { padding: 12, backgroundColor: "#e5e7eb", borderRadius: 10 },
  card: { marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: "#f3f4f6" },
  resultTitle: { fontWeight: "700", marginBottom: 6 }
});

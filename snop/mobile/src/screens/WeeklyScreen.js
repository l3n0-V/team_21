import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import RecordButton from "../components/RecordButton";
import { useAudio } from "../context/AudioContext";

export default function WeeklyScreen() {
  const { challenges } = useChallenges();
  const c = challenges.weekly[0];
  const { begin, end } = useAudio();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly: {c?.title}</Text>
      <Text style={styles.sub}>Real-life task: {c?.description}</Text>
      <View style={{ flex: 1 }} />
      <RecordButton onStart={begin} onStop={end} label="Tap to record a sample" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 16, color: "#374151", marginTop: 6 }
});

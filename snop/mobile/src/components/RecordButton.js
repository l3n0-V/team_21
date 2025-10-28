import React, { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";

export default function RecordButton({ onStart, onStop, label = "Tap to record" }) {
  const [isRecording, setIsRecording] = useState(false);

  const toggle = async () => {
    if (!isRecording) {
      await onStart?.();
      setIsRecording(true);
    } else {
      await onStop?.();
      setIsRecording(false);
    }
  };

  return (
    <Pressable onPress={toggle} style={[styles.btn, isRecording && styles.recording]}>
      <Text style={styles.txt}>{isRecording ? "Stop" : label}</Text>
      <Text style={styles.mic}>{isRecording ? "⏺" : "🎙️"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: "#111827", paddingVertical: 18, borderRadius: 999, alignItems: "center" },
  recording: { backgroundColor: "#dc2626" },
  txt: { color: "white", fontWeight: "800", fontSize: 16 },
  mic: { color: "white", fontSize: 22, marginTop: 4 }
});

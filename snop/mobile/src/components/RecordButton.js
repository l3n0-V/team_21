import React, { useState } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, shadows } from "../styles/colors";

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
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.btn,
        isRecording && styles.recording,
        pressed && styles.pressed
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.txt}>{isRecording ? "Stop Recording" : label}</Text>
        <View style={[styles.iconContainer, isRecording && styles.iconRecording]}>
          <Text style={styles.mic}>{isRecording ? "STOP" : "REC"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    ...shadows.large,
  },
  recording: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  content: {
    alignItems: "center",
  },
  txt: {
    color: colors.textWhite,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  iconRecording: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  mic: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

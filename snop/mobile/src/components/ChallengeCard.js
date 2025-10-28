import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChallengeCard({ challenge }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{challenge.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.badge}>{challenge.frequency}</Text>
        <Text style={styles.badge}>★ {challenge.difficulty}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#ffffff", padding: 14, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 16, fontWeight: "700" },
  desc: { marginTop: 4, color: "#374151" },
  meta: { marginTop: 8, flexDirection: "row", gap: 8 },
  badge: { backgroundColor: "#f3f4f6", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden" }
});

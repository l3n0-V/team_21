import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChallengeCard({ challenge }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{challenge.title}</Text>

      {/* English description (smaller) */}
      <Text style={styles.descSmall} numberOfLines={2}>{challenge.description}</Text>

      {/* Norwegian task description (main) */}
      {challenge.target_no && (
        <Text style={styles.norwegianText} numberOfLines={2}>
          {challenge.target_no}
        </Text>
      )}

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
  descSmall: { marginTop: 4, fontSize: 13, color: "#6b7280", fontStyle: "italic" },
  norwegianText: { fontSize: 15, color: "#111827", marginTop: 6, fontWeight: "600", lineHeight: 22 },
  meta: { marginTop: 8, flexDirection: "row", gap: 8 },
  badge: { backgroundColor: "#f3f4f6", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden" }
});

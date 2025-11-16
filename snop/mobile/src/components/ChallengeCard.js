import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function ChallengeCard({ challenge }) {
  const nav = useNavigation();

  const handlePress = () => {
    // Navigate based on challenge frequency
    const screenMap = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    const screen = screenMap[challenge.frequency];
    if (screen) {
      nav.navigate(screen, { challenge });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
    >
      {/* Norwegian title (prominent) */}
      <Text style={styles.titleNorwegian}>{challenge.title_no || challenge.title}</Text>

      {/* English title (helper) */}
      {challenge.title_no && (
        <Text style={styles.titleHelper}>({challenge.title})</Text>
      )}

      {/* Norwegian description (main) */}
      <Text style={styles.descNorwegian} numberOfLines={2}>
        {challenge.description_no || challenge.description}
      </Text>

      {/* English description (helper) */}
      {challenge.description_no && (
        <Text style={styles.descHelper} numberOfLines={2}>({challenge.description})</Text>
      )}

      {/* Target phrase preview */}
      {challenge.target && (
        <View style={styles.targetPreview}>
          <Text style={styles.targetLabel}>Si pa norsk:</Text>
          <Text style={styles.targetText} numberOfLines={1}>"{challenge.target}"</Text>
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.badge}>{challenge.frequency}</Text>
        <Text style={styles.badge}>{challenge.difficulty}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#ffffff", padding: 14, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  titleNorwegian: { fontSize: 18, fontWeight: "700", color: "#111827" },
  titleHelper: { fontSize: 13, color: "#6b7280", fontStyle: "italic", marginTop: 2 },
  descNorwegian: { marginTop: 8, fontSize: 15, color: "#374151", fontWeight: "500", lineHeight: 22 },
  descHelper: { marginTop: 4, fontSize: 12, color: "#9ca3af", fontStyle: "italic" },
  targetPreview: { marginTop: 10, backgroundColor: "#f0f9ff", padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#2563eb" },
  targetLabel: { fontSize: 12, color: "#2563eb", fontWeight: "600", marginBottom: 4 },
  targetText: { fontSize: 14, color: "#1e40af", fontWeight: "600" },
  meta: { marginTop: 10, flexDirection: "row", gap: 8 },
  badge: { backgroundColor: "#f3f4f6", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden", fontSize: 12, color: "#4b5563" }
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

export default function ChallengeCard({ challenge }) {
  const nav = useNavigation();
  const { colors } = useTheme();

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
        { backgroundColor: colors.background, padding: 14, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: colors.border },
        pressed && styles.cardPressed
      ]}
    >
      {/* Norwegian title (prominent) */}
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>{challenge.title_no || challenge.title}</Text>

      {/* English title (helper) */}
      {challenge.title_no && (
        <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: "italic", marginTop: 2 }}>({challenge.title})</Text>
      )}

      {/* Norwegian description (main) */}
      <Text style={{ marginTop: 8, fontSize: 15, color: colors.textPrimary, fontWeight: "500", lineHeight: 22 }} numberOfLines={2}>
        {challenge.description_no || challenge.description}
      </Text>

      {/* English description (helper) */}
      {challenge.description_no && (
        <Text style={{ marginTop: 4, fontSize: 12, color: colors.textLight, fontStyle: "italic" }} numberOfLines={2}>({challenge.description})</Text>
      )}

      {/* Target phrase preview */}
      {challenge.target && (
        <View style={{ marginTop: 10, backgroundColor: colors.backgroundAccent, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.accent }}>
          <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "600", marginBottom: 4 }}>Si på norsk:</Text>
          <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "600" }} numberOfLines={1}>"{challenge.target}"</Text>
        </View>
      )}

      <View style={styles.meta}>
        <Text style={{ backgroundColor: colors.backgroundTertiary, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden", fontSize: 12, color: colors.textSecondary }}>{challenge.frequency}</Text>
        <Text style={{ backgroundColor: colors.backgroundTertiary, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, overflow: "hidden", fontSize: 12, color: colors.textSecondary }}>{challenge.difficulty}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  meta: { marginTop: 10, flexDirection: "row", gap: 8 },
});

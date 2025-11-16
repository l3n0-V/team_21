import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, shadows, getDifficultyColor, getFrequencyColor } from "../styles/colors";

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

  const difficultyColor = getDifficultyColor(challenge.difficulty);
  const frequencyColor = getFrequencyColor(challenge.frequency);

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
          <Text style={styles.targetLabel}>Si på norsk:</Text>
          <Text style={styles.targetText} numberOfLines={1}>"{challenge.target}"</Text>
        </View>
      )}

      <View style={styles.meta}>
        <View style={[styles.badge, { backgroundColor: `${frequencyColor}20` }]}>
          <Text style={[styles.badgeText, { color: frequencyColor }]}>
            {challenge.frequency}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${difficultyColor}20` }]}>
          <Text style={[styles.badgeText, { color: difficultyColor }]}>
            {challenge.difficulty}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  titleNorwegian: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  titleHelper: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  descNorwegian: {
    marginTop: 10,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
    lineHeight: 22,
  },
  descHelper: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textLight,
    fontStyle: "italic",
  },
  targetPreview: {
    marginTop: 12,
    backgroundColor: colors.backgroundAccent,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  targetLabel: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
  meta: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

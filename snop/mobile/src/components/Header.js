import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useUserStats } from "../context/UserStatsContext";
import { colors, shadows } from "../styles/colors";

export default function Header() {
  const { stats, loading, error } = useUserStats();

  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        <Text style={styles.name}>Welcome to SNOP</Text>
        <Text style={styles.sub}>Earn snops by completing challenges</Text>
        {stats.streak_days > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{stats.streak_days}-day streak!</Text>
          </View>
        )}
      </View>

      <View style={styles.pill}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textWhite} />
        ) : error ? (
          <Text style={styles.snopsText}>SNOPS: --</Text>
        ) : (
          <Text style={styles.snopsText}>SNOPS: {stats.xp_total}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadows.large,
  },
  contentContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "800",
    fontSize: 20,
    color: colors.textWhite,
  },
  sub: {
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontSize: 14,
  },
  streakBadge: {
    backgroundColor: colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  streakText: {
    color: colors.textWhite,
    fontWeight: "700",
    fontSize: 13,
  },
  pill: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.medium,
  },
  snopsText: {
    color: colors.textWhite,
    fontWeight: "800",
    fontSize: 14,
  },
});

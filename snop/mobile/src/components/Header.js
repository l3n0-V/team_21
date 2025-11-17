import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useUserStats } from "../context/UserStatsContext";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { stats, loading, error } = useUserStats();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      {/* Decorative diagonal stripe */}
      <View style={[styles.diagonalStripe, { backgroundColor: colors.accent }]} />

      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={[styles.logo, { color: colors.textWhite }]}>SNOP</Text>
          <Text style={[styles.greeting, { color: colors.textWhite }]}>Welcome back!</Text>
          <Text style={styles.subtitle}>Complete challenges to earn XP</Text>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.xpBadge, { backgroundColor: colors.accent }]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : error ? (
              <Text style={[styles.xpText, { color: colors.textWhite }]}>--</Text>
            ) : (
              <>
                <Text style={[styles.xpValue, { color: colors.textWhite }]}>{stats.xp_total}</Text>
                <Text style={styles.xpLabel}>XP</Text>
              </>
            )}
          </View>

          {stats.streak_days > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakText, { color: colors.textWhite }]}>{stats.streak_days}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom wave decoration */}
      <View style={styles.waveContainer}>
        <View style={[styles.wave, { backgroundColor: colors.background }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  diagonalStripe: {
    position: "absolute",
    top: -50,
    right: -100,
    width: 300,
    height: 200,
    opacity: 0.15,
    transform: [{ rotate: "-15deg" }],
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
  },
  logo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 8,
  },
  xpBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  xpValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  xpText: {
    fontSize: 18,
    fontWeight: "800",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  streakText: {
    fontWeight: "700",
    fontSize: 14,
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    bottom: -10,
    left: -20,
    right: -20,
    height: 30,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
});

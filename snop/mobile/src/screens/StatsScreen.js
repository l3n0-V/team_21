import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadows } from "../styles/colors";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();

  // Temporarily disabled chart due to react-native-chart-kit compatibility issues on iOS
  // To do: Re-enable when chart library is updated or use alternative
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, "#003580"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Statistikk</Text>
        <Text style={styles.subtitle}>Din fremgang og resultater</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Total XP Opptjent</Text>
          <Text style={styles.statValue}>245</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Nåværende Streak</Text>
          <Text style={styles.statValue}>7 dager</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Utfordringer Fullført</Text>
          <Text style={styles.statValue}>12</Text>
        </View>
        <Text style={styles.comingSoon}>Grafer kommer snart...</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
  },
  comingSoon: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../styles/colors";

export default function StatsScreen() {
  // Temporarily disabled chart due to react-native-chart-kit compatibility issues on iOS
  // To do: Re-enable when chart library is updated or use alternative
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Weekly Stats</Text>
      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>Total XP Earned</Text>
        <Text style={styles.statValue}>245</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>Current Streak</Text>
        <Text style={styles.statValue}>7 days</Text>
      </View>
      <View style={styles.statsCard}>
        <Text style={styles.statLabel}>Challenges Completed</Text>
        <Text style={styles.statValue}>12</Text>
      </View>
      <Text style={styles.comingSoon}>Charts coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
    color: colors.primary
  },
  statsCard: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
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

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useUserStats } from "../context/UserStatsContext";

export default function Header() {
  const { stats, loading, error } = useUserStats();

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>Welcome to SNOP</Text>
        <Text style={styles.sub}>Earn snops by completing challenges</Text>
        {stats.streak_days > 0 && (
          <Text style={styles.streak}>🔥 {stats.streak_days}-day streak!</Text>
        )}
      </View>

      <View style={styles.pill}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  name: { fontWeight: "800", fontSize: 18 },
  sub: { color: "#4b5563", marginTop: 2 },
  streak: {
    color: "#ea580c",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 4
  },
  pill: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center"
  },
  snopsText: {
    color: "white",
    fontWeight: "800"
  }
});

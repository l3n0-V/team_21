import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Header() {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>Welcome to SNOP</Text>
        <Text style={styles.sub}>Earn snops by completing challenges</Text>
      </View>
      <View style={styles.pill}><Text style={{ color: "white", fontWeight: "800" }}>SNOPS: 0</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: "#f3f4f6", flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontWeight: "800", fontSize: 18 },
  sub: { color: "#4b5563" },
  pill: { backgroundColor: "#111827", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 }
});

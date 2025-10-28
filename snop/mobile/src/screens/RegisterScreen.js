import React from "react";
import { View, Text, StyleSheet } from "react-native";
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register (placeholder)</Text>
      <Text>Hook this to backend when ready.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 8 }
});

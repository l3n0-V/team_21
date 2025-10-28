import React from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function StatsScreen() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data: [5, 9, 6, 12, 7, 10, 14] }]
  };
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your weekly snops</Text>
      <LineChart
        width={Dimensions.get("window").width - 24}
        height={220}
        data={data}
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          color: (o) => `rgba(37, 99, 235, ${o})`,
          labelColor: () => "#111827"
        }}
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { fontSize: 20, fontWeight: "800", marginBottom: 8 }
});

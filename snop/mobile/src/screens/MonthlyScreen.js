import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import ChallengeCard from "../components/ChallengeCard";

export default function MonthlyScreen() {
  const { challenges } = useChallenges();
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly challenges</Text>
      <FlatList
        data={challenges.monthly}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChallengeCard challenge={item} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 8 }
});

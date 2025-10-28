import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Header from "../components/Header";
import ChallengeCard from "../components/ChallengeCard";
import { useChallenges } from "../context/ChallengeContext";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const { challenges } = useChallenges();
  const nav = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Header />

      <Section
        title="Daily"
        onPressSeeAll={() => nav.navigate("Daily")}
        items={challenges.daily.slice(0, 2)}
      />

      <Section
        title="Weekly"
        onPressSeeAll={() => nav.navigate("Weekly")}
        items={challenges.weekly.slice(0, 2)}
      />

      <Section
        title="Monthly"
        onPressSeeAll={() => nav.navigate("Monthly")}
        items={challenges.monthly.slice(0, 2)}
      />
    </ScrollView>
  );
}

function Section({ title, items, onPressSeeAll }) {
  return (
    <View style={{ marginVertical: 12 }}>
      <View style={styles.row}>
        <Text style={styles.title}>{title} challenges</Text>
        <Pressable onPress={onPressSeeAll}><Text style={styles.link}>Tap to see all →</Text></Pressable>
      </View>
      {items.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { fontSize: 20, fontWeight: "700" },
  link: { color: "#2563eb", fontWeight: "600" }
});

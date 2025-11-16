import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Header from "../components/Header";
import ChallengeCard from "../components/ChallengeCard";
import { useChallenges } from "../context/ChallengeContext";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../styles/colors";

export default function HomeScreen() {
  const { challenges } = useChallenges();
  const nav = useNavigation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title} challenges</Text>
        <Pressable
          onPress={onPressSeeAll}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && styles.seeAllButtonPressed
          ]}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>
      {items.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  seeAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 43, 45, 0.1)',
  },
  seeAllButtonPressed: {
    opacity: 0.7,
  },
  seeAllText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
});

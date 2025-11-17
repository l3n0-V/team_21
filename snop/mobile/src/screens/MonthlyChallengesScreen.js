import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useNavigation } from "@react-navigation/native";
import ChallengeCarousel from "../components/ChallengeCarousel";
import { colors } from "../styles/colors";

export default function MonthlyChallengesScreen({ route }) {
  const { challenges } = useChallenges();
  const navigation = useNavigation();

  // If a specific challenge was passed, navigate directly to practice
  useEffect(() => {
    if (route?.params?.challenge) {
      navigation.replace("MonthlyPractice", { challenge: route.params.challenge });
    }
  }, [route?.params?.challenge]);

  const handlePractice = (challenge) => {
    navigation.navigate("MonthlyPractice", { challenge });
  };

  // Don't render carousel if we're redirecting to practice
  if (route?.params?.challenge) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        {/* Screen Title */}
        <Text style={styles.screenTitle}>Monthly Challenges</Text>
        <Text style={styles.screenSubtitle}>
          Select a challenge and practice your pronunciation
        </Text>

        {/* Challenge Carousel */}
        <View style={styles.carouselContainer}>
          <ChallengeCarousel
            challenges={challenges.monthly}
            onPractice={handlePractice}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 40, 104, 0.1)",
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
  },
});

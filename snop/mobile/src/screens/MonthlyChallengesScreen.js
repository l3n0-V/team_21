import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { useChallenges } from "../context/ChallengeContext";
import { useNavigation } from "@react-navigation/native";
import ChallengeCarousel from "../components/ChallengeCarousel";
import { useTheme } from "../context/ThemeContext";

export default function MonthlyChallengesScreen({ route }) {
  const { challenges } = useChallenges();
  const navigation = useNavigation();
  const { colors } = useTheme();

  // If a specific challenge was passed, navigate directly to practice
  useEffect(() => {
    if (route?.params?.challenge) {
      navigation.replace("MonthlyPractice", { challenge: route.params.challenge });
    }
  }, [route?.params?.challenge]);

  const handlePractice = (challenge) => {
    // Route based on challenge type
    const type = challenge.type || "pronunciation";

    switch (type) {
      case "listening":
        navigation.navigate("ListeningChallenge", { challenge });
        break;
      case "fill_blank":
        navigation.navigate("FillBlankChallenge", { challenge });
        break;
      case "multiple_choice":
        navigation.navigate("MultipleChoiceChallenge", { challenge });
        break;
      case "pronunciation":
      default:
        navigation.navigate("MonthlyPractice", { challenge });
        break;
    }
  };

  // Don't render carousel if we're redirecting to practice
  if (route?.params?.challenge) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: `${colors.primary}1A` },
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Tilbake</Text>
        </Pressable>

        {/* Screen Title */}
        <Text style={[styles.screenTitle, { color: colors.primary }]}>Månedlige utfordringer</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Velg en utfordring og øv uttalen din
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
  },
  container: {
    flex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginHorizontal: 16,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Force reload - TouchableOpacity migration

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    age_group: null,
    level: null,
    interests: [],
  });

  const totalSteps = 4;

  const handleAgeSelect = (ageGroup) => {
    setProfile({ ...profile, age_group: ageGroup });
    setStep(3);  // Advance to level selection
  };

  const handleLevelSelect = (level) => {
    setProfile({ ...profile, level: level });
    setStep(4);  // Advance to interests selection
  };

  const handleInterestToggle = (interest) => {
    const current = profile.interests;
    if (current.includes(interest)) {
      setProfile({
        ...profile,
        interests: current.filter((i) => i !== interest),
      });
    } else {
      setProfile({ ...profile, interests: [...current, interest] });
    }
  };

  const handleComplete = async () => {
    try {
      // Save profile to AsyncStorage
      const userProfile = {
        ...profile,
        onboarding_completed: true,
        uid: user?.uid || "guest",
      };
      await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));
      console.log("User profile saved:", userProfile);

      // Navigate to main app
      navigation.replace("Tabs");
    } catch (error) {
      console.error("Error saving profile:", error);
      navigation.replace("Tabs");
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            s <= step && styles.progressDotActive,
            s === step && styles.progressDotCurrent,
          ]}
        />
      ))}
    </View>
  );

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🍬</Text>
      <Text style={styles.title}>Velkommen til Snop!</Text>
      <Text style={styles.subtitle}>En søt måte å lære norsk på</Text>
      <Text style={styles.description}>
        La oss tilpasse opplevelsen din med noen raske spørsmål.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.8}
        onPress={() => {
          console.log("Button pressed, moving to step 2");
          setStep(2);
        }}
      >
        <Text style={styles.primaryButtonText}>La oss begynne!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAgeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Hvor gammel er du?</Text>
      <Text style={styles.stepDescription}>
        Dette hjelper oss å gi deg passende innhold
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.age_group === "child" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleAgeSelect("child")}
        >
          <Text style={styles.optionEmoji}>👶</Text>
          <Text style={styles.optionTitle}>Under 13</Text>
          <Text style={styles.optionSubtitle}>Barn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.age_group === "teen" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleAgeSelect("teen")}
        >
          <Text style={styles.optionEmoji}>🧑‍🎓</Text>
          <Text style={styles.optionTitle}>13-17</Text>
          <Text style={styles.optionSubtitle}>Ungdom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.age_group === "adult" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleAgeSelect("adult")}
        >
          <Text style={styles.optionEmoji}>👩‍💼</Text>
          <Text style={styles.optionTitle}>18+</Text>
          <Text style={styles.optionSubtitle}>Voksen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLevelSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Hva er ditt norsknivå?</Text>
      <Text style={styles.stepDescription}>
        Vi tilpasser utfordringene til ditt nivå
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.level === "beginner" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleLevelSelect("beginner")}
        >
          <Text style={styles.optionEmoji}>🌱</Text>
          <Text style={styles.optionTitle}>Nybegynner</Text>
          <Text style={styles.optionSubtitle}>Jeg har nettopp begynt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.level === "intermediate" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleLevelSelect("intermediate")}
        >
          <Text style={styles.optionEmoji}>🌿</Text>
          <Text style={styles.optionTitle}>Mellomliggende</Text>
          <Text style={styles.optionSubtitle}>Jeg kan grunnleggende</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionCard,
            profile.level === "advanced" && styles.optionCardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => handleLevelSelect("advanced")}
        >
          <Text style={styles.optionEmoji}>🌳</Text>
          <Text style={styles.optionTitle}>Avansert</Text>
          <Text style={styles.optionSubtitle}>Jeg snakker flytende</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInterestsSelection = () => {
    const interests = [
      { id: "cafe", emoji: "☕", label: "Kafé & Mat" },
      { id: "travel", emoji: "✈️", label: "Reise" },
      { id: "social", emoji: "👋", label: "Sosiale situasjoner" },
      { id: "shopping", emoji: "🛍️", label: "Shopping" },
      { id: "work", emoji: "💼", label: "Jobb & Karriere" },
      { id: "weather", emoji: "🌤️", label: "Dagligliv" },
      { id: "navigation", emoji: "🗺️", label: "Navigasjon" },
      { id: "greetings", emoji: "🤝", label: "Hilsener" },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Hva interesserer deg?</Text>
        <Text style={styles.stepDescription}>
          Velg emner du vil øve på (velg minst 2)
        </Text>

        <View style={styles.interestsGrid}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestChip,
                profile.interests.includes(interest.id) &&
                  styles.interestChipSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => handleInterestToggle(interest.id)}
            >
              <Text style={styles.interestEmoji}>{interest.emoji}</Text>
              <Text
                style={[
                  styles.interestLabel,
                  profile.interests.includes(interest.id) &&
                    styles.interestLabelSelected,
                ]}
              >
                {interest.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            profile.interests.length < 2 && styles.buttonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleComplete}
          disabled={profile.interests.length < 2}
        >
          <Text style={styles.primaryButtonText}>
            {profile.interests.length < 2
              ? `Velg ${2 - profile.interests.length} til`
              : "Fullfør oppsettet"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, "#003580"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>SNOP</Text>
        {step > 1 && renderProgressBar()}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderWelcome()}
        {step === 2 && renderAgeSelection()}
        {step === 3 && renderLevelSelection()}
        {step === 4 && renderInterestsSelection()}
      </ScrollView>

      {step > 1 && step < 4 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>← Tilbake</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textWhite,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressDotActive: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  progressDotCurrent: {
    backgroundColor: colors.textWhite,
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  stepContainer: {
    alignItems: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  optionsContainer: {
    width: "100%",
    gap: 16,
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0, 40, 104, 0.05)",
  },
  optionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  optionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginBottom: 32,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  interestChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0, 40, 104, 0.1)",
  },
  interestChipPressed: {
    opacity: 0.8,
  },
  interestEmoji: {
    fontSize: 20,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  interestLabelSelected: {
    color: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textWhite,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
});

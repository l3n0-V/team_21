import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as Speech from "expo-speech";
import { colors } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";

export default function ListeningChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [norwegianVoice, setNorwegianVoice] = useState(null);

  // Find the best Norwegian voice on device
  useEffect(() => {
    const findNorwegianVoice = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        // Look for Norwegian voices - prefer higher quality ones
        const nbVoices = voices.filter(
          (v) => v.language === "nb-NO" || v.language === "no-NO"
        );

        if (nbVoices.length > 0) {
          // Prefer non-compact voices (higher quality)
          const preferredVoice = nbVoices.find(
            (v) => !v.identifier.includes("compact")
          ) || nbVoices[0];
          setNorwegianVoice(preferredVoice.identifier);
          console.log("Using Norwegian voice:", preferredVoice);
        }
      } catch (error) {
        console.warn("Could not get voices:", error);
      }
    };
    findNorwegianVoice();
  }, []);

  const playAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);

    const speechOptions = {
      language: "nb-NO",
      rate: 0.85,  // Slightly slower for clarity
      pitch: 1.0,  // Natural pitch
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    };

    // Use specific Norwegian voice if available
    if (norwegianVoice) {
      speechOptions.voice = norwegianVoice;
    }

    Speech.speak(challenge.audio_text, speechOptions);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      Alert.alert("Velg et svar", "Du må velge et alternativ før du sender inn");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Please log in to submit answers");
      return;
    }

    setLoading(true);

    try {
      // Submit to backend
      const result = await submitChallenge(token, challenge.id, selectedAnswer);

      setSubmitted(true);
      setLoading(false);

      // Update local performance tracking
      try {
        await updatePerformance({
          challenge: challenge,
          score: result.correct ? 100 : 0,
          passed: result.correct,
          xpEarned: result.xp_gained || 0,
        });
      } catch (perfError) {
        console.warn("Failed to update performance:", perfError);
      }

      const tryAnother = async () => {
        // Wait a bit for backend to update, then reload
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadTodaysChallenges(token);

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get next available listening challenge
        const listeningData = todaysChallenges?.challenges?.listening;
        const nextChallenge = listeningData?.available?.[0];

        if (nextChallenge && listeningData?.can_complete_more) {
          // Navigate to new challenge (replace current screen)
          navigation.replace("ListeningChallenge", { challenge: nextChallenge });
        } else {
          // No more challenges available
          Alert.alert(
            "Bra jobbet!",
            "Ingen flere utfordringer tilgjengelig akkurat nå. Vil du generere nye?",
            [
              { text: "Gå til Today", onPress: () => navigation.navigate("Tabs", { screen: "Today" }) }
            ]
          );
        }
      };

      if (result.correct) {
        Alert.alert(
          "Riktig! 🎉",
          `Du hørte riktig! Du fikk ${result.xp_gained} XP\n\nHva vil du gjøre nå?`,
          [
            {
              text: "Gå til Today",
              onPress: () => navigation.navigate("Tabs", { screen: "Today" }),
              style: "default"
            },
            {
              text: "Prøv en annen",
              onPress: tryAnother,
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert(
          "Nesten! 👂",
          `Lytting er vanskelig - dette er helt normalt!\n\nRiktig svar: ${result.correct_answer || challenge.options[challenge.correct_answer]}\n\nHva vil du gjøre?`,
          [
            {
              text: "Prøv igjen",
              onPress: () => {
                setSubmitted(false);
                setSelectedAnswer(null);
              },
              style: "cancel"
            },
            {
              text: "Gå til Today",
              onPress: () => navigation.navigate("Tabs", { screen: "Today" }),
              style: "default"
            }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to submit challenge:", error);
      Alert.alert(
        "Error",
        "Failed to submit answer. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Tilbake</Text>
        </Pressable>

        <Text style={styles.title}>{challenge.title_no || challenge.title}</Text>
        <Text style={styles.description}>
          {challenge.description_no || challenge.description}
        </Text>

        <Pressable
          onPress={playAudio}
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? "🔊 Spiller..." : "🔊 Spill av lyd"}
          </Text>
        </Pressable>

        <Text style={styles.optionsLabel}>Velg riktig oversettelse:</Text>

        <View style={styles.optionsContainer}>
          {challenge.options.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected,
                submitted && index === challenge.correct_answer && styles.optionCorrect,
                submitted && selectedAnswer === index && index !== challenge.correct_answer && styles.optionWrong,
              ]}
              onPress={() => !submitted && setSelectedAnswer(index)}
              disabled={submitted}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAnswer === index && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        {!submitted && (
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              selectedAnswer === null && styles.submitButtonDisabled,
            ]}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.submitButtonText}>Send inn svar</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  playButton: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  playButtonActive: {
    backgroundColor: "#003580",
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textWhite,
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0, 40, 104, 0.05)",
  },
  optionCorrect: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  optionWrong: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textWhite,
  },
});

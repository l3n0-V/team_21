import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
} from "react-native";
import * as Speech from "expo-speech";
import { colors } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";

export default function ListeningChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    Speech.speak(challenge.audio_text, {
      language: "nb-NO",
      rate: 0.8,
      onDone: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      Alert.alert("Velg et svar", "Du må velge et alternativ før du sender inn");
      return;
    }

    setSubmitted(true);
    const isCorrect = selectedAnswer === challenge.correct_answer;

    // Update performance tracking
    try {
      await updatePerformance({
        challenge: challenge,
        score: isCorrect ? 100 : 0,
        passed: isCorrect,
        xpEarned: isCorrect ? 10 : 0,
      });
    } catch (perfError) {
      console.warn("Failed to update performance:", perfError);
    }

    if (isCorrect) {
      Alert.alert(
        "Riktig!",
        "Du fikk 10 XP",
        [{ text: "Fortsett", onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert(
        "Feil svar",
        `Riktig svar var: ${challenge.options[challenge.correct_answer]}`,
        [{ text: "Prøv igjen", onPress: () => setSubmitted(false) }]
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

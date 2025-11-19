import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { colors } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";

export default function MultipleChoiceChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      // Submit to backend - send the selected option index
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

        // Get next available multiple_choice challenge
        const multipleChoiceData = todaysChallenges?.challenges?.multiple_choice;
        const nextChallenge = multipleChoiceData?.available?.[0];

        if (nextChallenge && multipleChoiceData?.can_complete_more) {
          // Navigate to new challenge (replace current screen)
          navigation.replace("MultipleChoiceChallenge", { challenge: nextChallenge });
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
          `Bra jobbet! Du fikk ${result.xp_gained} XP\n\nHva vil du gjøre nå?`,
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
          "Nesten! 🤔",
          `Ikke gi opp - oversettelse tar tid å mestre.\n\nRiktig svar: ${result.correct_answer || challenge.options[challenge.correct_answer]}\n\nHva vil du gjøre?`,
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

        <View style={styles.promptContainer}>
          <Text style={styles.promptLabel}>Oversett:</Text>
          <Text style={styles.promptText}>{challenge.prompt}</Text>
        </View>

        <Text style={styles.optionsLabel}>Velg riktig oversettelse:</Text>

        <View style={styles.optionsContainer}>
          {challenge.options.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected,
                submitted &&
                  index === challenge.correct_answer &&
                  styles.optionCorrect,
                submitted &&
                  selectedAnswer === index &&
                  index !== challenge.correct_answer &&
                  styles.optionWrong,
              ]}
              onPress={() => !submitted && setSelectedAnswer(index)}
              disabled={submitted}
            >
              <Text style={styles.optionLetter}>
                {String.fromCharCode(65 + index)}.
              </Text>
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
  promptContainer: {
    backgroundColor: "rgba(0, 40, 104, 0.05)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  promptLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
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
  optionLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
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

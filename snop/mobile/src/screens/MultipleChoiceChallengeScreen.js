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
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FeedbackModal from "../components/FeedbackModal";

export default function MultipleChoiceChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    isCorrect: false,
    xpGained: 0,
    message: '',
  });

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
      // Submit to backend - send the actual option text for proper comparison
      const selectedOption = challenge.options[selectedAnswer];
      const result = await submitChallenge(token, challenge.id, selectedOption);

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

      if (result.correct) {
        setFeedbackData({
          isCorrect: true,
          xpGained: result.xp_gained,
          message: 'Bra jobbet!',
        });
      } else {
        setFeedbackData({
          isCorrect: false,
          xpGained: 0,
          message: `Riktig svar: ${result.correct_answer || challenge.options[challenge.correct_answer]}`,
        });
      }
      setFeedbackVisible(true);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Tilbake</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.primary }]}>{challenge.title_no || challenge.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {challenge.description_no || challenge.description}
        </Text>

        <View style={styles.promptContainer}>
          <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>Oversett:</Text>
          <Text style={[styles.promptText, { color: colors.primary }]}>{challenge.prompt}</Text>
        </View>

        <Text style={[styles.optionsLabel, { color: colors.textPrimary }]}>Velg riktig oversettelse:</Text>

        <View style={styles.optionsContainer}>
          {challenge.options.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                selectedAnswer === index && [styles.optionSelected, { borderColor: colors.primary }],
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
              <Text style={[styles.optionLetter, { color: colors.textSecondary }]}>
                {String.fromCharCode(65 + index)}.
              </Text>
              <Text
                style={[
                  styles.optionText,
                  { color: colors.textPrimary },
                  selectedAnswer === index && [styles.optionTextSelected, { color: colors.primary }],
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
              { backgroundColor: colors.primary },
              selectedAnswer === null && { opacity: 0.5 },
            ]}
            disabled={selectedAnswer === null}
          >
            <Text style={[styles.submitButtonText, { color: colors.textWhite }]}>Send inn svar</Text>
          </Pressable>
        )}

        <FeedbackModal
          visible={feedbackVisible}
          isCorrect={feedbackData.isCorrect}
          xpGained={feedbackData.xpGained}
          message={feedbackData.message}
          onTryAnother={async () => {
            setFeedbackVisible(false);
            await new Promise(resolve => setTimeout(resolve, 500));
            const freshData = await loadTodaysChallenges(token);
            const multipleChoiceData = freshData?.challenges?.multiple_choice;
            const nextChallenge = multipleChoiceData?.available?.[0];
            if (nextChallenge && multipleChoiceData?.can_complete_more) {
              navigation.replace("MultipleChoiceChallenge", { challenge: nextChallenge });
            } else {
              navigation.navigate("Tabs", { screen: "Today" });
            }
          }}
          onGoBack={() => {
            setFeedbackVisible(false);
            navigation.navigate("Tabs", { screen: "Today" });
          }}
          showTryAnother={true}
        />
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
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  promptText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  optionsLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    gap: 12,
  },
  optionSelected: {
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
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "600",
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});

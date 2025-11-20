import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FeedbackModal from "../components/FeedbackModal";

export default function FillBlankChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    isCorrect: false,
    xpGained: 0,
    message: '',
  });

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      Alert.alert("Tomt svar", "Skriv inn det manglende ordet");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Please log in to submit answers");
      return;
    }

    setLoading(true);

    try {
      // Submit to backend
      const result = await submitChallenge(token, challenge.id, userAnswer.trim());

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
          message: 'Flott jobbet!',
        });
      } else {
        setFeedbackData({
          isCorrect: false,
          xpGained: 0,
          message: `Riktig svar: "${result.correct_answer || challenge.missing_word}"`,
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

  // Format sentence with blank highlighted
  const formatSentence = () => {
    const parts = challenge.sentence.split("___");
    if (parts.length !== 2) return challenge.sentence;

    return (
      <Text style={[styles.sentenceText, { color: colors.textPrimary }]}>
        {parts[0]}
        <Text style={[styles.blankText, { color: colors.primary }]}>
          {submitted ? challenge.missing_word : "___"}
        </Text>
        {parts[1]}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
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

        {challenge.prompt && (
          <View style={[styles.promptContainer, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Text style={[styles.promptText, { color: colors.primary }]}>{challenge.prompt}</Text>
          </View>
        )}

        <View style={styles.sentenceContainer}>{formatSentence()}</View>

        {challenge.hint && (
          <Pressable
            onPress={() => setShowHint(!showHint)}
            style={styles.hintButton}
          >
            <Text style={[styles.hintButtonText, { color: colors.primary }]}>
              {showHint ? "Skjul hint" : "Vis hint"}
            </Text>
          </Pressable>
        )}

        {showHint && challenge.hint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>💡 {challenge.hint}</Text>
          </View>
        )}

        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Ditt svar:</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary },
            submitted && [styles.inputDisabled, { backgroundColor: colors.backgroundSecondary }],
          ]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Skriv det manglende ordet..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={true}
          spellCheck={false}
          keyboardType="default"
          textContentType="none"
          editable={!submitted}
        />

        {!submitted && (
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (!userAnswer.trim() || loading) && { opacity: 0.5 },
            ]}
            disabled={!userAnswer.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.textWhite }]}>Sjekk svar</Text>
            )}
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
            const fillBlankData = freshData?.challenges?.fill_blank;
            const nextChallenge = fillBlankData?.available?.[0];
            if (nextChallenge && fillBlankData?.can_complete_more) {
              navigation.replace("FillBlankChallenge", { challenge: nextChallenge });
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
      </KeyboardAvoidingView>
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
    marginBottom: 16,
  },
  promptContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sentenceContainer: {
    backgroundColor: "rgba(0, 40, 104, 0.05)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sentenceText: {
    fontSize: 20,
    lineHeight: 30,
    textAlign: "center",
  },
  blankText: {
    fontWeight: "800",
    backgroundColor: "rgba(0, 40, 104, 0.1)",
  },
  hintButton: {
    alignSelf: "center",
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  hintBox: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: "#92400e",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
  },
  inputDisabled: {
    opacity: 0.7,
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

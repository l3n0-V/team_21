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
import { colors } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";

export default function FillBlankChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);

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

      const tryAnother = async () => {
        // Wait a bit for backend to update, then reload
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadTodaysChallenges(token);

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get next available fill_blank challenge
        const fillBlankData = todaysChallenges?.challenges?.fill_blank;
        const nextChallenge = fillBlankData?.available?.[0];

        if (nextChallenge && fillBlankData?.can_complete_more) {
          // Navigate to new challenge (replace current screen)
          navigation.replace("FillBlankChallenge", { challenge: nextChallenge });
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
          `Flott jobbet! Du fikk ${result.xp_gained} XP\n\nHva vil du gjøre nå?`,
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
          "Nesten! 💪",
          `Dette er en vanlig feil - mange trenger flere forsøk.\n\nRiktig svar: "${result.correct_answer || challenge.missing_word}"\n\nHva vil du gjøre?`,
          [
            {
              text: "Prøv igjen",
              onPress: () => {
                setSubmitted(false);
                setUserAnswer("");
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

  // Format sentence with blank highlighted
  const formatSentence = () => {
    const parts = challenge.sentence.split("___");
    if (parts.length !== 2) return challenge.sentence;

    return (
      <Text style={styles.sentenceText}>
        {parts[0]}
        <Text style={styles.blankText}>
          {submitted ? challenge.missing_word : "___"}
        </Text>
        {parts[1]}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
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

        <View style={styles.sentenceContainer}>{formatSentence()}</View>

        {challenge.hint && (
          <Pressable
            onPress={() => setShowHint(!showHint)}
            style={styles.hintButton}
          >
            <Text style={styles.hintButtonText}>
              {showHint ? "Skjul hint" : "Vis hint"}
            </Text>
          </Pressable>
        )}

        {showHint && challenge.hint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>💡 {challenge.hint}</Text>
          </View>
        )}

        <Text style={styles.inputLabel}>Ditt svar:</Text>
        <TextInput
          style={[
            styles.input,
            submitted && styles.inputDisabled,
          ]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Skriv det manglende ordet..."
          placeholderTextColor={colors.textLight}
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
              (!userAnswer.trim() || loading) && styles.submitButtonDisabled,
            ]}
            disabled={!userAnswer.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.submitButtonText}>Sjekk svar</Text>
            )}
          </Pressable>
        )}
      </KeyboardAvoidingView>
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
  sentenceContainer: {
    backgroundColor: "rgba(0, 40, 104, 0.05)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sentenceText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 30,
    textAlign: "center",
  },
  blankText: {
    fontWeight: "800",
    color: colors.primary,
    backgroundColor: "rgba(0, 40, 104, 0.1)",
  },
  hintButton: {
    alignSelf: "center",
    marginBottom: 12,
  },
  hintButtonText: {
    fontSize: 14,
    color: colors.primary,
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
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    marginBottom: 24,
  },
  inputDisabled: {
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.7,
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

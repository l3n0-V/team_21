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
import { usePerformance } from "../context/PerformanceContext";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import FeedbackModal from "../components/FeedbackModal";

export default function ListeningChallengeScreen({ route, navigation }) {
  const { challenge } = route.params;
  const { updatePerformance } = usePerformance();
  const { submitChallenge, loadTodaysChallenges, todaysChallenges } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [norwegianVoice, setNorwegianVoice] = useState(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    isCorrect: false,
    xpGained: 0,
    message: '',
  });

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
          message: 'Du horte riktig!',
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

        <Pressable
          onPress={playAudio}
          style={[styles.playButton, { backgroundColor: colors.primary }, isPlaying && styles.playButtonActive]}
        >
          <Text style={[styles.playButtonText, { color: colors.textWhite }]}>
            {isPlaying ? "🔊 Spiller..." : "🔊 Spill av lyd"}
          </Text>
        </Pressable>

        <Text style={[styles.optionsLabel, { color: colors.textPrimary }]}>Velg riktig oversettelse:</Text>

        <View style={styles.optionsContainer}>
          {challenge.options.map((option, index) => (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                selectedAnswer === index && [styles.optionSelected, { borderColor: colors.primary }],
                submitted && index === challenge.correct_answer && styles.optionCorrect,
                submitted && selectedAnswer === index && index !== challenge.correct_answer && styles.optionWrong,
              ]}
              onPress={() => !submitted && setSelectedAnswer(index)}
              disabled={submitted}
            >
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
            const listeningData = freshData?.challenges?.listening;
            const nextChallenge = listeningData?.available?.[0];
            if (nextChallenge && listeningData?.can_complete_more) {
              navigation.replace("ListeningChallenge", { challenge: nextChallenge });
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
  playButton: {
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
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
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
  optionText: {
    fontSize: 16,
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

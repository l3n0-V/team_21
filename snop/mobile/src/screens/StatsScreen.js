import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { shadows } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";
import { useTheme } from "../context/ThemeContext";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { performance } = usePerformance();

  const getTrendEmoji = (trend) => {
    switch (trend) {
      case "improving":
        return "📈";
      case "struggling":
        return "📉";
      default:
        return "➡️";
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case "improving":
        return "Forbedring!";
      case "struggling":
        return "Trenger øving";
      default:
        return "Stabil";
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case "beginner":
        return "Nybegynner";
      case "intermediate":
        return "Mellomliggende";
      case "advanced":
        return "Avansert";
      default:
        return level;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "pronunciation":
        return "Uttale";
      case "listening":
        return "Lytting";
      case "fill_blank":
        return "Fyll inn";
      case "multiple_choice":
        return "Flersvar";
      default:
        return type;
    }
  };

  const getTopicText = (topic) => {
    const topicMap = {
      cafe: "Kafé",
      travel: "Reise",
      social: "Sosiale",
      shopping: "Shopping",
      work: "Jobb",
      weather: "Dagligliv",
      navigation: "Navigasjon",
      greetings: "Hilsener",
      conversation: "Samtale",
    };
    return topicMap[topic] || topic;
  };

  // Get weak areas (success rate < 60% with at least 2 attempts)
  const getWeakAreas = () => {
    const weak = [];

    // Check topics
    Object.entries(performance.byTopic).forEach(([topic, stats]) => {
      if (stats.attempts >= 2 && stats.successes / stats.attempts < 0.6) {
        weak.push({
          type: "topic",
          name: getTopicText(topic),
          rate: Math.round((stats.successes / stats.attempts) * 100),
        });
      }
    });

    // Check types
    Object.entries(performance.byType).forEach(([type, stats]) => {
      if (stats.attempts >= 2 && stats.successes / stats.attempts < 0.6) {
        weak.push({
          type: "type",
          name: getTypeText(type),
          rate: Math.round((stats.successes / stats.attempts) * 100),
        });
      }
    });

    return weak;
  };

  // Get strengths (success rate > 80% with at least 3 attempts)
  const getStrengths = () => {
    const strong = [];

    Object.entries(performance.byTopic).forEach(([topic, stats]) => {
      if (stats.attempts >= 3 && stats.successes / stats.attempts > 0.8) {
        strong.push({
          type: "topic",
          name: getTopicText(topic),
          rate: Math.round((stats.successes / stats.attempts) * 100),
        });
      }
    });

    Object.entries(performance.byType).forEach(([type, stats]) => {
      if (stats.attempts >= 3 && stats.successes / stats.attempts > 0.8) {
        strong.push({
          type: "type",
          name: getTypeText(type),
          rate: Math.round((stats.successes / stats.attempts) * 100),
        });
      }
    });

    return strong;
  };

  const weakAreas = getWeakAreas();
  const strengths = getStrengths();

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      <LinearGradient
        colors={[colors.primary, "#003580"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: insets.top + 16 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.textWhite, marginBottom: 4 }}>Statistikk</Text>
        <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>Din fremgang og resultater</Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Performance */}
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Oversikt</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.halfCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>Forsøk totalt</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>{performance.overall.totalAttempts}</Text>
          </View>
          <View style={[styles.statsCard, styles.halfCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>Suksessrate</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
              {performance.overall.totalAttempts > 0
                ? `${Math.round(performance.overall.successRate)}%`
                : "0%"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.halfCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>Snitt score</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
              {performance.overall.totalAttempts > 0
                ? Math.round(performance.overall.avgScore)
                : 0}
            </Text>
          </View>
          <View style={[styles.statsCard, styles.halfCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>Trend</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
              {getTrendEmoji(performance.recentTrend)}{" "}
              {getTrendText(performance.recentTrend)}
            </Text>
          </View>
        </View>

        {/* Adaptive Level */}
        <View style={{ backgroundColor: `${colors.primary}1A`, padding: 20, borderRadius: 14, marginBottom: 16, alignItems: "center", borderWidth: 2, borderColor: colors.primary }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4, fontWeight: "600" }}>Ditt tilpassede nivå</Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: colors.primary, marginBottom: 4 }}>
            {getLevelText(performance.effectiveLevel)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic" }}>
            Justeres automatisk basert på prestasjonene dine
          </Text>
        </View>

        {/* Recent Scores */}
        {performance.lastFiveScores.length > 0 && (
          <>
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Siste resultater</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.background, padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              {performance.lastFiveScores.map((score, index) => (
                <View key={index} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.backgroundSecondary, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.border }}>
                  <Text
                    style={[
                      { fontSize: 16, fontWeight: "700", color: colors.text },
                      score >= 80 && { color: "#10b981" },
                      score < 50 && { color: "#ef4444" },
                    ]}
                  >
                    {score}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Performance by Type */}
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Etter oppgavetype</Text>
        </View>

        {Object.entries(performance.byType).map(([type, stats]) => (
          <View key={type} style={{ backgroundColor: colors.background, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
            <View style={styles.typeHeader}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{getTypeText(type)}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{stats.attempts} forsøk</Text>
            </View>
            {stats.attempts > 0 ? (
              <>
                <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundSecondary }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${(stats.successes / stats.attempts) * 100}%`,
                        backgroundColor:
                          stats.successes / stats.attempts >= 0.8
                            ? "#10b981"
                            : stats.successes / stats.attempts < 0.5
                            ? "#ef4444"
                            : "#f59e0b",
                      },
                    ]}
                  />
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {Math.round((stats.successes / stats.attempts) * 100)}% riktig
                  • Snitt: {Math.round(stats.avgScore)}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 12, color: colors.textLight, fontStyle: "italic" }}>Ingen data ennå</Text>
            )}
          </View>
        ))}

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <>
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Områder å øve på</Text>
            </View>
            <View style={{ backgroundColor: "#fef3c7", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fcd34d" }}>
              {weakAreas.map((area, index) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>⚠️</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    {area.name} ({area.rate}% riktig)
                  </Text>
                </View>
              ))}
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic", marginTop: 4 }}>
                Vi prioriterer utfordringer i disse områdene for deg
              </Text>
            </View>
          </>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <>
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Dine styrker</Text>
            </View>
            <View style={{ backgroundColor: "#d1fae5", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#6ee7b7" }}>
              {strengths.map((area, index) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>⭐</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    {area.name} ({area.rate}% riktig)
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {performance.overall.totalAttempts === 0 && (
          <View style={{ alignItems: "center", padding: 32, backgroundColor: colors.background, borderRadius: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary, marginBottom: 8 }}>Start din reise!</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
              Fullfør noen utfordringer for å se statistikken din her.
              Systemet vil lære av prestasjonene dine og tilpasse
              utfordringene til ditt nivå.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    ...shadows.small,
  },
  halfCard: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
});

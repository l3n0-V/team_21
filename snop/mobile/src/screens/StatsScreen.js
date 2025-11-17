import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadows } from "../styles/colors";
import { usePerformance } from "../context/PerformanceContext";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, "#003580"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Statistikk</Text>
        <Text style={styles.subtitle}>Din fremgang og resultater</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Performance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Oversikt</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.halfCard]}>
            <Text style={styles.statLabel}>Forsøk totalt</Text>
            <Text style={styles.statValue}>{performance.overall.totalAttempts}</Text>
          </View>
          <View style={[styles.statsCard, styles.halfCard]}>
            <Text style={styles.statLabel}>Suksessrate</Text>
            <Text style={styles.statValue}>
              {performance.overall.totalAttempts > 0
                ? `${Math.round(performance.overall.successRate)}%`
                : "0%"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.halfCard]}>
            <Text style={styles.statLabel}>Snitt score</Text>
            <Text style={styles.statValue}>
              {performance.overall.totalAttempts > 0
                ? Math.round(performance.overall.avgScore)
                : 0}
            </Text>
          </View>
          <View style={[styles.statsCard, styles.halfCard]}>
            <Text style={styles.statLabel}>Trend</Text>
            <Text style={styles.statValue}>
              {getTrendEmoji(performance.recentTrend)}{" "}
              {getTrendText(performance.recentTrend)}
            </Text>
          </View>
        </View>

        {/* Adaptive Level */}
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Ditt tilpassede nivå</Text>
          <Text style={styles.levelValue}>
            {getLevelText(performance.effectiveLevel)}
          </Text>
          <Text style={styles.levelNote}>
            Justeres automatisk basert på prestasjonene dine
          </Text>
        </View>

        {/* Recent Scores */}
        {performance.lastFiveScores.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Siste resultater</Text>
            </View>
            <View style={styles.scoresContainer}>
              {performance.lastFiveScores.map((score, index) => (
                <View key={index} style={styles.scoreCircle}>
                  <Text
                    style={[
                      styles.scoreText,
                      score >= 80 && styles.scoreHigh,
                      score < 50 && styles.scoreLow,
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Etter oppgavetype</Text>
        </View>

        {Object.entries(performance.byType).map(([type, stats]) => (
          <View key={type} style={styles.typeCard}>
            <View style={styles.typeHeader}>
              <Text style={styles.typeName}>{getTypeText(type)}</Text>
              <Text style={styles.typeAttempts}>{stats.attempts} forsøk</Text>
            </View>
            {stats.attempts > 0 ? (
              <>
                <View style={styles.progressBarContainer}>
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
                <Text style={styles.typeStats}>
                  {Math.round((stats.successes / stats.attempts) * 100)}% riktig
                  • Snitt: {Math.round(stats.avgScore)}
                </Text>
              </>
            ) : (
              <Text style={styles.noData}>Ingen data ennå</Text>
            )}
          </View>
        ))}

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Områder å øve på</Text>
            </View>
            <View style={styles.insightCard}>
              {weakAreas.map((area, index) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>⚠️</Text>
                  <Text style={styles.insightText}>
                    {area.name} ({area.rate}% riktig)
                  </Text>
                </View>
              ))}
              <Text style={styles.insightNote}>
                Vi prioriterer utfordringer i disse områdene for deg
              </Text>
            </View>
          </>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dine styrker</Text>
            </View>
            <View style={[styles.insightCard, styles.strengthCard]}>
              {strengths.map((area, index) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.insightEmoji}>⭐</Text>
                  <Text style={styles.insightText}>
                    {area.name} ({area.rate}% riktig)
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {performance.overall.totalAttempts === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Start din reise!</Text>
            <Text style={styles.emptyText}>
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
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  halfCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  levelCard: {
    backgroundColor: "rgba(0, 40, 104, 0.1)",
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  levelLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  levelValue: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 4,
  },
  levelNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  scoreHigh: {
    color: "#10b981",
  },
  scoreLow: {
    color: "#ef4444",
  },
  typeCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  typeAttempts: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  typeStats: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noData: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: "italic",
  },
  insightCard: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  strengthCard: {
    backgroundColor: "#d1fae5",
    borderColor: "#6ee7b7",
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
  insightText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  insightNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: colors.background,
    borderRadius: 16,
    marginTop: 16,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

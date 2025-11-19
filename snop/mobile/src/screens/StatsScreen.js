import React, { useEffect } from "react";
import { View, Text, Dimensions, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useChallenges } from "../context/ChallengeContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function StatsScreen() {
  const { userProgress, loadUserProgress } = useChallenges();
  const { token } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (token) {
      loadUserProgress(token);
    }
  }, [token]);

  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{ data: [5, 9, 6, 12, 7, 10, 14] }]
  };

  // Calculate stats from userProgress
  const currentLevel = userProgress?.current_level || 'A1';
  const currentLevelData = userProgress?.progress?.[currentLevel];
  const totalCompleted = Object.values(userProgress?.progress || {})
    .filter(level => level.percentage === 100)
    .length;
  const recentCompletions = userProgress?.recent_completions?.length || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Your Progress</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track your language learning journey
          </Text>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.dashboardGrid}>
          {/* Current Level Card */}
          <View
            style={[
              styles.dashboardCard,
              styles.dashboardCardLarge,
              { backgroundColor: colors.primary }
            ]}
          >
            <Text style={styles.dashboardCardLabel}>Current Level</Text>
            <Text style={styles.dashboardCardValue}>
              {currentLevel}
            </Text>
            <Text style={styles.dashboardCardSubtext}>
              {currentLevelData?.name || 'Beginner'}
            </Text>
            {currentLevelData && (
              <View style={styles.miniProgressContainer}>
                <View
                  style={[
                    styles.miniProgressBar,
                    { width: `${currentLevelData.percentage}%` }
                  ]}
                />
              </View>
            )}
          </View>

          {/* Levels Completed Card */}
          <View
            style={[
              styles.dashboardCard,
              styles.dashboardCardSmall,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.dashboardCardIcon, { color: colors.success }]}>✓</Text>
            <Text style={[styles.dashboardCardValueSmall, { color: colors.textPrimary }]}>
              {totalCompleted}
            </Text>
            <Text style={[styles.dashboardCardLabelSmall, { color: colors.textSecondary }]}>
              Levels Completed
            </Text>
          </View>

          {/* Recent Activity Card */}
          <View
            style={[
              styles.dashboardCard,
              styles.dashboardCardSmall,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.dashboardCardIcon, { color: colors.primary }]}>📊</Text>
            <Text style={[styles.dashboardCardValueSmall, { color: colors.textPrimary }]}>
              {recentCompletions}
            </Text>
            <Text style={[styles.dashboardCardLabelSmall, { color: colors.textSecondary }]}>
              Recent Challenges
            </Text>
          </View>
        </View>

        {/* CEFR Learning Roadmap */}
        {userProgress && userProgress.progress && (
          <View style={styles.roadmapSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              🗺️ Learning Roadmap
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Your progress through CEFR levels
            </Text>

            {Object.entries(userProgress.progress).map(([levelKey, levelData]) => {
              const isCurrentLevel = levelData.is_current;
              const isUnlocked = levelData.unlocked;
              const icon = isUnlocked ? (isCurrentLevel ? '→' : '✓') : '🔒';
              const progressPercentage = levelData.percentage || 0;

              return (
                <View
                  key={levelKey}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: isCurrentLevel ? colors.primary : colors.border
                    },
                    isCurrentLevel && { borderWidth: 2 }
                  ]}
                >
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelIcon}>{icon}</Text>
                    <Text
                      style={[
                        styles.levelTitle,
                        {
                          fontWeight: isCurrentLevel ? "800" : "600",
                          color: isCurrentLevel ? colors.primary : colors.textPrimary
                        }
                      ]}
                    >
                      {levelKey} - {levelData.name}
                    </Text>
                  </View>

                  {isUnlocked ? (
                    <>
                      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        Progress: {levelData.completed}/{levelData.required} ({progressPercentage}%)
                      </Text>
                      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${progressPercentage}%`,
                              backgroundColor: isCurrentLevel ? colors.primary : colors.success
                            }
                          ]}
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.unlockMessage, { color: colors.textSecondary }]}>
                      {levelData.unlock_message}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Weekly Activity Chart */}
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📈 Your weekly snops
          </Text>
          <LineChart
            width={Dimensions.get("window").width - 48}
            height={220}
            data={data}
            chartConfig={{
              backgroundGradientFrom: colors.cardBackground || "#ffffff",
              backgroundGradientTo: colors.cardBackground || "#ffffff",
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: () => colors.textPrimary || "#111827",
              strokeWidth: 2,
              decimalPlaces: 0
            }}
            style={styles.chart}
            bezier
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  dashboardCard: {
    borderRadius: 16,
    padding: 20,
  },
  dashboardCardLarge: {
    width: '100%',
    minHeight: 140,
  },
  dashboardCardSmall: {
    flex: 1,
    minWidth: '47%',
    minHeight: 120,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  dashboardCardValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dashboardCardSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  miniProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  dashboardCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dashboardCardValueSmall: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  dashboardCardLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  roadmapSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  levelCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  levelIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  levelTitle: {
    fontSize: 16,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  unlockMessage: {
    fontSize: 12,
    fontStyle: "italic",
  },
  chartSection: {
    marginBottom: 24,
  },
  chart: {
    borderRadius: 12,
    marginTop: 12,
  },
});

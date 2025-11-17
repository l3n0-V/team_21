import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const PerformanceContext = createContext();
export const usePerformance = () => useContext(PerformanceContext);

const PERFORMANCE_STORAGE_KEY = "userPerformance";

// Default performance data structure
const createDefaultPerformance = (userProfile = null) => ({
  overall: {
    totalAttempts: 0,
    successfulAttempts: 0,
    successRate: 0,
    avgScore: 0,
    totalScore: 0,
  },
  byType: {
    pronunciation: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    listening: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    fill_blank: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    multiple_choice: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
  },
  byTopic: {
    cafe: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    travel: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    social: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    shopping: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    work: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    weather: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    navigation: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    greetings: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    conversation: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
  },
  byLevel: {
    beginner: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    intermediate: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
    advanced: { attempts: 0, successes: 0, avgScore: 0, totalScore: 0 },
  },
  // Effective level starts as user's self-reported level, but can adjust
  effectiveLevel: userProfile?.level || "beginner",
  // Recent trend based on performance
  recentTrend: "stable", // "improving", "stable", "struggling"
  // Last five scores for trend calculation
  lastFiveScores: [],
  // Recently completed challenge IDs (to avoid repetition)
  recentChallenges: [],
  // Timestamp of last update
  lastUpdated: null,
});

export function PerformanceProvider({ children }) {
  const { user } = useAuth();
  const [performance, setPerformance] = useState(createDefaultPerformance());
  const [loading, setLoading] = useState(true);

  // Load performance data from AsyncStorage
  const loadPerformance = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(PERFORMANCE_STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setPerformance(parsed);
        console.log("Performance data loaded:", parsed);
      } else {
        // If no performance data exists, try to get user profile for effective level
        const profileStr = await AsyncStorage.getItem("userProfile");
        const userProfile = profileStr ? JSON.parse(profileStr) : null;
        const defaultPerf = createDefaultPerformance(userProfile);
        setPerformance(defaultPerf);
        console.log("Performance data initialized with defaults:", defaultPerf);
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
      setPerformance(createDefaultPerformance());
    } finally {
      setLoading(false);
    }
  };

  // Save performance data to AsyncStorage
  const savePerformance = async (newPerformance) => {
    try {
      const dataToSave = {
        ...newPerformance,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(dataToSave));
      setPerformance(dataToSave);
      console.log("Performance data saved:", dataToSave);
    } catch (error) {
      console.error("Error saving performance data:", error);
    }
  };

  // Calculate trend from last five scores
  const calculateTrend = (scores) => {
    if (scores.length < 3) return "stable";

    const recentScores = scores.slice(-5);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    // Compare first half to second half of scores
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = avgSecond - avgFirst;

    if (difference > 10) return "improving";
    if (difference < -10) return "struggling";

    // Also check overall performance
    if (avgRecent > 85) return "improving";
    if (avgRecent < 50) return "struggling";

    return "stable";
  };

  // Adjust effective level based on performance
  const adjustEffectiveLevel = (currentPerformance) => {
    const { byLevel, effectiveLevel, overall, lastFiveScores } = currentPerformance;

    // Need at least 5 attempts before adjusting
    if (overall.totalAttempts < 5) return effectiveLevel;

    const currentLevelStats = byLevel[effectiveLevel];

    // If not enough attempts at current level, don't adjust
    if (!currentLevelStats || currentLevelStats.attempts < 3) return effectiveLevel;

    const successRate = currentLevelStats.attempts > 0
      ? (currentLevelStats.successes / currentLevelStats.attempts) * 100
      : 0;
    const avgScore = currentLevelStats.avgScore;

    // Check recent scores trend
    const recentAvg = lastFiveScores.length > 0
      ? lastFiveScores.reduce((a, b) => a + b, 0) / lastFiveScores.length
      : 0;

    // Level progression rules:
    // - Move up if success rate > 85% over at least 10 attempts OR recent avg > 90%
    // - Move down if success rate < 50% over at least 5 attempts OR recent avg < 40%

    if (effectiveLevel === "beginner") {
      if (
        (currentLevelStats.attempts >= 10 && successRate > 85 && avgScore > 80) ||
        (lastFiveScores.length >= 5 && recentAvg > 90)
      ) {
        console.log("Adjusting effective level: beginner -> intermediate");
        return "intermediate";
      }
    } else if (effectiveLevel === "intermediate") {
      if (
        (currentLevelStats.attempts >= 10 && successRate > 85 && avgScore > 80) ||
        (lastFiveScores.length >= 5 && recentAvg > 90)
      ) {
        console.log("Adjusting effective level: intermediate -> advanced");
        return "advanced";
      } else if (
        (currentLevelStats.attempts >= 5 && successRate < 50) ||
        (lastFiveScores.length >= 5 && recentAvg < 40)
      ) {
        console.log("Adjusting effective level: intermediate -> beginner");
        return "beginner";
      }
    } else if (effectiveLevel === "advanced") {
      if (
        (currentLevelStats.attempts >= 5 && successRate < 50) ||
        (lastFiveScores.length >= 5 && recentAvg < 40)
      ) {
        console.log("Adjusting effective level: advanced -> intermediate");
        return "intermediate";
      }
    }

    return effectiveLevel;
  };

  // Update performance after completing a challenge
  const updatePerformance = async (challengeResult) => {
    const { challenge, score, passed, xpEarned } = challengeResult;

    if (!challenge) {
      console.warn("updatePerformance called without challenge data");
      return;
    }

    const newPerformance = { ...performance };

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(100, Math.max(0, score || 0));

    // Update overall stats
    newPerformance.overall.totalAttempts += 1;
    if (passed) {
      newPerformance.overall.successfulAttempts += 1;
    }
    newPerformance.overall.totalScore += normalizedScore;
    newPerformance.overall.avgScore =
      newPerformance.overall.totalScore / newPerformance.overall.totalAttempts;
    newPerformance.overall.successRate =
      (newPerformance.overall.successfulAttempts / newPerformance.overall.totalAttempts) * 100;

    // Update by type
    const challengeType = challenge.type || "pronunciation";
    if (newPerformance.byType[challengeType]) {
      const typeStats = newPerformance.byType[challengeType];
      typeStats.attempts += 1;
      if (passed) typeStats.successes += 1;
      typeStats.totalScore += normalizedScore;
      typeStats.avgScore = typeStats.totalScore / typeStats.attempts;
    }

    // Update by topic
    const challengeTopic = challenge.topic || "social";
    if (newPerformance.byTopic[challengeTopic]) {
      const topicStats = newPerformance.byTopic[challengeTopic];
      topicStats.attempts += 1;
      if (passed) topicStats.successes += 1;
      topicStats.totalScore += normalizedScore;
      topicStats.avgScore = topicStats.totalScore / topicStats.attempts;
    } else {
      // Create new topic entry if it doesn't exist
      newPerformance.byTopic[challengeTopic] = {
        attempts: 1,
        successes: passed ? 1 : 0,
        avgScore: normalizedScore,
        totalScore: normalizedScore,
      };
    }

    // Update by level
    const challengeLevel = challenge.level || "beginner";
    if (newPerformance.byLevel[challengeLevel]) {
      const levelStats = newPerformance.byLevel[challengeLevel];
      levelStats.attempts += 1;
      if (passed) levelStats.successes += 1;
      levelStats.totalScore += normalizedScore;
      levelStats.avgScore = levelStats.totalScore / levelStats.attempts;
    }

    // Update last five scores
    newPerformance.lastFiveScores.push(normalizedScore);
    if (newPerformance.lastFiveScores.length > 5) {
      newPerformance.lastFiveScores.shift();
    }

    // Update recent challenges (keep last 20)
    if (challenge.id) {
      newPerformance.recentChallenges.push(challenge.id);
      if (newPerformance.recentChallenges.length > 20) {
        newPerformance.recentChallenges.shift();
      }
    }

    // Calculate trend
    newPerformance.recentTrend = calculateTrend(newPerformance.lastFiveScores);

    // Adjust effective level based on performance
    newPerformance.effectiveLevel = adjustEffectiveLevel(newPerformance);

    // Save updated performance
    await savePerformance(newPerformance);

    console.log("Performance updated:", {
      challenge: challenge.id,
      score: normalizedScore,
      passed,
      newTrend: newPerformance.recentTrend,
      effectiveLevel: newPerformance.effectiveLevel,
    });
  };

  // Reset performance data (for testing or new user)
  const resetPerformance = async () => {
    const profileStr = await AsyncStorage.getItem("userProfile");
    const userProfile = profileStr ? JSON.parse(profileStr) : null;
    const defaultPerf = createDefaultPerformance(userProfile);
    await savePerformance(defaultPerf);
    console.log("Performance data reset");
  };

  // Load performance on mount and when user changes
  useEffect(() => {
    loadPerformance();
  }, [user?.uid]);

  const value = {
    performance,
    loading,
    updatePerformance,
    loadPerformance,
    resetPerformance,
    calculateTrend,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Alert } from "react-native";
import challengesSeed from "../data/challenges.json";
import { api } from "../services/api";
import { USE_MOCK } from "../../shared/config/endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import {
  filterChallengesByProfile,
  scoreChallenges,
  getRecommendedChallenges,
  getWeakAreas,
  getStrengths,
} from "../services/challengeFilter";

const ChallengeContext = createContext();
export const useChallenges = () => useContext(ChallengeContext);

export function ChallengeProvider({ children }) {
  const [challenges, setChallenges] = useState({ daily: [], weekly: [], monthly: [] });
  const [filteredChallenges, setFilteredChallenges] = useState({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  // CEFR-specific state
  const [todaysChallenges, setTodaysChallenges] = useState(null);
  const [userProgress, setUserProgress] = useState(null);

  // Load user profile from AsyncStorage
  const loadUserProfile = async () => {
    try {
      const profileStr = await AsyncStorage.getItem("userProfile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserProfile(profile);
        console.log("User profile loaded for filtering:", profile);
        return profile;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
    return null;
  };

  // Load performance data from AsyncStorage
  const loadPerformanceData = async () => {
    try {
      const perfStr = await AsyncStorage.getItem("userPerformance");
      if (perfStr) {
        const perf = JSON.parse(perfStr);
        setPerformanceData(perf);
        console.log("Performance data loaded for filtering:", perf);
        return perf;
      }
    } catch (error) {
      console.error("Error loading performance data:", error);
    }
    return null;
  };

  // Apply filtering and scoring to challenges
  const applyFiltering = useCallback((rawChallenges, profile, performance) => {
    if (!rawChallenges) return { daily: [], weekly: [], monthly: [] };

    const filtered = {
      daily: getRecommendedChallenges(rawChallenges.daily || [], profile, performance),
      weekly: getRecommendedChallenges(rawChallenges.weekly || [], profile, performance),
      monthly: getRecommendedChallenges(rawChallenges.monthly || [], profile, performance),
    };

    console.log("Challenges filtered and scored:", {
      daily: filtered.daily.length,
      weekly: filtered.weekly.length,
      monthly: filtered.monthly.length,
    });

    return filtered;
  }, []);

  // Get top recommended challenges
  const getTopRecommendations = useCallback((count = 3) => {
    const allChallenges = [
      ...filteredChallenges.daily,
      ...filteredChallenges.weekly,
      ...filteredChallenges.monthly,
    ];

    return allChallenges
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, count);
  }, [filteredChallenges]);

  // Get weak areas for the user
  const getUserWeakAreas = useCallback(() => {
    return getWeakAreas(performanceData);
  }, [performanceData]);

  // Get user strengths
  const getUserStrengths = useCallback(() => {
    return getStrengths(performanceData);
  }, [performanceData]);

  // Refresh filtering (call when performance data changes)
  const refreshFiltering = useCallback(async () => {
    const profile = await loadUserProfile();
    const performance = await loadPerformanceData();
    const filtered = applyFiltering(challenges, profile, performance);
    setFilteredChallenges(filtered);
  }, [challenges, applyFiltering]);

  // ===== CEFR METHODS =====

  // Load today's challenges from backend
  const loadTodaysChallenges = useCallback(async (token) => {
    if (!token) {
      console.warn("No token provided to loadTodaysChallenges");
      return;
    }

    try {
      setLoading(true);
      const data = await api.getTodaysChallenges(token);
      setTodaysChallenges(data);
      console.log("Today's challenges loaded:", data);
    } catch (error) {
      console.error("Failed to load today's challenges:", error);
      Alert.alert("Error", "Failed to load today's challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user CEFR progress
  const loadUserProgress = useCallback(async (token) => {
    if (!token) {
      console.warn("No token provided to loadUserProgress");
      return;
    }

    try {
      const data = await api.getUserProgress(token);
      setUserProgress(data);
      console.log("User progress loaded:", data);
    } catch (error) {
      console.error("Failed to load user progress:", error);
      // Set default state to prevent TypeErrors when accessing properties
      setUserProgress({
        current_level: 'A1',
        progress: {
          A1: {
            name: 'Beginner',
            completed: 0,
            required: 20,
            percentage: 0,
            unlocked: true,
            is_current: true
          }
        },
        recent_completions: []
      });
    }
  }, []);

  // Submit challenge answer (listening, fill_blank, multiple_choice)
  const submitChallenge = useCallback(async (token, challengeId, userAnswer) => {
    if (!token) throw new Error("Authentication required");

    try {
      const result = await api.submitChallengeAnswer(token, challengeId, userAnswer);

      // Reload today's challenges to update completion status
      await loadTodaysChallenges(token);

      // Show level-up notification if applicable
      if (result.level_up) {
        Alert.alert(
          'Level Up! 🎉',
          `Congratulations! You've advanced to ${result.new_level}!`,
          [{ text: 'Awesome!', onPress: () => {} }]
        );
      }

      return result;
    } catch (error) {
      console.error("Failed to submit challenge:", error);
      throw error;
    }
  }, [loadTodaysChallenges]);

  // Submit IRL challenge with photo
  const submitIRLChallenge = useCallback(async (token, challengeId, photoUri, options = {}) => {
    if (!token) throw new Error("Authentication required");
    if (!photoUri) throw new Error("Photo required");

    try {
      // Convert photo URI to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoBase64 = `data:image/jpeg;base64,${base64}`;

      const result = await api.submitIRLChallenge(token, challengeId, photoBase64, options);

      // Reload challenges
      await loadTodaysChallenges(token);

      // Show level-up notification if applicable
      if (result.level_up) {
        Alert.alert(
          'Level Up! 🎉',
          `Congratulations! You've advanced to ${result.new_level}!`,
          [{ text: 'Awesome!', onPress: () => {} }]
        );
      }

      return result;
    } catch (error) {
      console.error("Failed to submit IRL challenge:", error);
      throw error;
    }
  }, [loadTodaysChallenges]);

  useEffect(() => {
    const loadChallenges = async () => {
      setLoading(true);

      // Load user profile and performance data first
      const profile = await loadUserProfile();
      const performance = await loadPerformanceData();

      let rawChallenges;

      if (USE_MOCK) {
        // Use local mock data
        console.log("Loading challenges from local mock data");
        rawChallenges = challengesSeed;
      } else {
        // Fetch from backend
        console.log("Fetching challenges from backend API...");
        try {
          const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
            api.fetchDailyChallenges(),
            api.fetchWeeklyChallenges(),
            api.fetchMonthlyChallenges()
          ]);

          rawChallenges = {
            daily: dailyRes.challenges || [],
            weekly: weeklyRes.challenges || [],
            monthly: monthlyRes.challenges || []
          };
          console.log("Successfully loaded challenges from backend");
        } catch (error) {
          console.error("Failed to fetch challenges from backend:", error);
          // Fallback to local data on error
          console.warn("Falling back to local challenge data");
          rawChallenges = challengesSeed;
        }
      }

      setChallenges(rawChallenges);

      // Apply filtering and scoring
      const filtered = applyFiltering(rawChallenges, profile, performance);
      setFilteredChallenges(filtered);

      setLoading(false);
    };

    loadChallenges();
  }, [applyFiltering]);

  const value = {
    // Provide filtered challenges as the main challenges
    challenges: filteredChallenges,
    // Also provide raw challenges if needed
    rawChallenges: challenges,
    loading,
    setChallenges,
    userProfile,
    performanceData,
    // Helper functions
    getTopRecommendations,
    getUserWeakAreas,
    getUserStrengths,
    refreshFiltering,
    loadUserProfile,
    loadPerformanceData,

    // CEFR state and methods
    todaysChallenges,
    userProgress,
    loadTodaysChallenges,
    loadUserProgress,
    submitChallenge,
    submitIRLChallenge,
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

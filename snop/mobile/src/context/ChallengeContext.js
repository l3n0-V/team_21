import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import challengesSeed from "../data/challenges.json";
import { api } from "../services/api";
import { USE_MOCK } from "../../shared/config/endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

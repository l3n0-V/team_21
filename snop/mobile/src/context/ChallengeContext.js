import React, { createContext, useContext, useEffect, useState } from "react";
import challengesSeed from "../data/challenges.json";
import { api } from "../services/api";
import { USE_MOCK } from "../../shared/config/endpoints";

const ChallengeContext = createContext();
export const useChallenges = () => useContext(ChallengeContext);

export function ChallengeProvider({ children }) {
  const [challenges, setChallenges] = useState({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenges = async () => {
      setLoading(true);

      if (USE_MOCK) {
        // Use local mock data
        console.log("Loading challenges from local mock data");
        setChallenges(challengesSeed);
        setLoading(false);
        return;
      }

      // Fetch from backend
      console.log("Fetching challenges from backend API...");
      try {
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          api.fetchDailyChallenges(),
          api.fetchWeeklyChallenges(),
          api.fetchMonthlyChallenges()
        ]);

        setChallenges({
          daily: dailyRes.challenges || [],
          weekly: weeklyRes.challenges || [],
          monthly: monthlyRes.challenges || []
        });
        console.log("Successfully loaded challenges from backend");
      } catch (error) {
        console.error("Failed to fetch challenges from backend:", error);
        // Fallback to local data on error
        console.warn("Falling back to local challenge data");
        setChallenges(challengesSeed);
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const value = { challenges, loading, setChallenges };
  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

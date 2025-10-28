import React, { createContext, useContext, useEffect, useState } from "react";
import challengesSeed from "../data/challenges.json";

const ChallengeContext = createContext();
export const useChallenges = () => useContext(ChallengeContext);

export function ChallengeProvider({ children }) {
  const [challenges, setChallenges] = useState({ daily: [], weekly: [], monthly: [] });

  useEffect(() => {
    // seed local data for now
    setChallenges(challengesSeed);
  }, []);

  const value = { challenges, setChallenges };
  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

const UserStatsContext = createContext();
export const useUserStats = () => useContext(UserStatsContext);

export function UserStatsProvider({ children }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    xp_total: 0,
    streak_days: 0,
    last_attempt_at: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!token || !user) {
      console.log('No user/token, skipping stats fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching user stats...');
      const data = await api.getUserStats(token);
      console.log('User stats received:', data);
      setStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message);
      // Keep previous stats on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount and when user/token changes
  useEffect(() => {
    fetchStats();
  }, [user, token]);

  // Function to refresh stats (call after completing a challenge)
  const refreshStats = () => {
    fetchStats();
  };

  const value = {
    stats,
    loading,
    error,
    refreshStats
  };

  return (
    <UserStatsContext.Provider value={value}>
      {children}
    </UserStatsContext.Provider>
  );
}

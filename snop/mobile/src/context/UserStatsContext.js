import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { USE_MOCK, API_BASE_URL } from "../../shared/config/endpoints";

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
      if (USE_MOCK) {
        // Mock stats for testing
        console.log('Using mock user stats');
        await new Promise(resolve => setTimeout(resolve, 500));
        setStats({
          xp_total: 245,
          streak_days: 7,
          last_attempt_at: new Date().toISOString()
        });
        return;
      }

      // Fetch real stats from backend
      console.log('Fetching user stats from backend...');
      const response = await fetch(`${API_BASE_URL}/userStats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
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

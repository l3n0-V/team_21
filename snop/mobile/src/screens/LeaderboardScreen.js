import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK, API_BASE_URL } from "../../shared/config/endpoints";

export default function LeaderboardScreen() {
  const { user, token } = useAuth();
  const [period, setPeriod] = useState('weekly');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (USE_MOCK) {
        // Mock leaderboard data
        console.log('Using mock leaderboard data');
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockData = {
          period,
          top: [
            { uid: 'user1', name: 'Sarah Chen', xp: 485 },
            { uid: 'user2', name: 'Mike Johnson', xp: 420 },
            { uid: 'test-user-001', name: 'Test User', xp: 245 },
            { uid: 'user3', name: 'Emma Davis', xp: 210 },
            { uid: 'user4', name: 'Alex Kim', xp: 195 },
            { uid: 'user5', name: 'Chris Martinez', xp: 180 },
            { uid: 'user6', name: 'Jessica Lee', xp: 165 },
            { uid: 'user7', name: 'David Brown', xp: 150 },
            { uid: 'user8', name: 'Sophia White', xp: 135 },
            { uid: 'user9', name: 'Ryan Taylor', xp: 120 }
          ]
        };

        setLeaderboard(mockData.top);
        return;
      }

      // Fetch real leaderboard from backend
      console.log(`Fetching ${period} leaderboard from backend...`);
      const response = await fetch(`${API_BASE_URL}/leaderboard?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      console.log('Leaderboard received:', data);
      setLeaderboard(data.top || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const onRefresh = () => {
    fetchLeaderboard(true);
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const isCurrentUser = item.uid === user?.uid;

    // Medal emojis for top 3
    const getMedal = (rank) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `#${rank}`;
    };

    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankText,
            rank <= 3 && styles.topRankText
          ]}>
            {getMedal(rank)}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            isCurrentUser && styles.currentUserName
          ]}>
            {item.name}
            {isCurrentUser && ' (You)'}
          </Text>
        </View>

        <Text style={styles.xpText}>{item.xp} XP</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['daily', 'weekly', 'monthly', 'all-time'].map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={({ pressed }) => [
                styles.periodButton,
                period === p && styles.periodButtonActive,
                pressed && { opacity: 0.6 }
              ]}
            >
              <Text style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load leaderboard</Text>
          <Pressable onPress={() => fetchLeaderboard()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No rankings yet</Text>
          <Text style={styles.emptySubtext}>Complete challenges to appear on the leaderboard!</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#111827"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  periodButtonActive: {
    backgroundColor: '#111827'
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280'
  },
  periodButtonTextActive: {
    color: '#ffffff'
  },
  listContent: {
    padding: 16
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  currentUserItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 2
  },
  rankContainer: {
    width: 50,
    alignItems: 'center'
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280'
  },
  topRankText: {
    fontSize: 24
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  currentUserName: {
    color: '#2563eb',
    fontWeight: '800'
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16
  },
  retryButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  }
});

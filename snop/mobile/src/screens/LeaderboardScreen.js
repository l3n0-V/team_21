import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK, API_BASE_URL } from "../../shared/config/endpoints";
import { colors, shadows } from "../styles/colors";

export default function LeaderboardScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
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

    // Medal colors for top 3
    const getMedalStyle = (rank) => {
      if (rank === 1) return { backgroundColor: colors.gold, text: '1ST' };
      if (rank === 2) return { backgroundColor: colors.silver, text: '2ND' };
      if (rank === 3) return { backgroundColor: colors.bronze, text: '3RD' };
      return { backgroundColor: colors.backgroundTertiary, text: `#${rank}` };
    };

    const medalStyle = getMedalStyle(rank);

    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={[
          styles.rankContainer,
          rank <= 3 && { backgroundColor: medalStyle.backgroundColor }
        ]}>
          <Text style={[
            styles.rankText,
            rank <= 3 && styles.topRankText
          ]}>
            {medalStyle.text}
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

        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{item.xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, "#003580"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Toppliste</Text>
        <Text style={styles.subtitle}>Konkurrer med andre brukere</Text>
      </LinearGradient>

      <View style={styles.header}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['daily', 'weekly', 'monthly', 'all-time'].map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={({ pressed }) => [
                styles.periodButton,
                period === p && styles.periodButtonActive,
                pressed && { opacity: 0.7 }
              ]}
            >
              <Text style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive
              ]}>
                {p === 'daily' ? 'Dag' : p === 'weekly' ? 'Uke' : p === 'monthly' ? 'Måned' : 'Totalt'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
              tintColor={colors.primary}
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
    backgroundColor: colors.background,
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
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  periodButtonTextActive: {
    color: colors.textWhite,
  },
  listContent: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  currentUserItem: {
    backgroundColor: colors.backgroundAccent,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  rankContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  topRankText: {
    fontSize: 14,
    color: colors.textWhite,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  currentUserName: {
    color: colors.primary,
    fontWeight: '800',
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    ...shadows.small,
  },
  retryButtonText: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

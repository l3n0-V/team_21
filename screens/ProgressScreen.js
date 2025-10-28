import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getStats, getCompletedChallenges, clearAllData } from '../utils/storage';

const ProgressScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalPoints: 0,
    dailyCompleted: 0,
    weeklyCompleted: 0,
    monthlyCompleted: 0
  });
  const [recentChallenges, setRecentChallenges] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });

    loadProgress();

    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const userStats = await getStats();
    setStats(userStats);

    const completed = await getCompletedChallenges();
    // Get last 5 completed challenges
    const recent = completed.slice(-5).reverse();
    setRecentChallenges(recent);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Progress?',
      'This will delete all your completed challenges and points. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            loadProgress();
            Alert.alert('Success', 'All progress has been reset.');
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Total Points</Text>
        <Text style={styles.pointsValue}>🏆 {stats.totalPoints}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalCompleted}</Text>
          <Text style={styles.statLabel}>Total Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.dailyCompleted}</Text>
          <Text style={styles.statLabel}>Daily</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.weeklyCompleted}</Text>
          <Text style={styles.statLabel}>Weekly</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.monthlyCompleted}</Text>
          <Text style={styles.statLabel}>Monthly</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Completions</Text>
        {recentChallenges.length > 0 ? (
          recentChallenges.map((challenge, index) => (
            <View key={index} style={styles.recentCard}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>{challenge.title}</Text>
                <Text style={styles.recentPoints}>+{challenge.points}</Text>
              </View>
              <Text style={styles.recentDate}>{formatDate(challenge.completedAt)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No completed challenges yet</Text>
            <Text style={styles.emptySubtext}>Start your learning journey today!</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset All Progress</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsCard: {
    backgroundColor: '#FF9800',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '46%',
    backgroundColor: '#fff',
    margin: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recentPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  resetButton: {
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default ProgressScreen;

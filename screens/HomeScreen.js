import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import ChallengeCard from '../components/ChallengeCard';
import { getRandomChallenge, CHALLENGE_TYPES } from '../data/challenges';
import { getCurrentChallenges, setCurrentChallenges, completeChallenge, isChallengeCompleted } from '../utils/storage';

const HomeScreen = () => {
  const [challenges, setChallenges] = useState({
    daily: null,
    weekly: null,
    monthly: null
  });
  const [completedStatus, setCompletedStatus] = useState({
    daily: false,
    weekly: false,
    monthly: false
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    let current = await getCurrentChallenges();
    
    // Initialize challenges if they don't exist
    if (!current.daily) {
      current.daily = getRandomChallenge(CHALLENGE_TYPES.DAILY);
    }
    if (!current.weekly) {
      current.weekly = getRandomChallenge(CHALLENGE_TYPES.WEEKLY);
    }
    if (!current.monthly) {
      current.monthly = getRandomChallenge(CHALLENGE_TYPES.MONTHLY);
    }
    
    await setCurrentChallenges(current);
    setChallenges(current);
    
    // Check completed status
    const dailyCompleted = await isChallengeCompleted(current.daily.id);
    const weeklyCompleted = await isChallengeCompleted(current.weekly.id);
    const monthlyCompleted = await isChallengeCompleted(current.monthly.id);
    
    setCompletedStatus({
      daily: dailyCompleted,
      weekly: weeklyCompleted,
      monthly: monthlyCompleted
    });
  };

  const handleChallengePress = (challenge, type) => {
    Alert.alert(
      'Complete Challenge?',
      `Did you complete "${challenge.title}"?\n\nYou'll earn ${challenge.points} points!`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I Did It!',
          onPress: async () => {
            const success = await completeChallenge(challenge);
            if (success) {
              Alert.alert('Congratulations! 🎉', `You earned ${challenge.points} points!`);
              setCompletedStatus(prev => ({ ...prev, [type]: true }));
            }
          }
        }
      ]
    );
  };

  const refreshChallenge = async (type) => {
    Alert.alert(
      'Get New Challenge?',
      'This will give you a new random challenge.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get New Challenge',
          onPress: async () => {
            const newChallenge = getRandomChallenge(CHALLENGE_TYPES[type.toUpperCase()]);
            const updatedChallenges = { ...challenges, [type]: newChallenge };
            await setCurrentChallenges(updatedChallenges);
            setChallenges(updatedChallenges);
            setCompletedStatus(prev => ({ ...prev, [type]: false }));
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lær Norsk! 🇳🇴</Text>
        <Text style={styles.headerSubtitle}>Learn Norwegian by talking to people</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Daily Challenge</Text>
          <TouchableOpacity onPress={() => refreshChallenge('daily')}>
            <Text style={styles.refreshButton}>🔄 New</Text>
          </TouchableOpacity>
        </View>
        {challenges.daily && (
          <ChallengeCard
            challenge={challenges.daily}
            onPress={() => handleChallengePress(challenges.daily, 'daily')}
            completed={completedStatus.daily}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📆 Weekly Challenge</Text>
          <TouchableOpacity onPress={() => refreshChallenge('weekly')}>
            <Text style={styles.refreshButton}>🔄 New</Text>
          </TouchableOpacity>
        </View>
        {challenges.weekly && (
          <ChallengeCard
            challenge={challenges.weekly}
            onPress={() => handleChallengePress(challenges.weekly, 'weekly')}
            completed={completedStatus.weekly}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🗓️ Monthly Challenge</Text>
          <TouchableOpacity onPress={() => refreshChallenge('monthly')}>
            <Text style={styles.refreshButton}>🔄 New</Text>
          </TouchableOpacity>
        </View>
        {challenges.monthly && (
          <ChallengeCard
            challenge={challenges.monthly}
            onPress={() => handleChallengePress(challenges.monthly, 'monthly')}
            completed={completedStatus.monthly}
          />
        )}
      </View>

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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default HomeScreen;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SwipeableCard from '../components/SwipeableCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TodayScreen() {
  const navigation = useNavigation();
  const { todaysChallenges, userProgress, loadTodaysChallenges, loadUserProgress, loading } = useChallenges();
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadTodaysChallenges(token),
        loadUserProgress(token)
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };
  const [viewedChallenges, setViewedChallenges] = useState({
    irl: new Set(),
    listening: new Set(),
    fill_blank: new Set(),
    multiple_choice: new Set(),
    pronunciation: new Set()
  });

  useEffect(() => {
    if (token) {
      loadTodaysChallenges(token);
      loadUserProgress(token);
    }
  }, [token]);

  // Set featured challenges when todaysChallenges loads
  useEffect(() => {
    if (todaysChallenges && todaysChallenges.challenges) {
      // Get all available challenges across all types
      const allChallenges = [];
      Object.values(todaysChallenges.challenges).forEach(typeData => {
        if (typeData?.available && typeData.can_complete_more) {
          allChallenges.push(...typeData.available.filter(c => !c.completed));
        }
      });

      // Take first 5 as featured challenges
      setFeaturedChallenges(allChallenges.slice(0, 5));
      setCurrentCardIndex(0);
    }
  }, [todaysChallenges]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            Please log in to view today's challenges
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !todaysChallenges) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading today's challenges...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleChallengePress = (challenge) => {
    // Mark challenge as viewed
    if (challenge && challenge.type && challenge.id) {
      setViewedChallenges(prev => {
        const newViewed = { ...prev };
        newViewed[challenge.type] = new Set(prev[challenge.type]).add(challenge.id);
        return newViewed;
      });
    }

    // Navigate to appropriate screen based on challenge type
    switch (challenge.type) {
      case 'listening':
        navigation.navigate('ListeningChallenge', { challenge });
        break;
      case 'fill_blank':
        navigation.navigate('FillBlankChallenge', { challenge });
        break;
      case 'multiple_choice':
        navigation.navigate('MultipleChoiceChallenge', { challenge });
        break;
      case 'irl':
        navigation.navigate('IRLChallenge', { challenge });
        break;
      case 'pronunciation':
        navigation.navigate('DailyPractice', { challenge });
        break;
      default:
        console.warn('Unknown challenge type:', challenge.type);
    }
  };

  const handleSwipeLeft = (challenge) => {
    // Skip challenge - move to next
    if (currentCardIndex < featuredChallenges.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handleSwipeRight = (challenge) => {
    // Accept challenge - navigate to it
    handleChallengePress(challenge);
  };

  const renderProgressBar = (completed, required) => {
    const percentage = Math.min((completed / required) * 100, 100);
    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.primary, width: `${percentage}%` }
          ]}
        />
      </View>
    );
  };

  const renderQuickOverview = (title, icon, typeData, challengeType) => {
    if (!typeData) return null;

    const { completed_today = 0, limit = 0, can_complete_more } = typeData;
    const displayLimit = 3; // Show daily goal of 3
    const isComplete = completed_today >= displayLimit;
    const percentage = Math.min((completed_today / displayLimit) * 100, 100);

    // Filter out already viewed challenges
    const unviewedChallenges = (typeData.available || []).filter(challenge => {
      return !viewedChallenges[challengeType]?.has(challenge.id);
    });

    // Get next unviewed challenge, or fallback to first if all have been viewed
    const nextChallenge = unviewedChallenges.length > 0
      ? unviewedChallenges[0]
      : typeData.available?.[0];

    return (
      <TouchableOpacity
        key={title}
        style={[
          styles.overviewCard,
          {
            backgroundColor: isComplete ? colors.success + '20' : colors.backgroundSecondary,
            borderColor: isComplete ? colors.success : colors.border,
          },
        ]}
        onPress={() => {
          // Show next unviewed challenge of this type
          if (nextChallenge) {
            handleChallengePress(nextChallenge);
          }
        }}
        disabled={!nextChallenge}
      >
        <Text style={styles.overviewIcon}>{icon}</Text>
        <Text style={[styles.overviewTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.overviewProgress, { color: colors.textSecondary }]}>
          {completed_today}/{displayLimit}
        </Text>
        {isComplete && (
          <View style={[styles.completeBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.completeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate total progress for today
  const calculateTodayProgress = () => {
    if (!todaysChallenges?.challenges) return { completed: 0, total: 0, percentage: 0 };

    const displayLimit = 3; // Daily goal per challenge type
    let totalCompleted = 0;
    const challengeTypes = ['irl', 'listening', 'fill_blank', 'multiple_choice'];
    const totalGoal = challengeTypes.length * displayLimit; // 4 types × 3 = 12

    Object.values(todaysChallenges.challenges).forEach(typeData => {
      if (typeData) {
        totalCompleted += typeData.completed_today || 0;
      }
    });

    const percentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;
    return { completed: totalCompleted, total: totalGoal, percentage };
  };

  const todayProgress = calculateTodayProgress();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Today's Challenges
          </Text>
          <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Today's Progress Summary */}
        <View style={[styles.progressSummary, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <View style={styles.progressSummaryHeader}>
            <Text style={[styles.progressSummaryTitle, { color: colors.textPrimary }]}>
              Today's Progress
            </Text>
            <Text style={[styles.progressSummaryValue, { color: colors.primary }]}>
              {todayProgress.completed}/{todayProgress.total}
            </Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.primary, width: `${todayProgress.percentage}%` }
              ]}
            />
          </View>
          <Text style={[styles.progressSummarySubtext, { color: colors.textSecondary }]}>
            {todayProgress.percentage}% completed
          </Text>
        </View>

        {/* Featured Challenge Card */}
        {featuredChallenges.length > 0 && currentCardIndex < featuredChallenges.length && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              FEATURED CHALLENGE
            </Text>
            <View style={styles.cardContainer}>
              <SwipeableCard
                challenge={featuredChallenges[currentCardIndex]}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onPress={() => handleChallengePress(featuredChallenges[currentCardIndex])}
              />
            </View>
          </View>
        )}

        {/* Quick Overview */}
        <View style={styles.overviewSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            QUICK OVERVIEW
          </Text>
          {todaysChallenges && todaysChallenges.challenges && (
            <View style={styles.overviewGrid}>
              {renderQuickOverview('IRL', '🎯', todaysChallenges.challenges.irl, 'irl')}
              {renderQuickOverview('Listening', '🎧', todaysChallenges.challenges.listening, 'listening')}
              {renderQuickOverview('Fill Blank', '✏️', todaysChallenges.challenges.fill_blank, 'fill_blank')}
              {renderQuickOverview('Multiple Choice', '📝', todaysChallenges.challenges.multiple_choice, 'multiple_choice')}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
  },
  progressSummary: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  progressSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressSummaryValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressSummarySubtext: {
    fontSize: 12,
    marginTop: 8,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  featuredSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  cardContainer: {
    height: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewSection: {
    marginBottom: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    position: 'relative',
  },
  overviewIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  overviewProgress: {
    fontSize: 12,
  },
  completeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

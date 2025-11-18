import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChallenges } from '../context/ChallengeContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function TodayScreen() {
  const navigation = useNavigation();
  const { todaysChallenges, userProgress, loadTodaysChallenges, loadUserProgress, loading } = useChallenges();
  const { token, user } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (token) {
      loadTodaysChallenges(token);
      loadUserProgress(token);
    }
  }, [token]);

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

  const renderChallengeTypeSection = (title, icon, typeData, typeKey) => {
    if (!typeData || !typeData.available || typeData.available.length === 0) {
      return null;
    }

    const { available, completed_today, limit, can_complete_more } = typeData;
    const isLimitReached = limit > 0 && !can_complete_more;

    return (
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <View style={styles.sectionHeaderText}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.completionText, { color: colors.textSecondary }]}>
              {completed_today}/{limit === -1 ? '∞' : limit} today
            </Text>
          </View>
        </View>

        {limit > 0 && renderProgressBar(completed_today, limit)}

        {isLimitReached ? (
          <View style={[styles.limitReachedContainer, { backgroundColor: colors.warning + '20' }]}>
            <Text style={[styles.limitReachedText, { color: colors.warning }]}>
              ✓ Complete! Come back tomorrow
            </Text>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {available.slice(0, 3).map((challenge, index) => (
              <TouchableOpacity
                key={challenge.id || index}
                style={[styles.challengeCard, { borderColor: colors.border }]}
                onPress={() => handleChallengePress(challenge)}
              >
                <View style={styles.challengeCardContent}>
                  <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>
                    {challenge.title_no || challenge.title}
                  </Text>
                  {challenge.title_no && challenge.title && (
                    <Text style={[styles.challengeSubtitle, { color: colors.textSecondary }]}>
                      {challenge.title}
                    </Text>
                  )}
                </View>
                <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
              </TouchableOpacity>
            ))}
            {available.length > 3 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{available.length - 3} more available
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            📅 Today's Challenges
          </Text>
          <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* User Progress Card */}
        {userProgress && (
          <View style={[styles.progressCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.progressCardTitle}>
              🏆 Your Level: {userProgress.current_level} {userProgress.progress[userProgress.current_level]?.name}
            </Text>
            {userProgress.progress[userProgress.current_level] && (
              <>
                <Text style={styles.progressCardSubtitle}>
                  Progress: {userProgress.progress[userProgress.current_level].completed}/
                  {userProgress.progress[userProgress.current_level].required} ({userProgress.progress[userProgress.current_level].percentage}%)
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: '#FFF', width: `${userProgress.progress[userProgress.current_level].percentage}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressCardNext}>
                  → Next: {Object.keys(userProgress.progress).find(key =>
                    userProgress.progress[key].percentage === 0 &&
                    !userProgress.progress[key].is_current
                  )} {Object.values(userProgress.progress).find(level =>
                    level.percentage === 0 &&
                    !level.is_current
                  )?.name || 'Mastery'}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Challenge Sections */}
        {todaysChallenges && todaysChallenges.challenges && (
          <>
            {renderChallengeTypeSection('IRL Challenge', '🎯', todaysChallenges.challenges.irl, 'irl')}
            {renderChallengeTypeSection('Listening', '🎧', todaysChallenges.challenges.listening, 'listening')}
            {renderChallengeTypeSection('Fill the Blank', '✏️', todaysChallenges.challenges.fill_blank, 'fill_blank')}
            {renderChallengeTypeSection('Multiple Choice', '📝', todaysChallenges.challenges.multiple_choice, 'multiple_choice')}
          </>
        )}
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
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  progressCardSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  progressCardNext: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  completionText: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  limitReachedContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  limitReachedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengesList: {
    gap: 8,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  challengeCardContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeSubtitle: {
    fontSize: 12,
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
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

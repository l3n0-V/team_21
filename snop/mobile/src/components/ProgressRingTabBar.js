import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from './ProgressRing';
import { useTheme } from '../context/ThemeContext';
import { useChallenges } from '../context/ChallengeContext';

/**
 * ProgressRingTabBar - Custom tab bar with progress rings around each icon
 *
 * Replaces the default React Navigation bottom tab bar
 */
export default function ProgressRingTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const { todaysChallenges, userProgress } = useChallenges();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        // Get progress percentage for each tab
        const progress = getProgressForRoute(route.name, todaysChallenges, userProgress);

        // Get icon name for each tab
        const iconName = getIconForRoute(route.name, isFocused);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {/* Progress Ring with Icon Inside */}
            <View style={styles.iconContainer}>
              <ProgressRing
                percentage={progress}
                size={48}
                strokeWidth={3}
                animate={true}
              />
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? colors.primary : colors.textSecondary,
                  fontWeight: isFocused ? '600' : '400',
                },
              ]}
            >
              {label}
            </Text>

            {/* Optional: Show percentage text */}
            {progress > 0 && (
              <Text style={[styles.percentage, { color: colors.textSecondary }]}>
                {Math.round(progress)}%
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Get progress percentage for each route based on real data
 *
 * @param {string} routeName - The name of the route (Today, Stats, Leaderboard, Settings)
 * @param {object} todaysChallenges - Today's challenges from ChallengeContext
 * @param {object} userProgress - User's CEFR progress from ChallengeContext
 * @returns {number} Progress percentage (0-100)
 */
function getProgressForRoute(routeName, todaysChallenges, userProgress) {
  if (routeName === 'Today') {
    // Calculate today's completion percentage
    if (!todaysChallenges) return 0;

    let totalChallenges = 0;
    let completedChallenges = 0;

    // Count all challenges across all types
    Object.keys(todaysChallenges).forEach(type => {
      const challengeList = todaysChallenges[type] || [];
      totalChallenges += challengeList.length;
      completedChallenges += challengeList.filter(c => c.completed).length;
    });

    if (totalChallenges === 0) return 0;
    return Math.round((completedChallenges / totalChallenges) * 100);
  }

  if (routeName === 'Stats') {
    // Use current CEFR level progress percentage
    if (!userProgress || !userProgress.progress || !userProgress.current_level) return 0;

    const currentLevelProgress = userProgress.progress[userProgress.current_level];
    return currentLevelProgress?.percentage || 0;
  }

  if (routeName === 'Leaderboard') {
    // TO DO: Calculate from leaderboard rank percentile when available
    return 0;
  }

  if (routeName === 'Settings') {
    // No progress for settings
    return 0;
  }

  return 0;
}

/**
 * Get icon name for each route
 */
function getIconForRoute(routeName, isFocused) {
  const iconMap = {
    Today: isFocused ? 'calendar' : 'calendar-outline',
    Stats: isFocused ? 'stats-chart' : 'stats-chart-outline',
    Leaderboard: isFocused ? 'trophy' : 'trophy-outline',
    Settings: isFocused ? 'settings' : 'settings-outline',
  };

  return iconMap[routeName] || 'help-circle-outline';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
  percentage: {
    fontSize: 9,
    marginTop: 2,
  },
});

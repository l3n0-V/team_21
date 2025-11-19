import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

/**
 * SwipeableCard - A swipeable card component for challenges
 *
 * @param {object} challenge - Challenge data
 * @param {function} onSwipeLeft - Callback when swiped left
 * @param {function} onSwipeRight - Callback when swiped right
 * @param {function} onPress - Callback when card is pressed
 */
export default function SwipeableCard({ challenge, onSwipeLeft, onSwipeRight, onPress }) {
  const { colors } = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left
          forceSwipe('left');
        } else {
          // Reset position
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipeComplete(direction);
    });
  };

  const onSwipeComplete = (direction) => {
    if (direction === 'right' && onSwipeRight) {
      onSwipeRight(challenge);
    } else if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft(challenge);
    }
    position.setValue({ x: 0, y: 0 });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (challenge.difficulty?.toLowerCase()) {
      case 'easy':
        return colors.difficultyEasy || colors.success;
      case 'medium':
        return colors.difficultyMedium || colors.warning;
      case 'hard':
        return colors.difficultyHard || colors.error;
      default:
        return colors.primary;
    }
  };

  // Get challenge type icon
  const getTypeIcon = () => {
    switch (challenge.type) {
      case 'irl':
        return '📸';
      case 'listening':
        return '👂';
      case 'fill_blank':
        return '✍️';
      case 'multiple_choice':
        return '☑️';
      case 'pronunciation':
        return '🗣️';
      default:
        return '📝';
    }
  };

  return (
    <Animated.View
      style={[styles.card, getCardStyle()]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={[
          styles.cardInner,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: getDifficultyColor(),
          },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>{getTypeIcon()}</Text>
            <Text style={[styles.typeText, { color: colors.textSecondary }]}>
              {challenge.type?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor() },
            ]}
          >
            <Text style={styles.difficultyText}>
              {challenge.difficulty?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {challenge.title || challenge.description}
          </Text>

          {challenge.prompt && (
            <Text style={[styles.prompt, { color: colors.textSecondary }]}>
              {challenge.prompt}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          {challenge.cefr_level && (
            <View style={[styles.cefrBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.cefrText}>{challenge.cefr_level}</Text>
            </View>
          )}

          {challenge.completed && (
            <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 400,
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  cefrBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cefrText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

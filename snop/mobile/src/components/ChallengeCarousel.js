import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { colors, shadows, getDifficultyColor } from "../styles/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 32;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING;

export default function ChallengeCarousel({ challenges, onPractice }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / CARD_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < challenges.length) {
      setCurrentIndex(newIndex);
    }
  };

  const getDifficultyLabel = (difficulty) => {
    if (typeof difficulty === 'number') {
      switch (difficulty) {
        case 1:
          return 'Easy';
        case 2:
          return 'Medium';
        case 3:
          return 'Hard';
        default:
          return 'Unknown';
      }
    }
    const diffLower = difficulty?.toLowerCase() || 'easy';
    switch (diffLower) {
      case 'easy':
      case 'lett':
        return 'Easy';
      case 'medium':
      case 'middels':
        return 'Medium';
      case 'hard':
      case 'vanskelig':
        return 'Hard';
      default:
        return difficulty;
    }
  };

  const renderCard = (challenge, index) => {
    const difficultyColor = getDifficultyColor(challenge.difficulty);
    const difficultyLabel = getDifficultyLabel(challenge.difficulty);

    return (
      <View key={challenge.id} style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Difficulty Badge */}
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>{difficultyLabel}</Text>
          </View>

          {/* Challenge Title */}
          <Text style={styles.cardTitle}>
            {challenge.title_no || challenge.title}
          </Text>
          {challenge.title_no && challenge.title !== challenge.title_no && (
            <Text style={styles.cardTitleHelper}>({challenge.title})</Text>
          )}

          {/* Description */}
          <Text style={styles.cardDescription}>
            {challenge.description_no || challenge.description}
          </Text>
          {challenge.description_no && challenge.description !== challenge.description_no && (
            <Text style={styles.cardDescriptionHelper}>
              ({challenge.description})
            </Text>
          )}

          {/* XP Reward */}
          {challenge.xp_reward && (
            <View style={styles.xpContainer}>
              <Text style={styles.xpLabel}>Reward:</Text>
              <Text style={styles.xpValue}>+{challenge.xp_reward} XP</Text>
            </View>
          )}

          {/* Practice Button */}
          <Pressable
            onPress={() => onPractice(challenge)}
            style={({ pressed }) => [
              styles.practiceButton,
              pressed && styles.practiceButtonPressed,
            ]}
          >
            <Text style={styles.practiceButtonText}>Practice now</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {challenges.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (!challenges || challenges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No challenges available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
      >
        {challenges.map(renderCard)}
      </ScrollView>
      {renderPaginationDots()}
      <Text style={styles.counterText}>
        {currentIndex + 1} of {challenges.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    minHeight: 320,
    ...shadows.medium,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  difficultyText: {
    color: colors.textWhite,
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
    lineHeight: 30,
  },
  cardTitleHelper: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: 4,
    marginTop: 8,
  },
  cardDescriptionHelper: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: "italic",
    marginBottom: 16,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  xpLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 6,
  },
  xpValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.success,
  },
  practiceButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
    ...shadows.small,
  },
  practiceButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  practiceButtonText: {
    color: colors.textWhite,
    fontWeight: "700",
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  counterText: {
    textAlign: "center",
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

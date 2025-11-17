import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { getDifficultyColor } from "../styles/colors";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 32;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING;

export default function ChallengeCarousel({ challenges, onPractice }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const { colors } = useTheme();

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
        <View style={[styles.card, { backgroundColor: colors.background, shadowColor: colors.shadow }]}>
          {/* Difficulty Badge */}
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={[styles.difficultyText, { color: colors.textWhite }]}>{difficultyLabel}</Text>
          </View>

          {/* Challenge Title */}
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {challenge.title_no || challenge.title}
          </Text>
          {challenge.title_no && challenge.title !== challenge.title_no && (
            <Text style={[styles.cardTitleHelper, { color: colors.textSecondary }]}>({challenge.title})</Text>
          )}

          {/* Description */}
          <Text style={[styles.cardDescription, { color: colors.textPrimary }]}>
            {challenge.description_no || challenge.description}
          </Text>
          {challenge.description_no && challenge.description !== challenge.description_no && (
            <Text style={[styles.cardDescriptionHelper, { color: colors.textLight }]}>
              ({challenge.description})
            </Text>
          )}

          {/* XP Reward */}
          {challenge.xp_reward && (
            <View style={styles.xpContainer}>
              <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>Reward:</Text>
              <Text style={[styles.xpValue, { color: colors.success }]}>+{challenge.xp_reward} XP</Text>
            </View>
          )}

          {/* Practice Button */}
          <Pressable
            onPress={() => onPractice(challenge)}
            style={({ pressed }) => [
              styles.practiceButton,
              { backgroundColor: colors.accent, shadowColor: colors.shadow },
              pressed && styles.practiceButtonPressed,
            ]}
          >
            <Text style={[styles.practiceButtonText, { color: colors.textWhite }]}>Practice now</Text>
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
              { backgroundColor: colors.border },
              index === currentIndex && { backgroundColor: colors.primary, width: 24 },
            ]}
          />
        ))}
      </View>
    );
  };

  if (!challenges || challenges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No challenges available</Text>
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
      <Text style={[styles.counterText, { color: colors.textSecondary }]}>
        {currentIndex + 1} of {challenges.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.Create({
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
    borderRadius: 16,
    padding: 24,
    minHeight: 320,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  difficultyText: {
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    lineHeight: 30,
  },
  cardTitleHelper: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    marginTop: 8,
  },
  cardDescriptionHelper: {
    fontSize: 13,
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
    marginRight: 6,
  },
  xpValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  practiceButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  practiceButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  practiceButtonText: {
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
  },
  paginationDotActive: {
  },
  counterText: {
    textAlign: "center",
    fontSize: 14,
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
    textAlign: "center",
  },
});

/**
 * ChallengeFilterService - Smart filtering and recommendation for challenges
 *
 * This service provides intelligent challenge filtering based on user profile
 * and performance data to optimize the learning experience.
 */

/**
 * Filter challenges based on user profile (basic filtering)
 * @param {Array} challenges - Array of challenge objects
 * @param {Object} userProfile - User profile with age_group, level, interests
 * @returns {Array} Filtered challenges
 */
export const filterChallengesByProfile = (challenges, userProfile) => {
  if (!challenges || !Array.isArray(challenges)) {
    return [];
  }

  if (!userProfile) {
    // If no profile, return all challenges
    return challenges;
  }

  return challenges.filter((challenge) => {
    // Age group filtering
    if (challenge.age_group && challenge.age_group !== "all") {
      if (userProfile.age_group && challenge.age_group !== userProfile.age_group) {
        return false;
      }
    }

    // Level filtering - show challenges at or below user's level
    if (challenge.level && userProfile.level) {
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      const challengeLevel = levelOrder[challenge.level] || 1;
      const userLevel = levelOrder[userProfile.level] || 1;

      // Allow one level above for stretch goals
      if (challengeLevel > userLevel + 1) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Calculate a score for each challenge based on relevance to user
 * @param {Array} challenges - Array of challenge objects
 * @param {Object} userProfile - User profile
 * @param {Object} performance - User performance data
 * @returns {Array} Challenges with added 'relevanceScore' field
 */
export const scoreChallenges = (challenges, userProfile, performance) => {
  if (!challenges || !Array.isArray(challenges)) {
    return [];
  }

  const defaultPerformance = {
    effectiveLevel: userProfile?.level || "beginner",
    recentTrend: "stable",
    recentChallenges: [],
    byType: {},
    byTopic: {},
    byLevel: {},
  };

  const perf = performance || defaultPerformance;
  const profile = userProfile || {};

  return challenges.map((challenge) => {
    let score = 0;

    // Age group match (+2)
    if (challenge.age_group === "all" || challenge.age_group === profile.age_group) {
      score += 2;
    }

    // Interest match (+3)
    if (profile.interests && Array.isArray(profile.interests)) {
      if (profile.interests.includes(challenge.topic)) {
        score += 3;
      }
    }

    // Effective level match (+4) - this is the most important factor
    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const challengeLevel = levelOrder[challenge.level] || 1;
    const effectiveLevel = levelOrder[perf.effectiveLevel] || 1;

    if (challengeLevel === effectiveLevel) {
      // Perfect match with effective level
      score += 4;
    } else if (challengeLevel === effectiveLevel - 1) {
      // One level below - good for reinforcement
      score += 2;
    } else if (challengeLevel === effectiveLevel + 1) {
      // One level above - stretch goal
      if (perf.recentTrend === "improving") {
        // If user is improving, reward stretch goals
        score += 3;
      } else {
        score += 1;
      }
    }

    // Weak areas need practice (+2)
    // Check if user has low success rate in this topic
    if (perf.byTopic && perf.byTopic[challenge.topic]) {
      const topicStats = perf.byTopic[challenge.topic];
      if (topicStats.attempts > 0) {
        const successRate = (topicStats.successes / topicStats.attempts) * 100;
        // If struggling with this topic (< 60% success), prioritize it
        if (successRate < 60 && topicStats.attempts >= 2) {
          score += 2;
        }
      }
    } else {
      // New topic not yet practiced - encourage exploration
      score += 1;
    }

    // Challenge type needing practice (+1)
    // Check if user has low success rate in this type
    if (perf.byType && perf.byType[challenge.type]) {
      const typeStats = perf.byType[challenge.type];
      if (typeStats.attempts > 0) {
        const successRate = (typeStats.successes / typeStats.attempts) * 100;
        // If struggling with this type (< 60% success), prioritize it
        if (successRate < 60 && typeStats.attempts >= 2) {
          score += 1;
        }
      }
    } else {
      // New type not yet practiced
      score += 1;
    }

    // Not done recently (+1)
    if (perf.recentChallenges && Array.isArray(perf.recentChallenges)) {
      if (!perf.recentChallenges.includes(challenge.id)) {
        score += 1;
      }
    } else {
      score += 1;
    }

    // Variety bonus - encourage different types of challenges
    if (perf.byType) {
      const typeAttempts = perf.byType[challenge.type]?.attempts || 0;
      const totalAttempts = Object.values(perf.byType).reduce(
        (sum, t) => sum + (t.attempts || 0),
        0
      );

      if (totalAttempts > 0) {
        const typePercentage = typeAttempts / totalAttempts;
        // If this type is underrepresented, boost it
        if (typePercentage < 0.2) {
          score += 1;
        }
      }
    }

    return {
      ...challenge,
      relevanceScore: score,
    };
  });
};

/**
 * Get recommended challenges sorted by relevance score
 * @param {Array} challenges - Array of challenge objects
 * @param {Object} userProfile - User profile
 * @param {Object} performance - User performance data
 * @param {number} limit - Maximum number of recommendations (default: all)
 * @returns {Array} Sorted and filtered challenges with scores
 */
export const getRecommendedChallenges = (
  challenges,
  userProfile,
  performance,
  limit = null
) => {
  if (!challenges || !Array.isArray(challenges)) {
    return [];
  }

  // First filter by profile constraints
  const filtered = filterChallengesByProfile(challenges, userProfile);

  // Then score remaining challenges
  const scored = scoreChallenges(filtered, userProfile, performance);

  // Sort by relevance score (highest first)
  const sorted = scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return limited results if specified
  if (limit && limit > 0) {
    return sorted.slice(0, limit);
  }

  return sorted;
};

/**
 * Calculate learning trend from recent scores
 * @param {Array} lastFiveScores - Array of recent scores (0-100)
 * @returns {string} "improving", "stable", or "struggling"
 */
export const calculateTrend = (lastFiveScores) => {
  if (!lastFiveScores || !Array.isArray(lastFiveScores) || lastFiveScores.length < 3) {
    return "stable";
  }

  const scores = lastFiveScores.slice(-5);
  const avgRecent = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Compare first half to second half
  const midPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midPoint);
  const secondHalf = scores.slice(midPoint);

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return "stable";
  }

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = avgSecond - avgFirst;

  // Determine trend based on score progression
  if (difference > 10) return "improving";
  if (difference < -10) return "struggling";

  // Also consider absolute performance
  if (avgRecent > 85) return "improving";
  if (avgRecent < 50) return "struggling";

  return "stable";
};

/**
 * Get weak areas that need more practice
 * @param {Object} performance - User performance data
 * @returns {Object} Object with weak topics and types
 */
export const getWeakAreas = (performance) => {
  if (!performance) {
    return { topics: [], types: [] };
  }

  const weakTopics = [];
  const weakTypes = [];

  // Check topics
  if (performance.byTopic) {
    for (const [topic, stats] of Object.entries(performance.byTopic)) {
      if (stats.attempts >= 2) {
        const successRate = (stats.successes / stats.attempts) * 100;
        if (successRate < 60) {
          weakTopics.push({ topic, successRate, avgScore: stats.avgScore });
        }
      }
    }
  }

  // Check types
  if (performance.byType) {
    for (const [type, stats] of Object.entries(performance.byType)) {
      if (stats.attempts >= 2) {
        const successRate = (stats.successes / stats.attempts) * 100;
        if (successRate < 60) {
          weakTypes.push({ type, successRate, avgScore: stats.avgScore });
        }
      }
    }
  }

  // Sort by success rate (lowest first)
  weakTopics.sort((a, b) => a.successRate - b.successRate);
  weakTypes.sort((a, b) => a.successRate - b.successRate);

  return { topics: weakTopics, types: weakTypes };
};

/**
 * Get strengths - areas where user excels
 * @param {Object} performance - User performance data
 * @returns {Object} Object with strong topics and types
 */
export const getStrengths = (performance) => {
  if (!performance) {
    return { topics: [], types: [] };
  }

  const strongTopics = [];
  const strongTypes = [];

  // Check topics
  if (performance.byTopic) {
    for (const [topic, stats] of Object.entries(performance.byTopic)) {
      if (stats.attempts >= 3) {
        const successRate = (stats.successes / stats.attempts) * 100;
        if (successRate >= 80 && stats.avgScore >= 75) {
          strongTopics.push({ topic, successRate, avgScore: stats.avgScore });
        }
      }
    }
  }

  // Check types
  if (performance.byType) {
    for (const [type, stats] of Object.entries(performance.byType)) {
      if (stats.attempts >= 3) {
        const successRate = (stats.successes / stats.attempts) * 100;
        if (successRate >= 80 && stats.avgScore >= 75) {
          strongTypes.push({ type, successRate, avgScore: stats.avgScore });
        }
      }
    }
  }

  // Sort by average score (highest first)
  strongTopics.sort((a, b) => b.avgScore - a.avgScore);
  strongTypes.sort((a, b) => b.avgScore - a.avgScore);

  return { topics: strongTopics, types: strongTypes };
};

export default {
  filterChallengesByProfile,
  scoreChallenges,
  getRecommendedChallenges,
  calculateTrend,
  getWeakAreas,
  getStrengths,
};

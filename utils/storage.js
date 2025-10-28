import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  COMPLETED_CHALLENGES: '@norwegian_app:completed_challenges',
  CURRENT_CHALLENGES: '@norwegian_app:current_challenges',
  TOTAL_POINTS: '@norwegian_app:total_points',
  STREAK: '@norwegian_app:streak'
};

// Get completed challenges
export const getCompletedChallenges = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_CHALLENGES);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error getting completed challenges:', error);
    return [];
  }
};

// Mark challenge as completed
export const completeChallenge = async (challenge) => {
  try {
    const completed = await getCompletedChallenges();
    const newCompleted = [...completed, {
      ...challenge,
      completedAt: new Date().toISOString()
    }];
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_CHALLENGES, JSON.stringify(newCompleted));
    
    // Update points
    const currentPoints = await getTotalPoints();
    await setTotalPoints(currentPoints + challenge.points);
    
    return true;
  } catch (error) {
    console.error('Error completing challenge:', error);
    return false;
  }
};

// Get current active challenges
export const getCurrentChallenges = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_CHALLENGES);
    return value ? JSON.parse(value) : { daily: null, weekly: null, monthly: null };
  } catch (error) {
    console.error('Error getting current challenges:', error);
    return { daily: null, weekly: null, monthly: null };
  }
};

// Set current challenges
export const setCurrentChallenges = async (challenges) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_CHALLENGES, JSON.stringify(challenges));
    return true;
  } catch (error) {
    console.error('Error setting current challenges:', error);
    return false;
  }
};

// Get total points
export const getTotalPoints = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_POINTS);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
};

// Set total points
export const setTotalPoints = async (points) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_POINTS, points.toString());
    return true;
  } catch (error) {
    console.error('Error setting total points:', error);
    return false;
  }
};

// Check if challenge is completed
export const isChallengeCompleted = async (challengeId) => {
  try {
    const completed = await getCompletedChallenges();
    return completed.some(c => c.id === challengeId);
  } catch (error) {
    console.error('Error checking if challenge is completed:', error);
    return false;
  }
};

// Get statistics
export const getStats = async () => {
  try {
    const completed = await getCompletedChallenges();
    const points = await getTotalPoints();
    
    const dailyCount = completed.filter(c => c.type === 'daily').length;
    const weeklyCount = completed.filter(c => c.type === 'weekly').length;
    const monthlyCount = completed.filter(c => c.type === 'monthly').length;
    
    return {
      totalCompleted: completed.length,
      totalPoints: points,
      dailyCompleted: dailyCount,
      weeklyCompleted: weeklyCount,
      monthlyCompleted: monthlyCount
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalCompleted: 0,
      totalPoints: 0,
      dailyCompleted: 0,
      weeklyCompleted: 0,
      monthlyCompleted: 0
    };
  }
};

// Clear all data (for testing)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

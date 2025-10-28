import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ChallengeCard = ({ challenge, onPress, completed }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      case 'very_hard':
        return '#9C27B0';
      default:
        return '#2196F3';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, completed && styles.completedCard]} 
      onPress={onPress}
      disabled={completed}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
          <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{challenge.description}</Text>
      
      <View style={styles.phraseContainer}>
        <Text style={styles.norwegianPhrase}>{challenge.norwegianPhrase}</Text>
        <Text style={styles.englishTranslation}>"{challenge.englishTranslation}"</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.points}>🏆 {challenge.points} points</Text>
        {completed && <Text style={styles.completedText}>✓ Completed</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  phraseContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  norwegianPhrase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  englishTranslation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  completedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default ChallengeCard;

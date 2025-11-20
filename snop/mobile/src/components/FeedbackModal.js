import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * FeedbackModal - In-app feedback for challenge results
 *
 * Props:
 * - visible: boolean - Whether modal is shown
 * - isCorrect: boolean - Whether answer was correct
 * - xpGained: number - XP earned
 * - message: string - Optional custom message
 * - onTryAnother: function - Called when "Try Another" pressed
 * - onGoBack: function - Called when "Go Back" pressed
 * - showTryAnother: boolean - Whether to show Try Another button (default true)
 */
export default function FeedbackModal({
  visible,
  isCorrect,
  xpGained = 0,
  message,
  onTryAnother,
  onGoBack,
  showTryAnother = true,
}) {
  const { colors } = useTheme();

  const defaultMessage = isCorrect
    ? 'Great job! You got it right!'
    : 'Not quite right. Keep practicing!';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onGoBack}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: isCorrect ? colors.success : colors.error,
            },
          ]}
        >
          {/* Result Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isCorrect
                  ? colors.success + '20'
                  : colors.error + '20',
              },
            ]}
          >
            <Text style={styles.icon}>{isCorrect ? '✓' : '✗'}</Text>
          </View>

          {/* Result Title */}
          <Text
            style={[
              styles.title,
              { color: isCorrect ? colors.success : colors.error },
            ]}
          >
            {isCorrect ? 'Riktig!' : 'Feil'}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textPrimary }]}>
            {message || defaultMessage}
          </Text>

          {/* XP Gained */}
          {xpGained > 0 && (
            <View
              style={[
                styles.xpContainer,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.xpText, { color: colors.primary }]}>
                +{xpGained} XP
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {showTryAnother && onTryAnother && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onTryAnother}
              >
                <Text style={[styles.buttonText, { color: colors.textWhite }]}>
                  Prøv en annen
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                },
              ]}
              onPress={onGoBack}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                Gå tilbake
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  xpContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    // Primary styling applied via props
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

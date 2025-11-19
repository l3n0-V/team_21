import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../styles/colors';

const SettingsScreen = () => {
  const { theme, changeTheme, colors } = useTheme();

  const renderSettingSection = (title, children) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const isDarkMode = theme.id === 'dark';

  const toggleTheme = () => {
    changeTheme(isDarkMode ? 'default' : 'dark');
  };

  const renderPlaceholderSetting = (label, description) => (
    <View
      style={[
        styles.settingItem,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: colors.textLight }]}>
            {label}
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textLight }]}>
            {description}
          </Text>
        </View>
        <Text style={[styles.comingSoonBadge, { color: colors.textLight }]}>
          Coming Soon
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Customize your SNOP experience
          </Text>
        </View>

        {/* Theme Settings */}
        {renderSettingSection(
          'Appearance',
          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? colors.textWhite : colors.textWhite}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        )}

        {/* Account Settings - Placeholder */}
        {renderSettingSection(
          'Account',
          <View>
            {renderPlaceholderSetting(
              'Profile Settings',
              'Update your name, email, and profile picture'
            )}
            {renderPlaceholderSetting(
              'Privacy',
              'Manage your privacy and data preferences'
            )}
            {renderPlaceholderSetting(
              'Change Password',
              'Update your account password'
            )}
          </View>
        )}

        {/* Learning Settings - Placeholder */}
        {renderSettingSection(
          'Learning',
          <View>
            {renderPlaceholderSetting(
              'Difficulty Level',
              'Adjust challenge difficulty preferences'
            )}
            {renderPlaceholderSetting(
              'Reminder Notifications',
              'Get reminded to practice daily'
            )}
          </View>
        )}

        {/* Audio Settings - Placeholder */}
        {renderSettingSection(
          'Audio',
          <View>
            {renderPlaceholderSetting(
              'Microphone Settings',
              'Test and adjust your microphone'
            )}
            {renderPlaceholderSetting(
              'Playback Speed',
              'Adjust audio playback speed'
            )}
            {renderPlaceholderSetting(
              'Audio Quality',
              'Choose recording quality'
            )}
          </View>
        )}

        {/* Notifications - Placeholder */}
        {renderSettingSection(
          'Notifications',
          <View>
            {renderPlaceholderSetting(
              'Push Notifications',
              'Enable or disable push notifications'
            )}
            {renderPlaceholderSetting(
              'Email Notifications',
              'Manage email notification preferences'
            )}
            {renderPlaceholderSetting(
              'Achievement Alerts',
              'Get notified when you earn badges'
            )}
          </View>
        )}

        {/* About - Placeholder */}
        {renderSettingSection(
          'About',
          <View>
            {renderPlaceholderSetting(
              'App Version',
              'SNOP v1.0.0'
            )}
            {renderPlaceholderSetting(
              'Terms of Service',
              'View our terms and conditions'
            )}
            {renderPlaceholderSetting(
              'Privacy Policy',
              'Read our privacy policy'
            )}
            {renderPlaceholderSetting(
              'Help & Support',
              'Get help or contact support'
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...shadows.small,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  comingSoonBadge: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 12,
  },
});

export default SettingsScreen;

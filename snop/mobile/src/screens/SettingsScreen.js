import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { shadows } from '../styles/colors';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const SettingsScreen = () => {
  const { theme, changeTheme, colors } = useTheme();
  const { user, token, signOut } = useContext(AuthContext);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Feil', 'Navn kan ikke være tomt');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.updateProfile?.(token, { display_name: displayName.trim() });
      if (result?.success !== false) {
        Alert.alert('Suksess', 'Profilen din er oppdatert');
        setShowProfileModal(false);
      } else {
        Alert.alert('Feil', result?.error || 'Kunne ikke oppdatere profil');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Feil', 'Kunne ikke oppdatere profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Slett konto',
      'Er du sikker på at du vil slette kontoen din? Dette kan ikke angres.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Bekreft sletting',
              'Skriv "SLETT" for å bekrefte',
              [
                { text: 'Avbryt', style: 'cancel' },
                {
                  text: 'Slett permanent',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      await api.deleteAccount?.(token);
                      await signOut();
                    } catch (error) {
                      console.error('Delete account error:', error);
                      Alert.alert('Feil', 'Kunne ikke slette konto');
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderSettingButton = (label, description, onPress, destructive = false) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.settingItem,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: destructive ? '#FF3B30' : colors.textPrimary }]}>
            {label}
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
      </View>
    </TouchableOpacity>
  );

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

        {/* Account Settings */}
        {renderSettingSection(
          'Konto',
          <View>
            {renderSettingButton(
              'Profil',
              user?.email || 'Rediger navn og profilbilde',
              () => setShowProfileModal(true)
            )}
            {renderPlaceholderSetting(
              'Personvern',
              'Administrer personvern og datainnstillinger'
            )}
            {renderSettingButton(
              'Logg ut',
              'Logg ut av kontoen din',
              handleLogout
            )}
            {renderSettingButton(
              'Slett konto',
              'Slett kontoen din permanent',
              handleDeleteAccount,
              true
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

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Rediger profil
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Visningsnavn
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ditt navn"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                  Avbryt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    Lagre
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    ...shadows.medium,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;

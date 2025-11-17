import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { colors } from "../styles/colors";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Simulate loading time, then navigate to Login
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>SNOP</Text>
        <Text style={styles.tagline}>Lær Norsk med Selvtillit</Text>
        <Text style={styles.taglineEn}>Learn Norwegian with Confidence</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Laster inn...</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.legalFooter}>
          <Pressable onPress={() => console.log('Terms pressed')}>
            <Text style={styles.legalLink}>Vilkår</Text>
          </Pressable>
          <Text style={styles.legalDivider}>·</Text>
          <Pressable onPress={() => console.log('Privacy pressed')}>
            <Text style={styles.legalLink}>Personvern</Text>
          </Pressable>
          <Text style={styles.legalDivider}>·</Text>
          <Pressable onPress={() => console.log('Feedback pressed')}>
            <Text style={styles.legalLink}>Tilbakemelding</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    fontSize: 72,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 8,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  taglineEn: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  legalFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  legalLink: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "500",
  },
  legalDivider: {
    color: colors.textLight,
    fontSize: 12,
  },
});

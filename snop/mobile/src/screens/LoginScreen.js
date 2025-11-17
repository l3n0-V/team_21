import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { colors, shadows } from "../styles/colors";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const checkOnboardingAndNavigate = async () => {
    try {
      const profileData = await AsyncStorage.getItem("userProfile");
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile.onboarding_completed) {
          navigation.replace("Tabs");
          return;
        }
      }
      // No profile or onboarding not completed
      navigation.replace("Onboarding");
    } catch (error) {
      console.error("Error checking onboarding:", error);
      navigation.replace("Onboarding");
    }
  };

  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Feil", "Vennligst fyll ut alle felt");
      return;
    }

    setLoading(true);
    try {
      const r = await signIn(email, password);
      if (!r?.ok) {
        Alert.alert("Innlogging mislyktes", "Sjekk e-post og passord");
      } else {
        await checkOnboardingAndNavigate();
      }
    } catch (error) {
      Alert.alert("Feil", error.message || "Kunne ikke logge inn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>SNOP</Text>
          <Text style={styles.subtitle}>Logg inn for å fortsette</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>E-post</Text>
          <TextInput
            placeholder="din@epost.no"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>Passord</Text>
          <TextInput
            placeholder="Ditt passord"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor={colors.textLight}
          />

          <Pressable
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              pressed && !loading && styles.btnPressed,
              loading && styles.btnDisabled
            ]}
          >
            <Text style={styles.btnText}>
              {loading ? "Logger inn..." : "Logg inn"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Har du ikke konto?</Text>
          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={({ pressed }) => [
              styles.linkButton,
              pressed && { opacity: 0.6 }
            ]}
          >
            <Text style={styles.linkText}>Registrer deg</Text>
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ELLER</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={() => checkOnboardingAndNavigate()}
          style={({ pressed }) => [
            styles.guestBtn,
            pressed && { opacity: 0.7 }
          ]}
        >
          <Text style={styles.guestBtnText}>Fortsett som gjest (Testing)</Text>
        </Pressable>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  formContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.backgroundTertiary,
    color: colors.textPrimary,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    ...shadows.small,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  btnDisabled: {
    backgroundColor: colors.disabledBackground,
  },
  btnText: {
    color: colors.textWhite,
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkButton: {
    padding: 4,
  },
  linkText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: "600",
  },
  guestBtn: {
    backgroundColor: colors.backgroundTertiary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  guestBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  legalFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
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

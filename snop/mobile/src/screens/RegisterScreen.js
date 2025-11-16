import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, shadows } from "../styles/colors";

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // Validation
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert("Feil", "Vennligst fyll ut alle felt");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Feil", "Passordet må være minst 6 tegn");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Feil", "Passordene matcher ikke");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      if (!result?.ok) {
        Alert.alert("Registrering mislyktes", result?.error || "Kunne ikke opprette konto");
      } else {
        Alert.alert(
          "Suksess!",
          "Kontoen din er opprettet. Du kan nå logge inn.",
          [
            {
              text: "OK",
              onPress: () => navigation.replace("Login")
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Feil", error.message || "Kunne ikke registrere");
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>SNOP</Text>
            <Text style={styles.subtitle}>Opprett ny konto</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Fullt navn</Text>
            <TextInput
              placeholder="Ditt fulle navn"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              autoCapitalize="words"
              placeholderTextColor={colors.textLight}
            />

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
              placeholder="Minst 6 tegn"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.label}>Bekreft passord</Text>
            <TextInput
              placeholder="Skriv passordet på nytt"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
                {loading ? "Oppretter konto..." : "Registrer"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Har du allerede konto?</Text>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={({ pressed }) => [
                styles.linkButton,
                pressed && { opacity: 0.6 }
              ]}
            >
              <Text style={styles.linkText}>Logg inn</Text>
            </Pressable>
          </View>

          <View style={styles.flagStripe}>
            <View style={[styles.stripe, { backgroundColor: colors.accent }]} />
            <View style={[styles.stripe, { backgroundColor: colors.background }]} />
            <View style={[styles.stripe, { backgroundColor: colors.primary }]} />
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
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
  flagStripe: {
    flexDirection: "row",
    width: 120,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 32,
  },
  stripe: {
    flex: 1,
  },
});

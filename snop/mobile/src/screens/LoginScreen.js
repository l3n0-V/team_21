import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const r = await signIn(email, password);
    if (!r?.ok) Alert.alert("Login failed");
    else navigation.replace("Tabs");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Log in</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input}/>
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input}/>
      <Pressable
        onPress={submit}
        style={({ pressed }) => [
          styles.btn,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
        ]}
      >
        <Text style={styles.btnText}>Continue</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("Register")}
        style={({ pressed }) => [
          pressed && { opacity: 0.6 }
        ]}
      >
        <Text style={{ color: "#2563eb" }}>No account? Register</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center", gap: 12 },
  header: { fontSize: 24, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12 },
  btn: { backgroundColor: "#111827", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" }
});

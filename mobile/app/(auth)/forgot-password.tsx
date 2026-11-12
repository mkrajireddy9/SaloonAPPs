import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_URL } from "../../src/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Unable to send reset instructions.");
      setMessage(
        body.message ||
          "If the account exists, reset instructions have been sent.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to send reset instructions.",
      );
    }
  };
  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text style={s.eyebrow}>ACCOUNT SECURITY</Text>
        <Text style={s.title}>Reset your password</Text>
        <Text style={s.copy}>
          Enter your email and we will send a reset link if an account exists.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={s.input}
        />
        <Pressable style={s.primary} onPress={() => void submit()}>
          <Text style={s.primaryText}>Send reset link</Text>
        </Pressable>
        {message ? <Text style={s.success}>{message}</Text> : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Link href="/(auth)/login" style={s.link}>
          Back to sign in
        </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 24, paddingTop: 40, paddingBottom: 40 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#20352d", fontSize: 30, fontWeight: "700", marginTop: 12 },
  copy: { color: "#77817c", lineHeight: 20, marginVertical: 18 },
  input: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 14,
  },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 9,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  success: { color: "#4c947d", marginTop: 14 },
  error: { color: "#c55239", marginTop: 14 },
  link: {
    color: "#c55239",
    textAlign: "center",
    marginTop: 24,
    fontWeight: "700",
  },
});

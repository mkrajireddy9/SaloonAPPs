import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_URL, setSession } from "../../src/api";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setError("");
    if (!email.trim() || !password)
      return setError("Enter your email and password.");
    const loginEmail =
      email.trim().toLowerCase() === "test" && password === "test"
        ? "test@test.com"
        : email.trim();
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password, role: "user" }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(" ")
            : body.message || "Unable to sign in.",
        );
      await setSession(body.accessToken, body.refreshToken);
      router.replace("/(tabs)/directory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.hero}>
            <Text style={s.mark}>h</Text>
            <Text style={s.brand}>halo</Text>
            <Text style={s.heroTitle}>
              A better conversation{`\n`}starts here.
            </Text>
          </View>
          <Text style={s.eyebrow}>WELCOME BACK</Text>
          <Text style={s.title}>Sign in to halo</Text>
          <Text style={s.copy}>
            Choose a salon, request a visit, and keep your hair story close.
          </Text>
          <Text style={s.label}>Email address or local username</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com or test"
            autoCapitalize="none"
            keyboardType="default"
            style={s.input}
          />
          <Text style={s.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            style={s.input}
          />
          <Pressable
            disabled={busy}
            style={s.primary}
            onPress={() => void submit()}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryText}>Continue</Text>
            )}
          </Pressable>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Link href="/(auth)/forgot-password" style={s.link}>
            Forgot password?
          </Link>
          <Link href="/(auth)/register" style={s.link}>
            Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 24, paddingBottom: 40 },
  hero: {
    backgroundColor: "#20352d",
    borderRadius: 18,
    padding: 24,
    minHeight: 240,
    justifyContent: "space-between",
    marginBottom: 28,
  },
  mark: {
    color: "#dfca73",
    borderWidth: 1,
    borderColor: "#dfca73",
    borderRadius: 20,
    width: 42,
    height: 42,
    textAlign: "center",
    paddingTop: 5,
    fontSize: 26,
  },
  brand: { color: "#f7f5f0", fontSize: 22 },
  heroTitle: { color: "#f7f5f0", fontSize: 30, lineHeight: 36 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#20352d", fontSize: 30, fontWeight: "700", marginTop: 10 },
  copy: { color: "#77817c", lineHeight: 20, marginTop: 8, marginBottom: 18 },
  label: {
    color: "#20352d",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 14,
    color: "#20352d",
  },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 9,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  google: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  googleText: { color: "#20352d", fontWeight: "700" },
  error: { color: "#c55239", textAlign: "center", marginTop: 12 },
  link: {
    color: "#c55239",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
  },
});

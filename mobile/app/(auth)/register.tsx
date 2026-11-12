import { Link, router, useLocalSearchParams } from "expo-router";
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

export default function Register() {
  const params = useLocalSearchParams<{ role?: "user" | "admin" }>();
  const [role, setRole] = useState<"user" | "admin">(
    params.role === "admin" ? "admin" : "user",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salonName, setSalonName] = useState("");
  const [salonLocation, setSalonLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = async () => {
    setSubmitted(true);
    setError("");
    setMessage("");
    if (!name.trim() || !email.trim() || password.length < 8)
      return setError(
        "Enter your name, email, and a password with at least 8 characters.",
      );
    if (
      role === "admin" &&
      (salonName.trim().length < 2 || salonLocation.trim().length < 2)
    )
      return setError("Enter the salon name and location for the admin request.");
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          salonName: role === "admin" ? salonName.trim() : undefined,
          salonLocation: role === "admin" ? salonLocation.trim() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(" ")
            : body.message || "Unable to create account.",
        );
      if (body.pendingApproval) {
        setMessage(
          body.message ||
            "Your admin request was submitted for platform approval.",
        );
        return;
      }
      await setSession(body.accessToken, body.refreshToken);
      router.replace("/(tabs)/directory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={s.eyebrow}>GET STARTED</Text>
          <Text style={s.title}>
            {role === "admin" ? "Request admin access" : "Create your guest account"}
          </Text>
          <Text style={s.copy}>
            {role === "admin"
              ? "Submit your salon details. The platform administrator must approve access before you can sign in."
              : "Your appointments, preferences, and salon history in one calm place."}
          </Text>
          <View style={s.roles}>
            <Pressable
              style={[s.role, role === "user" && s.selected]}
              onPress={() => setRole("user")}
            >
              <Text style={s.roleTitle}>Guest</Text>
            </Pressable>
            <Pressable
              style={[s.role, role === "admin" && s.selected]}
              onPress={() => setRole("admin")}
            >
              <Text style={s.roleTitle}>Admin</Text>
            </Pressable>
          </View>
          <Text style={s.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            style={[s.input, submitted && !name.trim() && s.inputError]}
          />
          {role === "admin" ? (
            <>
              <Text style={s.label}>Salon name</Text>
              <TextInput
                value={salonName}
                onChangeText={setSalonName}
                placeholder="Your salon name"
                style={[s.input, submitted && !salonName.trim() && s.inputError]}
              />
              <Text style={s.label}>Salon location</Text>
              <TextInput
                value={salonLocation}
                onChangeText={setSalonLocation}
                placeholder="City or address"
                style={[s.input, submitted && !salonLocation.trim() && s.inputError]}
              />
            </>
          ) : null}
          <Text style={s.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={[s.input, submitted && !email.trim() && s.inputError]}
          />
          <Text style={s.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            style={[s.input, submitted && password.length < 8 && s.inputError]}
          />
          <Pressable
            disabled={busy}
            style={s.primary}
            onPress={() => void submit()}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryText}>
                {role === "admin" ? "Request admin access" : "Create account"}
              </Text>
            )}
          </Pressable>
          {error ? <Text style={s.error}>{error}</Text> : null}
          {message ? <Text style={s.success}>{message}</Text> : null}
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
  content: { padding: 24, paddingTop: 40 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#20352d", fontSize: 30, fontWeight: "700", marginTop: 12 },
  copy: { color: "#77817c", lineHeight: 20, marginTop: 8, marginBottom: 18 },
  roles: { flexDirection: "row", gap: 10, marginBottom: 8 },
  role: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 9,
    padding: 12,
    backgroundColor: "#fffdfa",
  },
  selected: { borderColor: "#c55239", backgroundColor: "#fff4ef" },
  roleTitle: { color: "#20352d", fontWeight: "700" },
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
  inputError: { borderColor: "#c55239", backgroundColor: "#fff4ef" },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 9,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  error: { color: "#c55239", textAlign: "center", marginTop: 12 },
  success: { color: "#4c947d", textAlign: "center", marginTop: 12 },
  link: {
    color: "#c55239",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
  },
});

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
import { API_URL, setSession, setUserLocation } from "../../src/api";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../src/components/ToastProvider";

export default function Login() {
  const { showToast } = useToast();
  const [role, setRole] = useState<"user" | "admin" | "platform_admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tenantCode, setTenantCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = async () => {
    setSubmitted(true);
    setError("");
    if (!email.trim() || !password) {
      const message = "Enter your email and password.";
      setError(message); showToast({ type: "warning", message });
      return;
    }
    if (role === "admin" && !tenantCode.trim()) {
      const message = "Enter the salon tenant code to continue as admin.";
      setError(message); showToast({ type: "warning", message });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          tenantCode: role === "admin" ? tenantCode.trim() : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join(" ")
            : body.message || "Unable to sign in.",
        );
      await setSession(body.accessToken, body.refreshToken);
      if (body.user?.role === "user") {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status === Location.PermissionStatus.GRANTED) {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            await setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        } catch {
          // Location is optional; guests can still browse salons without it.
        }
      }
      router.replace(body.user?.role === "user" ? "/(tabs)/directory" : "/admin");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to sign in.";
      setError(message); showToast({ type: "error", message });
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
          <View style={s.roles}>
            <Pressable
              style={[s.role, role === "user" && s.selected]}
              onPress={() => setRole("user")}
            >
              <Text style={s.roleTitle}>Guest</Text>
              <Text style={s.roleCopy}>Book an appointment</Text>
            </Pressable>
            <Pressable
              style={[s.role, role === "admin" && s.selected]}
              onPress={() => setRole("admin")}
            >
              <Text style={s.roleTitle}>Admin</Text>
              <Text style={s.roleCopy}>Manage the studio</Text>
            </Pressable>
            <Pressable
              style={[s.role, role === "platform_admin" && s.selected]}
              onPress={() => setRole("platform_admin")}
            >
              <Text style={s.roleTitle}>Platform</Text>
              <Text style={s.roleCopy}>Manage all salons</Text>
            </Pressable>
          </View>
          {role === "admin" && (
            <>
              <Text style={s.label}>Salon tenant code</Text>
              <TextInput
                value={tenantCode}
                onChangeText={setTenantCode}
                placeholder="e.g. salon-82cc5254"
                autoCapitalize="none"
                autoCorrect={false}
                style={[s.input, submitted && !tenantCode.trim() && s.inputError]}
              />
            </>
          )}
          <Text style={s.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="default"
            style={[s.input, submitted && !email.trim() && s.inputError]}
          />
          <Text style={s.label}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              style={[s.input, s.passwordInput, submitted && !password && s.inputError]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              onPress={() => setShowPassword((value) => !value)}
              style={s.passwordToggle}
            >
              <Text style={s.passwordToggleText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={busy}
            style={s.primary}
            onPress={() => void submit()}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryText}>
                Continue as {role === "platform_admin" ? "platform admin" : role === "admin" ? "admin" : "guest"}
              </Text>
            )}
          </Pressable>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Link href="/(auth)/forgot-password" style={s.link}>
            Forgot password?
          </Link>
          {role === "platform_admin" ? (
            <Text style={s.link}>Platform admin accounts are provisioned by Halo.</Text>
          ) : (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(auth)/register", params: { role } })
              }
            >
              <Text style={s.link}>Create an account</Text>
            </Pressable>
          )}
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
  roles: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 8 },
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
  roleCopy: { color: "#77817c", fontSize: 10, marginTop: 4 },
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
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 62 },
  passwordToggle: { position: "absolute", right: 12, padding: 6 },
  passwordToggleText: { color: "#c55239", fontWeight: "700", fontSize: 12 },
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

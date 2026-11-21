import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL, getUserLocation, setSession, setUserLocation } from "../../src/api";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../src/components/ToastProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Login() {
  const { showToast } = useToast();
  const [role, setRole] = useState<"user" | "admin">("user");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tenantCode, setTenantCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "not-configured.apps.googleusercontent.com";
  const googleConfigured = Boolean(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);
  const [googleRequest, googleResponse, promptGoogleAsync] = useIdTokenAuthRequest({
    clientId: googleClientId,
    selectAccount: true,
    scopes: ["openid", "profile", "email"],
  });
  const [locationPrompt, setLocationPrompt] = useState<{
    title: string;
    message: string;
    action: "request" | "settings";
  } | null>(null);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroOffset = useRef(new Animated.Value(18)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formOffset = useRef(new Animated.Value(12)).current;
  const otpTransition = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(heroOffset, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(formOffset, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [formOpacity, formOffset, heroOffset, heroOpacity]);

  useEffect(() => {
    Animated.timing(otpTransition, {
      toValue: otpSent ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [otpSent, otpTransition]);
  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") {
      setBusy(false);
      return;
    }
    const response = googleResponse as any;
    const credential = response.params?.id_token || response.authentication?.idToken;
    if (!credential) {
      setBusy(false);
      showToast({ type: "error", message: "Google sign-in did not return a valid account token." });
      return;
    }
    void completeGoogleLogin(credential);
  }, [googleResponse]);
  const selectRole = (nextRole: "user" | "admin") => {
    setRole(nextRole);
    setOtpSent(false);
    setOtp("");
    setSubmitted(false);
  };
  const captureUserLocation = async () => {
    if (await getUserLocation()) return;
    setLocationPrompt({
      title: "Find salons near you",
      message: "Allow Halo to use your location so we can show salons and services close to you.",
      action: "request",
    });
  };
  const requestLocationAccess = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!servicesEnabled || permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationPrompt({
          title: "Turn on location",
          message: "Halo uses your current location to show salons near you. Please enable location access in Settings.",
          action: "settings",
        });
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationPrompt({
        title: "Location unavailable",
        message: "Please turn on location services in Settings so Halo can show nearby salons.",
        action: "settings",
      });
    }
  };
  const completeGoogleLogin = async (credential: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential, role: "admin", tenantCode: tenantCode.trim() }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message || "Unable to sign in with Google.");
      if (body.pendingApproval) {
        showToast({ type: "info", message: body.message || "Your admin access is waiting for approval." });
        return;
      }
      await setSession(body.accessToken, body.refreshToken);
      router.replace("/admin");
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Unable to sign in with Google." });
    } finally {
      setBusy(false);
    }
  };
  const startGoogleSignIn = async () => {
    if (!tenantCode.trim()) {
      setSubmitted(true);
      showToast({ type: "warning", message: "Enter the salon tenant code to continue as admin." });
      return;
    }
    if (!googleConfigured || !googleRequest) {
      showToast({ type: "error", message: "Google sign-in is not configured for this app yet." });
      return;
    }
    setBusy(true);
    try {
      const result = await promptGoogleAsync();
      if (result.type !== "success") setBusy(false);
    } catch (e) {
      setBusy(false);
      showToast({ type: "error", message: e instanceof Error ? e.message : "Unable to open Google sign-in." });
    }
  };
  const submit = async () => {
    setSubmitted(true);
    const indiaPhone = `+91${phone.replace(/\D/g, "")}`;
    if ((role === "user" ? !/^\d{10}$/.test(phone) : !email.trim()) || (role === "user" ? (otpSent ? !/^\d{4,10}$/.test(otp) : false) : !password)) {
      const message = role === "user"
        ? otpSent ? "Enter the SMS code." : "Enter your 10-digit mobile number."
        : "Enter your email and password.";
      showToast({ type: "warning", message });
      return;
    }
    if (role === "user" && !otpSent) {
      setBusy(true);
      try {
        const response = await fetch(`${API_URL}/auth/user/request-otp`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: indiaPhone }),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message || "Unable to send login code.");
        setOtpSent(true);
        showToast({ type: "success", message: "Login code sent by SMS." });
      } catch (e) {
        showToast({ type: "error", message: e instanceof Error ? e.message : "Unable to send login code." });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (role === "admin" && !tenantCode.trim()) {
      const message = "Enter the salon tenant code to continue as admin.";
      showToast({ type: "warning", message });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}${role === "user" ? "/auth/user/verify-otp" : "/auth/login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(role === "user" ? { phone: indiaPhone } : { email: email.trim() }),
          ...(role === "user" ? { code: otp } : { password, role }),
          ...(role === "admin" ? { role } : {}),
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
        await captureUserLocation();
      }
      router.replace(body.user?.role === "user" ? "/(tabs)/directory" : "/admin");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to sign in.";
      showToast({ type: "error", message });
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
          <Animated.View style={[s.hero, { opacity: heroOpacity, transform: [{ translateY: heroOffset }] }]}>
            <Text style={s.mark}>h</Text>
            <Text style={s.brand}>halo</Text>
            <Text style={s.heroTitle}>
              A better conversation{`\n`}starts here.
            </Text>
          </Animated.View>
          <Animated.View style={[s.formSurface, { opacity: formOpacity, transform: [{ translateY: formOffset }] }]}>
          <Text style={s.eyebrow}>{role === "user" ? "WELCOME TO HALO" : "SALON TEAM"}</Text>
          <Text style={s.title}>{role === "user" ? "Welcome to halo" : "Admin sign in"}</Text>
          <Text style={s.copy}>
            {role === "user"
              ? "Choose a salon, request a visit, and keep your hair story close."
              : "Manage your salon, appointments, and customer relationships."}
          </Text>
          {role === "admin" && (
            <>
              <Text style={s.label}>Salon tenant code</Text>
              <TextInput
                value={tenantCode}
                onChangeText={setTenantCode}
                placeholder="Enter your salon tenant code"
                autoCapitalize="none"
                autoCorrect={false}
                style={[s.input, submitted && !tenantCode.trim() && s.inputError]}
              />
            </>
          )}
          {role === "user" ? <>
            <Text style={s.label}>Mobile number</Text>
            <View style={[s.phoneRow, submitted && !/^\d{10}$/.test(phone) && s.inputError]}>
              <Text style={s.countryCode}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter your mobile number"
                autoCapitalize="none"
                keyboardType="phone-pad"
                maxLength={10}
                style={s.phoneInput}
              />
            </View>
          </> : null}
          {role === "user" && otpSent ? (
            <Animated.View style={{ opacity: otpTransition, transform: [{ translateY: otpTransition.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }}>
              <Text style={s.label}>Login code</Text>
              <TextInput
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                placeholder="SMS code"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={[s.input, submitted && !/^\d{4,10}$/.test(otp) && s.inputError]}
              />
              <Pressable onPress={() => { setOtpSent(false); setOtp(""); }}>
                <Text style={s.link}>Use a different number or resend code</Text>
              </Pressable>
            </Animated.View>
          ) : null}
          {role === "user" ? <AnimatedPressable
            disabled={busy}
            style={[s.primary, { transform: [{ scale: buttonScale }] }]}
            onPressIn={() => Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 24, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 5 }).start()}
            onPress={() => void submit()}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <><Text style={s.primaryText}>{otpSent ? "Verify code" : "Send login code"}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
          </AnimatedPressable> : (
            <>
              <Text style={s.label}>Admin authentication</Text>
              <Text style={s.copy}>Continue with any verified Google account. Admin access will be reviewed for this salon before it is activated.</Text>
              <Pressable disabled={busy || !googleConfigured} style={s.google} onPress={() => void startGoogleSignIn()}>
                {busy ? <ActivityIndicator color="#20352d" /> : <><Ionicons name="logo-google" size={18} color="#4285F4" /><Text style={s.googleText}>{googleConfigured ? "Continue with Google" : "Google sign-in needs setup"}</Text></>}
              </Pressable>
            </>
          )}
          {role === "user" ? (
            <>
              <Text style={s.helperText}>New customers can sign in with their mobile number.</Text>
              <Pressable style={s.roleSwitch} onPress={() => selectRole("admin")}>
                <View style={s.roleSwitchIcon}><Ionicons name="storefront-outline" size={18} color="#c55239" /></View>
                <View style={s.roleSwitchCopy}><Text style={s.roleSwitchTitle}>Salon team</Text><Text style={s.roleSwitchDescription}>Sign in to manage your salon</Text></View>
                <Ionicons name="chevron-forward" size={17} color="#a7afa9" />
              </Pressable>
            </>
          ) : (
            <Pressable style={s.roleSwitch} onPress={() => selectRole("user")}>
              <View style={s.roleSwitchIcon}><Ionicons name="person-outline" size={18} color="#c55239" /></View>
              <View style={s.roleSwitchCopy}><Text style={s.roleSwitchTitle}>Customer sign in</Text><Text style={s.roleSwitchDescription}>Book and manage salon visits</Text></View>
              <Ionicons name="chevron-forward" size={17} color="#a7afa9" />
            </Pressable>
          )}
          </Animated.View>
        </ScrollView>
        <Modal
          visible={Boolean(locationPrompt)}
          transparent
          animationType="fade"
          onRequestClose={() => setLocationPrompt(null)}
        >
          <View style={s.modalBackdrop}>
            <View style={s.locationCard}>
              <View style={s.locationIcon}>
                <Ionicons name="location" size={24} color="#fffdfa" />
              </View>
              <Text style={s.locationEyebrow}>NEARBY SALONS</Text>
              <Text style={s.locationTitle}>{locationPrompt?.title}</Text>
              <Text style={s.locationMessage}>{locationPrompt?.message}</Text>
              <Pressable style={s.locationPrimary} onPress={() => {
                const action = locationPrompt?.action;
                setLocationPrompt(null);
                if (action === "request") void requestLocationAccess();
                else void Linking.openSettings();
              }}>
                <Ionicons name={locationPrompt?.action === "request" ? "location-outline" : "settings-outline"} size={17} color="#fffdfa" />
                <Text style={s.locationPrimaryText}>{locationPrompt?.action === "request" ? "Allow location" : "Open Settings"}</Text>
              </Pressable>
              <Pressable style={s.locationSecondary} onPress={() => setLocationPrompt(null)}>
                <Text style={s.locationSecondaryText}>Not now</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 18, paddingBottom: 34 },
  hero: {
    backgroundColor: "#20352d",
    borderRadius: 26,
    padding: 22,
    minHeight: 225,
    justifyContent: "space-between",
    marginBottom: 16,
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
  formSurface: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e5e1d8", borderRadius: 24, padding: 20, shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  title: { color: "#20352d", fontSize: 28, fontWeight: "800", marginTop: 8 },
  copy: { color: "#77817c", lineHeight: 20, marginTop: 8, marginBottom: 18 },
  roles: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 8 },
  role: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 13,
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
    borderRadius: 13,
    padding: 14,
    color: "#20352d",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 15,
  },
  countryCode: {
    color: "#20352d",
    fontWeight: "700",
    paddingLeft: 14,
  },
  phoneInput: {
    flex: 1,
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
    borderRadius: 15,
    minHeight: 54,
    flexDirection: "row",
    gap: 8,
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
  helperText: { color: "#77817c", textAlign: "center", marginTop: 17, fontSize: 12, lineHeight: 18 },
  roleSwitch: { minHeight: 58, flexDirection: "row", alignItems: "center", backgroundColor: "#fdfbf7", borderWidth: 1, borderColor: "#eee9df", borderRadius: 15, paddingHorizontal: 10, marginTop: 18 },
  roleSwitchIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#fff1ed", alignItems: "center", justifyContent: "center", marginRight: 10 },
  roleSwitchCopy: { flex: 1 },
  roleSwitchTitle: { color: "#20352d", fontSize: 12, fontWeight: "800" },
  roleSwitchDescription: { color: "#77817c", fontSize: 10, marginTop: 3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(20, 38, 31, 0.58)",
    justifyContent: "center",
    padding: 24,
  },
  locationCard: {
    backgroundColor: "#fffdfa",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#20352d",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  locationIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#20352d",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  locationEyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  locationTitle: {
    color: "#20352d",
    fontSize: 25,
    fontWeight: "700",
    marginTop: 8,
  },
  locationMessage: {
    color: "#77817c",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 22,
  },
  locationPrimary: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#c55239",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationPrimaryText: { color: "#fffdfa", fontWeight: "800" },
  locationSecondary: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 8,
  },
  locationSecondaryText: { color: "#77817c", fontWeight: "700" },
});

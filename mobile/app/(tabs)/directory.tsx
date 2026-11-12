import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../src/api";
import { AccountDrawer } from "../../src/components/AccountDrawer";

type Salon = {
  id: string;
  name: string;
  location?: string;
  services: string[];
  stylists: string[];
  branches?: unknown[];
};
export default function Directory() {
  const { hairstyle } = useLocalSearchParams<{ hairstyle?: string }>();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      setSalons(await api<Salon[]>("/salon/directory"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load salons.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    api<{ name?: string; email?: string }>("/customers/me")
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        <View style={s.topBar}>
          <View>
            <Text style={s.eyebrow}>FIND YOUR SALON</Text>
            <Text style={s.title}>Make space for good hair days.</Text>
          </View>
          <AccountDrawer profile={profile} />
        </View>
        <Text style={s.copy}>
          Browse salons, services, and stylists before requesting your
          appointment.
        </Text>
        <AiDemoCard />
        {error ? <Text style={s.error}>{error}</Text> : null}
        {salons.map((salon) => (
          <View style={s.card} key={salon.id}>
            <Text style={s.cardTitle}>{salon.name}</Text>
            <Text style={s.muted}>{salon.location || "Location not set"}</Text>
            <Text style={s.muted}>
              {salon.services.length} services · {salon.stylists.length}{" "}
              stylists
            </Text>
            <Pressable
              style={s.primary}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/appointments",
                  params: { salonId: salon.id, booking: "1", hairstyle },
                })
              }
            >
              <Text style={s.primaryText}>View and book</Text>
            </Pressable>
          </View>
        ))}
        {!loading && !error && !salons.length ? (
          <View style={s.empty}>
            <Text style={s.cardTitle}>No salons available yet</Text>
            <Text style={s.muted}>
              Salons will appear here when they open bookings.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AiDemoCard() {
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const steps = [
    ["01", "Upload a photo", "Your private starting point"],
    ["02", "AI reads your look", "Visible hair and face characteristics"],
    ["03", "Explore five ideas", "Salon-ready recommendations"],
    ["04", "See it on you", "A more confident hair decision"],
  ];
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [steps.length]);
  useEffect(() => {
    fade.setValue(0.25);
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade, step]);
  const current = steps[step];
  return (
    <View style={s.demoCard}>
      <View style={s.demoHeader}>
        <View>
          <Text style={s.demoEyebrow}>HOW HALO WORKS</Text>
          <Text style={s.demoTitle}>From photo to good hair day.</Text>
        </View>
        <Text style={s.demoSpark}>✦</Text>
      </View>
      <Animated.View style={[s.demoStage, { opacity: fade }]}>
        <View style={s.demoNumber}>
          <Text style={s.demoNumberText}>{current[0]}</Text>
        </View>
        <View style={s.demoStageCopy}>
          <Text style={s.demoStageTitle}>{current[1]}</Text>
          <Text style={s.demoStageText}>{current[2]}</Text>
        </View>
        <View style={s.demoProgress}>
          {steps.map((item, index) => (
            <View
              key={item[0]}
              style={[s.demoDot, index === step && s.demoDotActive]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: "#20352d",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 12,
    maxWidth: 275,
  },
  copy: { color: "#77817c", lineHeight: 20, marginTop: 8, marginBottom: 18 },
  card: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
  },
  cardTitle: { color: "#20352d", fontSize: 18, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 6 },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  empty: {
    backgroundColor: "#fffdfa",
    borderRadius: 14,
    padding: 20,
    marginTop: 22,
  },
  error: { color: "#a74e3d", marginVertical: 12 },
  demoCard: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  demoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  demoEyebrow: {
    color: "#91b3a3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  demoTitle: {
    color: "#20352d",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  demoSpark: { color: "#c55239", fontSize: 28, marginTop: -5 },
  demoStage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f5f0",
    borderRadius: 13,
    padding: 12,
    marginTop: 14,
  },
  demoNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#c55239",
    alignItems: "center",
    justifyContent: "center",
  },
  demoNumberText: { color: "#fff", fontWeight: "800" },
  demoStageCopy: { flex: 1, marginLeft: 11 },
  demoStageTitle: { color: "#20352d", fontWeight: "800", fontSize: 14 },
  demoStageText: { color: "#77817c", fontSize: 12, marginTop: 3 },
  demoProgress: { flexDirection: "row", gap: 4, marginLeft: 8 },
  demoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#91b3a3",
  },
  demoDotActive: { width: 14, backgroundColor: "#c55239" },
});

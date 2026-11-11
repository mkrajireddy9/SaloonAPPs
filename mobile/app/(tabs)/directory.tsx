import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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
                  pathname: "/(tabs)/salon/[id]",
                  params: { id: salon.id },
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
  primaryText: { color: "#fff", fontWeight: "700" },
  empty: {
    backgroundColor: "#fffdfa",
    borderRadius: 14,
    padding: 20,
    marginTop: 22,
  },
  error: { color: "#c55239", marginVertical: 12 },
});

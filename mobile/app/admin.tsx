import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, signOut } from "../src/api";
import { MoreScreen } from "../src/screens/MoreScreen";
import { SafeAreaView } from "react-native-safe-area-context";

type Summary = {
  analytics?: {
    totalBookings?: number;
    confirmedBookings?: number;
    requestedBookings?: number;
  };
  customers?: unknown[];
};
type Me = { email?: string; role?: "admin" | "platform_admin" };
type PlatformSalon = {
  id: string;
  name: string;
  location: string;
  tenantCode?: string | null;
  active: boolean;
};

export default function Admin() {
  const [me, setMe] = useState<Me>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [salons, setSalons] = useState<PlatformSalon[]>([]);
  const [section, setSection] = useState<string>();
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const identity = await api<Me>("/auth/me");
        setMe(identity);
        setSummary(await api<Summary>("/dashboard/summary"));
        if (identity.role === "platform_admin")
          setSalons(await api<PlatformSalon[]>("/salon/platform/salons"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load workspace.");
      }
    })();
  }, []);

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (section)
    return (
      <SafeAreaView style={s.safe}>
        <MoreScreen
          role="admin"
          email={me.email || ""}
          initialSection={section}
          showBack
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>
            {me.role === "platform_admin" ? "PLATFORM WORKSPACE" : "STUDIO WORKSPACE"}
          </Text>
          <Text style={s.title}>Halo admin</Text>
        </View>
        <Pressable onPress={() => void logout()}>
          <Text style={s.signOut}>Sign out</Text>
        </Pressable>
      </View>
      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : !summary ? (
        <ActivityIndicator color="#c55239" style={s.loader} />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.copy}>Keep the salon experience thoughtful and in sync.</Text>
          <View style={s.metrics}>
            <Metric label="Bookings" value={summary.analytics?.totalBookings || 0} />
            <Metric label="Confirmed" value={summary.analytics?.confirmedBookings || 0} />
            <Metric label="Requests" value={summary.analytics?.requestedBookings || 0} />
            <Metric label="Customers" value={summary.customers?.length || 0} />
          </View>
          <Text style={s.sectionTitle}>Studio tools</Text>
          <Action label="Salon setup" onPress={() => setSection("salon")} />
          <Action label="Customers" onPress={() => setSection("customers")} />
          <Action label="Prices and services" onPress={() => setSection("prices")} />
          <Action label="Products" onPress={() => setSection("products")} />
          {me.role === "platform_admin" && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Platform salons</Text>
              {salons.map((salon) => (
                <Text style={s.cardText} key={salon.id}>
                  {salon.name} · {salon.active ? "Active" : "Inactive"}
                  {salon.tenantCode ? ` · ${salon.tenantCode}` : ""}
                </Text>
              ))}
              {!salons.length && <Text style={s.cardText}>No salons created yet.</Text>}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={s.action} onPress={onPress}>
      <Text style={s.actionText}>{label}</Text>
      <Text style={s.arrow}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f5f0" },
  header: {
    backgroundColor: "#20352d",
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: { color: "#91b3a3", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#f7f5f0", fontSize: 28, fontWeight: "700", marginTop: 6 },
  signOut: { color: "#dfca73", fontWeight: "700" },
  content: { padding: 22, paddingBottom: 40 },
  copy: { color: "#77817c", lineHeight: 20, marginBottom: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "47%", backgroundColor: "#fffdfa", borderRadius: 12, padding: 16 },
  metricValue: { color: "#20352d", fontSize: 25, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 4 },
  sectionTitle: { color: "#20352d", fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  action: { backgroundColor: "#fffdfa", borderRadius: 10, padding: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  actionText: { color: "#20352d", fontWeight: "700" },
  arrow: { color: "#c55239", fontSize: 22, lineHeight: 16 },
  card: { backgroundColor: "#fffdfa", borderRadius: 12, padding: 16, marginTop: 12 },
  cardText: { color: "#77817c", marginTop: 8 },
  loader: { marginTop: 40 },
  error: { color: "#c55239", padding: 22 },
});

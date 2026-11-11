import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/api";
import { AccountDrawer } from "../../src/components/AccountDrawer";
import { SafeAreaView } from "react-native-safe-area-context";

type Profile = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  texture?: string;
  length?: string;
  preferredStylist?: string;
};
type HistoryItem = {
  id: string;
  service: string;
  date: string;
  time: string;
  stylist?: string;
  status: string;
  price?: number;
};
export default function Account() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const [nextProfile, nextHistory] = await Promise.all([
        api<Profile>("/customers/me"),
        api<{ items: HistoryItem[] }>(
          "/customers/me/history?page=1&pageSize=20",
        ),
      ]);
      setProfile(nextProfile);
      setHistory(nextHistory.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load account.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const update = (key: keyof Profile, value: string) =>
    setProfile((current) => ({ ...(current || {}), [key]: value }));
  const save = async () => {
    if (!profile) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await api<Profile>("/customers/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setProfile(saved);
      setEditing(false);
      setMessage("Profile saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  };
  if (!profile && !error)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#c55239" />
      </View>
    );
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.accountHeader}>
          <View style={s.headerStart}>
            <Pressable onPress={() => router.back()} style={s.backButton}>
              <Text style={s.backText}>‹</Text>
            </Pressable>
            <View>
              <Text style={s.eyebrow}>YOUR PROFILE</Text>
              <Text style={s.title}>{profile?.name || "Your account"}</Text>
            </View>
          </View>
          <AccountDrawer profile={profile} />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.card}>
          {(
            [
              "name",
              "email",
              "phone",
              "location",
              "texture",
              "length",
              "preferredStylist",
            ] as (keyof Profile)[]
          ).map((key) => (
            <View key={key}>
              <Text style={s.label}>
                {key === "preferredStylist"
                  ? "Preferred stylist"
                  : key[0].toUpperCase() + key.slice(1)}
              </Text>
              {editing && key !== "email" ? (
                <TextInput
                  value={profile?.[key] || ""}
                  onChangeText={(value) => update(key, value)}
                  style={s.input}
                />
              ) : (
                <Text style={s.value}>{profile?.[key] || "Not added"}</Text>
              )}
            </View>
          ))}
        </View>
        <Pressable
          disabled={busy}
          style={s.primary}
          onPress={() => (editing ? void save() : setEditing(true))}
        >
          <Text style={s.primaryText}>
            {editing ? (busy ? "Saving..." : "Save profile") : "Edit profile"}
          </Text>
        </Pressable>
        {message ? (
          <Text style={message === "Profile saved." ? s.success : s.error}>
            {message}
          </Text>
        ) : null}
        <Text style={s.sectionTitle}>Appointment history</Text>
        {history.map((item) => (
          <View style={s.history} key={item.id}>
            <Text style={s.cardTitle}>{item.service}</Text>
            <Text style={s.muted}>
              {item.date} · {item.time} ·{" "}
              {item.stylist || "Stylist to be confirmed"}
            </Text>
            <Text style={s.status}>
              {item.status}
              {item.price ? ` · ₹${item.price}` : ""}
            </Text>
          </View>
        ))}
        {!history.length ? (
          <Text style={s.muted}>No appointment history yet.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f5f0",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerStart: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: {
    width: 32,
    height: 40,
    justifyContent: "center",
    marginRight: 4,
  },
  backText: { color: "#20352d", fontSize: 34, lineHeight: 34 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#20352d", fontSize: 30, fontWeight: "700", marginTop: 12 },
  card: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 22,
  },
  label: { color: "#77817c", fontSize: 11, marginTop: 12 },
  value: { color: "#20352d", fontSize: 16, marginTop: 4 },
  input: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 7,
    padding: 10,
    marginTop: 4,
  },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 9,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  sectionTitle: {
    color: "#20352d",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 28,
  },
  history: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  cardTitle: { color: "#20352d", fontSize: 16, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 6 },
  status: { color: "#4c947d", fontWeight: "700", marginTop: 7 },
  success: { color: "#4c947d", textAlign: "center", marginTop: 10 },
  error: { color: "#c55239", marginTop: 12 },
  logout: {
    borderColor: "#c55239",
    borderWidth: 1,
    borderRadius: 9,
    padding: 14,
    alignItems: "center",
    marginTop: 28,
  },
  logoutText: { color: "#c55239", fontWeight: "700" },
});

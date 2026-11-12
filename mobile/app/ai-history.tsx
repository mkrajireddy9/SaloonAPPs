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
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api";

type HistoryItem = {
  id: string;
  status: string;
  createdAt: string;
  profile?: Record<string, string> | null;
  recommendations?: { name: string }[];
  jobs?: { status: string }[];
};

export default function AiHistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<HistoryItem[]>("/ai/hairstyle/history")
      .then(setItems)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load AI history."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.eyebrow}>HALO AI STUDIO</Text>
        <Text style={s.title}>Your look history</Text>
        <Text style={s.copy}>
          Your private hairstyle sessions and generation status.
        </Text>
        {loading ? <ActivityIndicator color="#c55239" /> : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
        {!loading && !items.length ? (
          <View style={s.empty}>
            <Text style={s.cardTitle}>No sessions yet</Text>
            <Text style={s.muted}>
              Create your first hairstyle preview when you are ready.
            </Text>
            <Pressable
              style={s.primary}
              onPress={() => router.replace("/hairstyle")}
            >
              <Text style={s.primaryText}>Start a session</Text>
            </Pressable>
          </View>
        ) : null}
        {items.map((item) => (
          <View key={item.id} style={s.card}>
            <Text style={s.cardTitle}>
              {item.profile?.currentStyle || "Hairstyle consultation"}
            </Text>
            <Text style={s.muted}>
              {new Date(item.createdAt).toLocaleDateString()} · {item.status}
            </Text>
            <Text style={s.muted}>
              {item.recommendations?.length || 0} recommendations ·{" "}
              {item.jobs?.[0]?.status || "No preview generated"}
            </Text>
            <Pressable
              style={s.secondary}
              onPress={() =>
                router.push({
                  pathname: "/hairstyle",
                  params: { sessionId: item.id },
                })
              }
            >
              <Text style={s.secondaryText}>Open session</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 48 },
  back: { color: "#20352d", fontSize: 16, marginBottom: 22 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: { color: "#20352d", fontSize: 32, fontWeight: "800", marginTop: 8 },
  copy: { color: "#77817c", lineHeight: 20, marginTop: 8, marginBottom: 18 },
  empty: { backgroundColor: "#fffdfa", borderRadius: 16, padding: 18 },
  card: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: { color: "#20352d", fontSize: 17, fontWeight: "800" },
  muted: { color: "#77817c", lineHeight: 19, marginTop: 6 },
  primary: {
    backgroundColor: "#c55239",
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: {
    borderWidth: 1,
    borderColor: "#c55239",
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryText: { color: "#c55239", fontWeight: "800" },
  error: { color: "#c55239", marginTop: 16 },
});

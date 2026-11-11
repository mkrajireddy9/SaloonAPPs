import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { api } from "../../src/api";
import { SafeAreaView } from "react-native-safe-area-context";

type Appointment = {
  id: string;
  service: string;
  date: string;
  time: string;
  stylist?: string;
  status: string;
};
function AppointmentCard({
  item,
  onChanged,
}: {
  item: Appointment;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = async (path: string, body?: object) => {
    setBusy(true);
    setMessage("");
    try {
      await api(`/appointments/${item.id}/${path}`, {
        method: "PATCH",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(path === "cancel" ? "Cancelled" : "Rescheduled");
      onChanged();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to update appointment.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{item.service}</Text>
      <Text style={s.muted}>
        {item.date} · {item.time}
      </Text>
      <Text style={s.muted}>{item.stylist || "Stylist to be confirmed"}</Text>
      <Text style={s.status}>{item.status}</Text>
      {item.status !== "Cancelled" ? (
        <>
          <View style={s.row}>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={s.smallInput}
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              value={time}
              onChangeText={setTime}
              style={s.smallInput}
              placeholder="Time"
            />
          </View>
          <View style={s.row}>
            <Pressable
              disabled={busy}
              onPress={() => void update("reschedule", { date, time })}
            >
              <Text style={s.action}>Reschedule</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void update("cancel")}>
              <Text style={s.action}>Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {message ? (
        <Text
          style={
            message === "Cancelled" || message === "Rescheduled"
              ? s.success
              : s.error
          }
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
export default function Appointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      setItems(await api<Appointment[]>("/appointments"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
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
        <Text style={s.eyebrow}>YOUR VISITS</Text>
        <Text style={s.title}>Your next salon moment.</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {items.map((item) => (
          <AppointmentCard
            item={item}
            key={item.id}
            onChanged={() => void load()}
          />
        ))}
        {!loading && !error && !items.length ? (
          <View style={s.empty}>
            <Text style={s.cardTitle}>No appointments yet</Text>
            <Text style={s.muted}>Your next good hair day can start here.</Text>
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
  },
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
  status: { color: "#4c947d", fontWeight: "700", marginTop: 8 },
  row: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  smallInput: {
    flex: 1,
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 7,
    padding: 9,
  },
  action: { color: "#c55239", fontWeight: "700", marginRight: 16 },
  success: { color: "#4c947d", marginTop: 10 },
  empty: {
    backgroundColor: "#fffdfa",
    borderRadius: 14,
    padding: 20,
    marginTop: 22,
  },
  error: { color: "#c55239", marginVertical: 12 },
});

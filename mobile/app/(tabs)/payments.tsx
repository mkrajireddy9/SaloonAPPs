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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Payment = {
  id?: string;
  appointmentId?: string;
  description?: string;
  amount?: number;
  total?: number;
  status?: string;
  createdAt?: string;
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Payment[]>("/payments")
      .then((result) => setPayments(Array.isArray(result) ? result : []))
      .catch((error) =>
        setMessage(
          error instanceof Error ? error.message : "Unable to load payments.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const createIntent = async () => {
    if (!appointmentId.trim()) {
      setMessage("Enter the appointment ID you want to pay for.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await api<any>("/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: appointmentId.trim(),
          ...(couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}),
          idempotencyKey: `${appointmentId.trim()}-mobile-${Date.now()}`,
        }),
      });
      setMessage(
        result.message ||
          `Payment created: ${result.invoiceNumber || result.payment?.invoiceNumber || "ready for checkout"}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not start payment.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>YOUR PAYMENTS</Text>
        <Text style={s.title}>Payments and invoices</Text>
        <Text style={s.subtitle}>
          Keep your appointment payments and invoices together.
        </Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>Pay for an appointment</Text>
          <Text style={s.cardCopy}>
            Enter your appointment ID to create a secure payment request.
          </Text>
          <TextInput
            value={appointmentId}
            onChangeText={setAppointmentId}
            placeholder="Enter your appointment ID"
            placeholderTextColor="#9aa19c"
            style={s.input}
          />
          <TextInput
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
            placeholder="Enter a coupon code (optional)"
            placeholderTextColor="#9aa19c"
            style={s.input}
          />
          <Pressable
            disabled={busy}
            style={s.primary}
            onPress={() => void createIntent()}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryText}>Start payment</Text>
            )}
          </Pressable>
        </View>
        {message ? (
          <Text
            style={
              message.includes("created") || message.includes("ready")
                ? s.success
                : s.error
            }
          >
            {message}
          </Text>
        ) : null}
        <View style={s.historyHeader}>
          <View><Text style={s.sectionTitle}>Payment history</Text><Text style={s.historySubtitle}>{payments.length ? `${payments.length} transaction${payments.length === 1 ? "" : "s"}` : "Your completed payments will appear here"}</Text></View>
          <View style={s.historyIcon}><Ionicons name="receipt-outline" size={20} color="#4c947d" /></View>
        </View>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#c55239" />
          </View>
        ) : payments.length ? (
          payments.map((item, index) => (
            <View
              style={s.paymentRow}
              key={item.id || `${item.appointmentId}-${index}`}
            >
              <View style={s.paymentIcon}><Ionicons name="card-outline" size={19} color="#c55239" /></View>
              <View style={s.rowCopy}>
                <Text style={s.rowTitle}>
                  {item.description || item.appointmentId || "Salon payment"}
                </Text>
                <Text style={s.muted}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "Date unavailable"}
                </Text>
              </View>
              <View>
                <Text style={s.amount}>₹{Number(item.amount || item.total || 0).toLocaleString("en-IN")}</Text>
                <Text style={[s.status, String(item.status || "Pending").toLowerCase() === "paid" ? s.statusPaid : s.statusPending]}>{item.status || "Pending"}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={s.emptyHistory}><View style={s.emptyHistoryIcon}><Ionicons name="receipt-outline" size={25} color="#4c947d" /></View><Text style={s.emptyEyebrow}>YOUR PAYMENT SPACE</Text><Text style={s.emptyTitle}>Nothing here yet</Text><Text style={s.emptyText}>Once you pay for a salon appointment, your invoice and payment status will appear here.</Text></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 44 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: { color: "#20352d", fontSize: 31, fontWeight: "800", marginTop: 8 },
  subtitle: {
    color: "#77817c",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },
  card: { backgroundColor: "#20352d", borderRadius: 16, padding: 18 },
  cardTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  cardCopy: { color: "#c8d2cb", lineHeight: 20, marginTop: 8 },
  input: {
    height: 48,
    borderRadius: 9,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 13,
    color: "#20352d",
    marginTop: 16,
  },
  primary: {
    minHeight: 48,
    borderRadius: 9,
    backgroundColor: "#c55239",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  success: { color: "#4c947d", marginTop: 14 },
  error: { color: "#c55239", marginTop: 14 },
  sectionTitle: {
    color: "#20352d",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 3,
  },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  historySubtitle: { color: "#77817c", fontSize: 11 },
  historyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#e7f1ed", alignItems: "center", justifyContent: "center" },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
  },
  paymentIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#fff1ed", alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowCopy: { flex: 1 },
  rowTitle: { color: "#20352d", fontWeight: "800" },
  muted: { color: "#77817c", marginTop: 5 },
  amount: { color: "#c55239", fontWeight: "800", textAlign: "right" },
  status: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },
  statusPaid: { color: "#26735a" },
  statusPending: { color: "#93631d" },
  emptyHistory: { width: "100%", alignSelf: "stretch", alignItems: "center", justifyContent: "center", backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#dfe8e2", borderRadius: 20, paddingHorizontal: 24, paddingVertical: 28 },
  emptyHistoryIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: "#e7f1ed", alignItems: "center", justifyContent: "center", marginBottom: 13 },
  emptyEyebrow: { color: "#4c947d", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  emptyTitle: { color: "#20352d", fontSize: 17, fontWeight: "800", marginTop: 6, textAlign: "center", width: "100%" },
  emptyText: { color: "#77817c", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 },
  center: { alignItems: "center", padding: 28 },
});

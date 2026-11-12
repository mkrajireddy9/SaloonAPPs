import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { api, signOut } from "../src/api";
import { MoreScreen } from "../src/screens/MoreScreen";

type Role = "admin" | "platform_admin";
type Me = { email?: string; role?: Role };
type Analytics = {
  totalBookings?: number;
  confirmedBookings?: number;
  requestedBookings?: number;
  revenue?: number;
};
type Summary = { analytics?: Analytics; customers?: unknown[] };
type PlatformSalon = {
  id: string;
  name: string;
  location: string;
  tenantCode?: string | null;
  active: boolean;
  admin?: { email?: string; approvalStatus?: string } | null;
};
type PlatformMetrics = { salon: PlatformSalon; metrics?: Analytics };
type AdminRequest = {
  id: string;
  name: string;
  email: string;
  adminApprovalStatus?: string;
  salon?: { name?: string; tenantCode?: string } | null;
};

export default function Admin() {
  const [me, setMe] = useState<Me>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [salons, setSalons] = useState<PlatformSalon[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [section, setSection] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const identity = await api<Me>("/auth/me");
      setMe(identity);
      if (identity.role === "platform_admin") {
        const [salonList, platformSummary, adminRequests] = await Promise.all([
          api<PlatformSalon[]>("/salon/platform/salons"),
          api<{ items: PlatformMetrics[] }>("/dashboard/platform"),
          api<AdminRequest[]>("/auth/admin-requests"),
        ]);
        setSalons(salonList);
        setMetrics(platformSummary.items || []);
        setRequests(adminRequests);
      } else {
        setSummary(await api<Summary>("/dashboard/summary"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (section && me.role === "admin")
    return (
      <SafeAreaView style={s.safe}>
        <MoreScreen role="admin" email={me.email || ""} initialSection={section} showBack />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>
            {me.role === "platform_admin" ? "PLATFORM WORKSPACE" : "STUDIO WORKSPACE"}
          </Text>
          <Text style={s.title}>{me.role === "platform_admin" ? "Platform admin" : "Halo admin"}</Text>
        </View>
        <Pressable onPress={() => void logout()}>
          <Text style={s.signOut}>Sign out</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color="#c55239" style={s.loader} />
      ) : error ? (
        <View style={s.content}>
          <Text style={s.error}>{error}</Text>
          <Action label="Try again" onPress={() => void load()} />
        </View>
      ) : me.role === "platform_admin" ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <PlatformWorkspace
            salons={salons}
            metrics={metrics}
            requests={requests}
            onRefresh={load}
            onError={setError}
          />
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <StudioWorkspace summary={summary} onSelect={setSection} />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function StudioWorkspace({
  summary,
  onSelect,
}: {
  summary: Summary | null;
  onSelect: (section: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.copy}>Keep the salon experience thoughtful and in sync.</Text>
      <View style={s.metrics}>
        <Metric label="Bookings" value={summary?.analytics?.totalBookings || 0} />
        <Metric label="Confirmed" value={summary?.analytics?.confirmedBookings || 0} />
        <Metric label="Requests" value={summary?.analytics?.requestedBookings || 0} />
        <Metric label="Customers" value={summary?.customers?.length || 0} />
      </View>
      <Text style={s.sectionTitle}>Studio tools</Text>
      <Action label="Salon setup" onPress={() => onSelect("salon")} />
      <Action label="Appointments" onPress={() => onSelect("appointments")} />
      <Action label="Reports and analytics" onPress={() => onSelect("reports")} />
      <Action label="Customers" onPress={() => onSelect("customers")} />
      <Action label="Prices and services" onPress={() => onSelect("prices")} />
      <Action label="Products" onPress={() => onSelect("products")} />
      <Action label="Consultations" onPress={() => onSelect("consultations")} />
      <Action label="Offers and banners" onPress={() => onSelect("banners")} />
      <Action label="Branding" onPress={() => onSelect("theme")} />
      <Action label="Private media" onPress={() => onSelect("media")} />
      <Action label="Review moderation" onPress={() => onSelect("reviews")} />
      <Action label="Payments and invoices" onPress={() => onSelect("payments")} />
      <Action label="Hair passport" onPress={() => onSelect("passport")} />
      <Action label="Notification preferences" onPress={() => onSelect("notifications")} />
    </ScrollView>
  );
}

function PlatformWorkspace({
  salons,
  metrics,
  requests,
  onRefresh,
  onError,
}: {
  salons: PlatformSalon[];
  metrics: PlatformMetrics[];
  requests: AdminRequest[];
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState("");
  const activeCount = salons.filter((salon) => salon.active).length;
  const totals = useMemo(
    () =>
      metrics.reduce(
        (total, item) => ({
          bookings: total.bookings + (item.metrics?.totalBookings || 0),
          confirmed: total.confirmed + (item.metrics?.confirmedBookings || 0),
          revenue: total.revenue + (item.metrics?.revenue || 0),
        }),
        { bookings: 0, confirmed: 0, revenue: 0 },
      ),
    [metrics],
  );

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    onError("");
    try {
      await action();
      await onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const createSalon = () => {
    if (name.trim().length < 2 || location.trim().length < 2) {
      onError("Enter a salon name and location, each at least 2 characters.");
      return;
    }
    void run("create", async () => {
      await api<PlatformSalon>("/salon/platform/salons", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), location: location.trim() }),
      });
      setName("");
      setLocation("");
    });
  };

  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Text style={s.copy}>Monitor tenants, approve salon owners, and manage platform access.</Text>
      <View style={s.metrics}>
        <Metric label="Total salons" value={salons.length} />
        <Metric label="Active salons" value={activeCount} />
        <Metric label="Bookings" value={totals.bookings} />
        <Metric label="Confirmed" value={totals.confirmed} />
        <Metric label="Revenue" value={`₹${totals.revenue}`} />
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Bookings by salon</Text>
        {!metrics.length ? (
          <Text style={s.muted}>No salon activity yet.</Text>
        ) : (
          metrics.map((item) => {
            const value = item.metrics?.totalBookings || 0;
            const maximum = Math.max(
              ...metrics.map((entry) => entry.metrics?.totalBookings || 0),
              1,
            );
            return (
              <View key={item.salon.id} style={s.chartRow}>
                <View style={s.rowBetween}>
                  <Text style={s.muted}>{item.salon.name}</Text>
                  <Text style={s.cardTitle}>{value}</Text>
                </View>
                <View style={s.chartTrack}>
                  <View style={[s.chartBar, { width: `${Math.max((value / maximum) * 100, value ? 8 : 0)}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Create tenant</Text>
        <Text style={s.muted}>Create a salon workspace and share its tenant code with the owner.</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Salon name" style={s.input} />
        <TextInput value={location} onChangeText={setLocation} placeholder="Location" style={s.input} />
        <Action label={busy === "create" ? "Creating..." : "Create salon"} onPress={createSalon} disabled={Boolean(busy)} />
      </View>

      <Text style={s.sectionTitle}>Admin access requests</Text>
      <View style={s.card}>
        {!requests.length ? (
          <Text style={s.muted}>No pending admin access requests.</Text>
        ) : (
          requests.map((request) => (
            <View style={s.request} key={request.id}>
              <Text style={s.cardTitle}>{request.name}</Text>
              <Text style={s.muted}>{request.email}</Text>
              <Text style={s.muted}>
                {request.salon?.name || "Unknown salon"} · {request.adminApprovalStatus || "Pending"}
              </Text>
              <View style={s.inline}>
                <Action
                  label="Approve"
                  onPress={() =>
                    void run(`approve-${request.id}`, async () => {
                      await api(`/auth/admin-requests/${request.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ approved: true }),
                      });
                    })
                  }
                  disabled={Boolean(busy)}
                />
                <Action
                  label="Reject"
                  onPress={() =>
                    void run(`reject-${request.id}`, async () => {
                      await api(`/auth/admin-requests/${request.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ approved: false }),
                      });
                    })
                  }
                  disabled={Boolean(busy)}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={s.sectionTitle}>Tenant management</Text>
      {!salons.length ? (
        <View style={s.card}><Text style={s.muted}>No salons created yet.</Text></View>
      ) : (
        salons.map((salon) => (
          <View style={s.card} key={salon.id}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{salon.name}</Text>
                <Text style={s.muted}>{salon.location}</Text>
              </View>
              <Text style={salon.active ? s.active : s.inactive}>{salon.active ? "Active" : "Inactive"}</Text>
            </View>
            <Text style={s.code}>{salon.tenantCode || "No tenant code"}</Text>
            <Text style={s.muted}>Admin: {salon.admin?.email || "Awaiting registration"}</Text>
            <View style={s.inline}>
              <Action
                label={salon.active ? "Deactivate" : "Activate"}
                onPress={() =>
                  void run(`status-${salon.id}`, async () => {
                    await api(`/salon/platform/salons/${salon.id}/status`, {
                      method: "PATCH",
                      body: JSON.stringify({ active: !salon.active }),
                    });
                  })
                }
                disabled={Boolean(busy)}
              />
              <Action
                label="Rotate code"
                onPress={() =>
                  void run(`rotate-${salon.id}`, async () => {
                    await api(`/salon/platform/salons/${salon.id}/rotate-tenant-code`, { method: "POST" });
                  })
                }
                disabled={Boolean(busy)}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} style={[s.action, disabled && s.disabled]} onPress={onPress}>
      <Text style={s.actionText}>{label}</Text>
      <Text style={s.arrow}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f5f0" },
  header: { backgroundColor: "#20352d", padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
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
  card: { backgroundColor: "#fffdfa", borderRadius: 12, padding: 16, marginTop: 10 },
  cardTitle: { color: "#20352d", fontSize: 16, fontWeight: "700" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d9d8d1", borderRadius: 9, padding: 13, marginTop: 10, color: "#20352d" },
  action: { backgroundColor: "#edf5f1", borderRadius: 10, padding: 14, marginTop: 10, flexDirection: "row", justifyContent: "space-between", minWidth: 145 },
  actionText: { color: "#20352d", fontWeight: "700" },
  arrow: { color: "#c55239", fontSize: 21, lineHeight: 16 },
  request: { borderTopWidth: 1, borderTopColor: "#e5e1d9", paddingTop: 12, marginTop: 12 },
  chartRow: { marginTop: 12 },
  chartTrack: { height: 9, borderRadius: 5, backgroundColor: "#e7eee9", overflow: "hidden", marginTop: 6 },
  chartBar: { height: 9, borderRadius: 5, backgroundColor: "#c55239" },
  inline: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  code: { color: "#20352d", fontWeight: "700", letterSpacing: 1, marginTop: 14 },
  active: { color: "#26735a", fontWeight: "700" },
  inactive: { color: "#b34d38", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  loader: { marginTop: 40 },
  error: { color: "#c55239", marginBottom: 10, lineHeight: 20 },
});

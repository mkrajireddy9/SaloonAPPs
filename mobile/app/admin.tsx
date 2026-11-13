import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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
      if (identity.role !== "admin" && identity.role !== "platform_admin") {
        throw new Error("This account does not have admin workspace access.");
      }
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
        <MoreScreen
          role="admin"
          email={me.email || ""}
          initialSection={section}
          showBack
          onBack={() => setSection(undefined)}
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.headerIdentity}>
          <View style={s.headerAvatar}><Ionicons name="sparkles" size={20} color="#dfca73" /></View>
          <View style={s.headerCopy}>
          <Text numberOfLines={1} style={s.eyebrow}>
            {me.role === "platform_admin" ? "PLATFORM WORKSPACE" : "STUDIO WORKSPACE"}
          </Text>
          <Text numberOfLines={1} style={s.title}>{me.role === "platform_admin" ? "Platform admin" : "Halo admin"}</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={s.headerEmail}>{me.email || "Workspace overview"}</Text>
          </View>
        </View>
        <Pressable style={s.signOutButton} onPress={() => void logout()}>
          <Ionicons name="log-out-outline" size={18} color="#dfca73" />
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
      <View style={s.welcomeCard}>
        <View style={s.welcomeIcon}><Ionicons name="sparkles-outline" size={22} color="#fffdfa" /></View>
        <View style={s.welcomeCopy}><Text style={s.welcomeTitle}>Your studio at a glance</Text><Text style={s.welcomeText}>Manage today’s work and keep every guest detail in one place.</Text></View>
      </View>
      <View style={s.metrics}>
        <Metric label="Bookings" value={summary?.analytics?.totalBookings || 0} icon="calendar-outline" />
        <Metric label="Confirmed" value={summary?.analytics?.confirmedBookings || 0} icon="checkmark-circle-outline" />
        <Metric label="Requests" value={summary?.analytics?.requestedBookings || 0} icon="notifications-outline" />
        <Metric label="Customers" value={summary?.customers?.length || 0} icon="people-outline" />
      </View>
      <Text style={s.sectionTitle}>Studio tools</Text>
      <Text style={s.muted}>Choose a workspace area to manage your salon.</Text>
      <ToolGroup title="Daily work" items={[
        ["Appointments", "appointments"],
        ["Customers", "customers"],
        ["Consultations", "consultations"],
        ["Review moderation", "reviews"],
      ]} onSelect={onSelect} />
      <ToolGroup title="Salon setup" items={[
        ["Salon setup", "salon"],
        ["Prices and services", "prices"],
        ["Products", "products"],
        ["Offers and banners", "banners"],
        ["Branding", "theme"],
        ["Private media", "media"],
      ]} onSelect={onSelect} />
      <ToolGroup title="Insights and account" items={[
        ["Reports and analytics", "reports"],
        ["Payments and invoices", "payments"],
        ["Hair passport", "passport"],
        ["Notification preferences", "notifications"],
      ]} onSelect={onSelect} />
    </ScrollView>
  );
}

function ToolGroup({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: string[][];
  onSelect: (section: string) => void;
}) {
  return (
    <View>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.toolGrid}>
        {items.map(([label, section]) => (
          <Action key={section} label={label} compact onPress={() => onSelect(section)} />
        ))}
      </View>
    </View>
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "bookings">("all");
  const filteredSalons = salons.filter((salon) => {
    const matchesSearch = !search.trim() || `${salon.name} ${salon.location}`.toLowerCase().includes(search.trim().toLowerCase());
    const metric = metrics.find((item) => item.salon.id === salon.id);
    const matchesFilter = filter === "all" || (filter === "active" ? salon.active : filter === "inactive" ? !salon.active : (metric?.metrics?.totalBookings || 0) > 0);
    return matchesSearch && matchesFilter;
  });
  const filteredMetrics = metrics.filter((item) => filteredSalons.some((salon) => salon.id === item.salon.id));
  const activeCount = filteredSalons.filter((salon) => salon.active).length;
  const totals = useMemo(
    () =>
      filteredMetrics.reduce(
        (total, item) => ({
          bookings: total.bookings + (item.metrics?.totalBookings || 0),
          confirmed: total.confirmed + (item.metrics?.confirmedBookings || 0),
          revenue: total.revenue + (item.metrics?.revenue || 0),
        }),
        { bookings: 0, confirmed: 0, revenue: 0 },
      ),
    [filteredMetrics],
  );
  const maximumBookings = Math.max(...filteredMetrics.map((item) => item.metrics?.totalBookings || 0), 1);
  const maximumRevenue = Math.max(...filteredMetrics.map((item) => item.metrics?.revenue || 0), 1);

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
      <View style={s.platformHero}>
        <View style={s.platformHeroIcon}><Ionicons name="bar-chart-outline" size={24} color="#dfca73" /></View>
        <View style={{ flex: 1 }}><Text style={s.platformHeroTitle}>Platform health</Text><Text style={s.platformHeroText}>A live view of tenant activity, access, and revenue.</Text></View>
        <Pressable style={s.refreshButton} onPress={() => void onRefresh()}><Ionicons name="refresh-outline" size={19} color="#20352d" /></Pressable>
      </View>
      <View style={s.metrics}>
        <Metric label="Total salons" value={filteredSalons.length} icon="business-outline" />
        <Metric label="Active salons" value={activeCount} icon="checkmark-circle-outline" />
        <Metric label="Bookings" value={totals.bookings} icon="calendar-outline" />
        <Metric label="Confirmed" value={totals.confirmed} icon="sparkles-outline" />
        <Metric label="Revenue" value={`₹${totals.revenue}`} icon="trending-up-outline" />
      </View>
      <View style={s.filterCard}>
        <Text style={s.filterTitle}>Filter platform data</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search salons" style={s.input} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterChips}>
          {([['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive'], ['bookings', 'With bookings']] as const).map(([value, label]) => (
            <Pressable key={value} style={[s.filterChip, filter === value && s.filterChipActive]} onPress={() => setFilter(value)}>
              <Text style={[s.filterChipText, filter === value && s.filterChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.filterResult}>Showing {filteredSalons.length} of {salons.length} salons</Text>
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Bookings by salon</Text>
        {!filteredMetrics.length ? (
          <Text style={s.muted}>No salon activity yet.</Text>
        ) : (
          filteredMetrics.map((item) => {
            const value = item.metrics?.totalBookings || 0;
            return (
              <View key={item.salon.id} style={s.chartRow}>
                <View style={s.rowBetween}>
                  <Text style={s.muted}>{item.salon.name}</Text>
                  <Text style={s.cardTitle}>{value}</Text>
                </View>
                <View style={s.chartTrack}>
                  <View style={[s.chartBar, { width: `${Math.max((value / maximumBookings) * 100, value ? 8 : 0)}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Revenue by salon</Text>
        {!filteredMetrics.length ? <Text style={s.muted}>No revenue data yet.</Text> : filteredMetrics.map((item) => {
          const value = item.metrics?.revenue || 0;
          return <View key={item.salon.id} style={s.chartRow}>
            <View style={s.rowBetween}><Text style={s.muted}>{item.salon.name}</Text><Text style={s.cardTitle}>₹{value.toLocaleString("en-IN")}</Text></View>
            <View style={s.chartTrack}><View style={[s.revenueBar, { width: `${Math.max((value / maximumRevenue) * 100, value ? 8 : 0)}%` }]} /></View>
          </View>;
        })}
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
        filteredSalons.map((salon) => (
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

function Metric({ label, value, icon = "ellipse-outline" }: { label: string; value: number | string; icon?: any }) {
  return (
    <View style={s.metric}>
      <View style={s.metricIcon}><Ionicons name={icon} size={17} color="#c55239" /></View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

function Action({ label, onPress, disabled = false, compact = false }: { label: string; onPress: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <Pressable disabled={disabled} style={[s.action, compact && s.actionCompact, disabled && s.disabled]} onPress={onPress}>
      <View style={s.actionContent}><View style={s.actionIcon}><Ionicons name="arrow-forward-outline" size={15} color="#c55239" /></View><Text style={s.actionText}>{label}</Text></View>
      <Ionicons name="chevron-forward" size={16} color="#c55239" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f5f0" },
  header: { backgroundColor: "#20352d", padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerIdentity: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, flexShrink: 1 },
  headerAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(223,202,115,0.16)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(223,202,115,0.38)" },
  headerCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  headerEmail: { color: "#b8c9c0", fontSize: 11, marginTop: 3 },
  eyebrow: { color: "#91b3a3", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#f7f5f0", fontSize: 28, fontWeight: "700", marginTop: 6 },
  signOutButton: { flexDirection: "row", alignItems: "center", padding: 7, flexShrink: 0 },
  signOut: { color: "#dfca73", fontWeight: "700", fontSize: 12 },
  content: { padding: 22, paddingBottom: 40 },
  copy: { color: "#77817c", lineHeight: 20, marginBottom: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metric: { width: "48%", marginBottom: 10, backgroundColor: "#fffdfa", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#ebe7df", shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  metricIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricValue: { color: "#20352d", fontSize: 25, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 4 },
  sectionTitle: { color: "#20352d", fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  groupTitle: { color: "#20352d", fontSize: 14, fontWeight: "800", marginTop: 20, marginBottom: 4 },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { backgroundColor: "#fffdfa", borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: "#ebe7df", shadowColor: "#20352d", shadowOpacity: 0.04, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  welcomeCard: { backgroundColor: "#20352d", borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  welcomeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#c55239", alignItems: "center", justifyContent: "center", marginRight: 12 },
  welcomeCopy: { flex: 1 },
  welcomeTitle: { color: "#fffdfa", fontSize: 15, fontWeight: "800" },
  welcomeText: { color: "#c8d2cb", fontSize: 12, lineHeight: 17, marginTop: 3 },
  platformHero: { backgroundColor: "#e7f1ed", borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  platformHeroIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#20352d", alignItems: "center", justifyContent: "center", marginRight: 12 },
  platformHeroTitle: { color: "#20352d", fontWeight: "800", fontSize: 16 },
  platformHeroText: { color: "#60736a", fontSize: 12, marginTop: 3 },
  refreshButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fffdfa", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  filterCard: { backgroundColor: "#fffdfa", borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: "#d9d6ce" },
  filterTitle: { color: "#20352d", fontSize: 15, fontWeight: "800", marginBottom: 2 },
  filterChips: { paddingTop: 10, paddingBottom: 3 },
  filterChip: { borderWidth: 1, borderColor: "#d9d6ce", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#f7f5f0", marginRight: 8 },
  filterChipActive: { backgroundColor: "#20352d", borderColor: "#20352d" },
  filterChipText: { color: "#20352d", fontSize: 11, fontWeight: "700" },
  filterChipTextActive: { color: "#fffdfa" },
  filterResult: { color: "#8a958e", fontSize: 11, marginTop: 8 },
  cardTitle: { color: "#20352d", fontSize: 16, fontWeight: "700" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d9d8d1", borderRadius: 9, padding: 13, marginTop: 10, color: "#20352d" },
  action: { backgroundColor: "#edf5f1", borderRadius: 12, padding: 13, marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexGrow: 1, flexShrink: 1, minWidth: 0, borderWidth: 1, borderColor: "#dcebe4" },
  actionCompact: { width: "48%", flexGrow: 0, marginTop: 8, padding: 12 },
  actionContent: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  actionIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#fffdfa", alignItems: "center", justifyContent: "center" },
  actionText: { color: "#20352d", fontWeight: "700", fontSize: 12, flexShrink: 1, marginLeft: 8 },
  request: { borderTopWidth: 1, borderTopColor: "#e5e1d9", paddingTop: 12, marginTop: 12 },
  chartRow: { marginTop: 12 },
  chartTrack: { height: 9, borderRadius: 5, backgroundColor: "#e7eee9", overflow: "hidden", marginTop: 6 },
  chartBar: { height: 9, borderRadius: 5, backgroundColor: "#c55239" },
  revenueBar: { height: 9, borderRadius: 5, backgroundColor: "#4c947d" },
  inline: { flexDirection: "row", flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  code: { color: "#20352d", fontWeight: "700", letterSpacing: 1, marginTop: 14 },
  active: { color: "#26735a", fontWeight: "700" },
  inactive: { color: "#b34d38", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  loader: { marginTop: 40 },
  error: { color: "#c55239", marginBottom: 10, lineHeight: 20 },
});

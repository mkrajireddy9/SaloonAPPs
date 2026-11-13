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
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getUserLocation } from "../../src/api";
import { AccountDrawer } from "../../src/components/AccountDrawer";

type Salon = {
  id: string;
  name: string;
  location?: string;
  services: string[];
  stylists: string[];
  branches?: unknown[];
  distanceKm?: number | null;
};
type SortMode = "recommended" | "nearby" | "services";

const categoryFor = (service: string) => {
  const value = service.toLowerCase();
  if (/colour|color|highlight|balayage|gloss/.test(value)) return "Hair colour";
  if (/spa|massage|facial|skin|wax|thread/.test(value)) return "Wellness";
  if (/nail|manicure|pedicure/.test(value)) return "Nails";
  return "Hair care";
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [radius, setRadius] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      const query = location
        ? `?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}&radiusKm=25`
        : "";
      setSalons(await api<Salon[]>(`/salon/directory${query}`));
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
  const categories = [
    "All",
    ...Array.from(
      new Set(salons.flatMap((salon) => salon.services.map(categoryFor))),
    ),
  ];
  const filteredSalons = salons
    .filter((salon) => {
      const query = search.trim().toLowerCase();
      const branchLocations = ((salon.branches || []) as { location?: string }[]).map(
        (branch) => branch.location || "",
      );
      const matchesSearch =
        !query ||
        [salon.name, salon.location, ...salon.services, ...branchLocations].some(
          (value) => value?.toLowerCase().includes(query),
        );
      const matchesCategory =
        category === "All" ||
        salon.services.some((service) => categoryFor(service) === category);
      const matchesRadius =
        radius === null ||
        (typeof salon.distanceKm === "number" && salon.distanceKm <= radius);
      return matchesSearch && matchesCategory && matchesRadius;
    })
    .sort((a, b) => {
      if (sort === "nearby")
        return (
          (a.distanceKm ?? Number.MAX_SAFE_INTEGER) -
          (b.distanceKm ?? Number.MAX_SAFE_INTEGER)
        );
      if (sort === "services") return b.services.length - a.services.length;
      return 0;
    });
  const featured = filteredSalons.slice(0, 3);
  const openSalon = (id: string) =>
    router.push({ pathname: "/salon/[id]", params: { id, hairstyle } });
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
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={19} color="#77817c" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search salons, services, or locations"
            placeholderTextColor="#9ba39e"
            style={s.searchInput}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={19} color="#77817c" />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {categories.map((item) => (
            <Pressable key={item} style={[s.chip, category === item && s.chipSelected]} onPress={() => setCategory(item)}>
              <Text style={[s.chipText, category === item && s.chipTextSelected]}>{item}</Text>
            </Pressable>
          ))}
          <Pressable style={[s.chip, filtersOpen && s.chipSelected]} onPress={() => setFiltersOpen((value) => !value)}>
            <Ionicons name="options-outline" size={15} color={filtersOpen ? "#fff" : "#20352d"} />
            <Text style={[s.chipText, filtersOpen && s.chipTextSelected]}>Filters</Text>
          </Pressable>
        </ScrollView>
        {filtersOpen ? (
          <View style={s.filterPanel}>
            <Text style={s.filterLabel}>Sort by</Text>
            <View style={s.filterOptions}>
              {([["recommended", "Recommended"], ["nearby", "Nearest first"], ["services", "Most services"]] as [SortMode, string][]).map(([value, label]) => (
                <Pressable key={value} style={[s.filterOption, sort === value && s.filterOptionSelected]} onPress={() => setSort(value)}>
                  <Text style={[s.filterOptionText, sort === value && s.filterOptionTextSelected]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.filterLabel}>Distance</Text>
            <View style={s.filterOptions}>
              {([[null, "Any distance"], [5, "Under 5 km"], [10, "Under 10 km"], [25, "Under 25 km"]] as [number | null, string][]).map(([value, label]) => (
                <Pressable key={label} style={[s.filterOption, radius === value && s.filterOptionSelected]} onPress={() => setRadius(value)}>
                  <Text style={[s.filterOptionText, radius === value && s.filterOptionTextSelected]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.filterHint}>Distance filtering uses the location data returned by the salon directory API.</Text>
          </View>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
        {featured.length ? (
          <>
            <View style={s.sectionHeading}>
              <View>
                <Text style={s.sectionEyebrow}>HANDPICKED FOR YOU</Text>
                <Text style={s.sectionTitle}>Salons worth discovering</Text>
              </View>
              <Text style={s.resultCount}>{filteredSalons.length} found</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featuredRow}>
              {featured.map((salon) => (
                <FeaturedSalon
                  key={salon.id}
                  salon={salon}
                  onPress={() => openSalon(salon.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
        <View style={s.sectionHeading}>
          <View>
            <Text style={s.sectionEyebrow}>ALL SALONS</Text>
            <Text style={s.sectionTitle}>Find your next visit</Text>
          </View>
          <Text style={s.resultCount}>{filteredSalons.length}</Text>
        </View>
        {filteredSalons.map((salon) => (
          <View style={[s.card, s.compactCard]} key={salon.id}>
            <View style={s.cardHeader}>
              <View style={s.salonBadge}><Text style={s.salonBadgeText}>{salon.name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={s.cardIdentity}><Text style={s.cardTitle}>{salon.name}</Text><Text style={s.muted}>{salon.location || "Location not set"}</Text></View>
              <Ionicons name="bookmark-outline" size={21} color="#77817c" />
            </View>
            <View style={s.metaRow}><Ionicons name="location-outline" size={15} color="#77817c" /><Text style={s.muted}>{salon.distanceKm != null ? `${salon.distanceKm.toFixed(1)} km · ` : ""}{salon.branches?.length || 0} branches</Text></View>
            <Text style={s.muted}>
              {salon.services.length} services · {salon.stylists.length}{" "}
              stylists
            </Text>
            <View style={s.serviceTags}>{salon.services.slice(0, 2).map((service) => <Text style={s.serviceTag} key={service}>{service}</Text>)}</View>
            <Pressable
              style={s.primary}
              onPress={() =>
                openSalon(salon.id)
              }
            >
              <Text style={s.primaryText}>View salon and book</Text>
            </Pressable>
          </View>
        ))}
        {!loading && !error && !filteredSalons.length ? (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={25} color="#c55239" />
            <Text style={s.cardTitle}>No salons match those filters</Text>
            <Text style={s.muted}>Try another service, location, or distance.</Text>
            <Pressable style={s.clearButton} onPress={() => { setSearch(""); setCategory("All"); setRadius(null); }}>
              <Text style={s.clearButtonText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeaturedSalon({ salon, onPress }: { salon: Salon; onPress: () => void }) {
  return (
    <Pressable style={s.featuredCard} onPress={onPress}>
      <View style={s.featuredImage}><Ionicons name="sparkles-outline" size={29} color="#dfca73" /></View>
      <View style={s.offerBadge}><Ionicons name="pricetag-outline" size={13} color="#fff" /><Text style={s.offerText}>Open for bookings</Text></View>
      <Text style={s.featuredTitle} numberOfLines={1}>{salon.name}</Text>
      <Text style={s.featuredLocation} numberOfLines={1}>{salon.location || "Location not set"}</Text>
    </Pressable>
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: "#20352d", paddingHorizontal: 10, fontSize: 14 },
  chips: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 20,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: "#20352d", borderColor: "#20352d" },
  chipText: { color: "#20352d", fontWeight: "700", fontSize: 12 },
  chipTextSelected: { color: "#fffdfa" },
  filterPanel: { backgroundColor: "#fffdfa", borderRadius: 14, borderWidth: 1, borderColor: "#d9d6ce", padding: 14, marginTop: 8, marginBottom: 14 },
  filterLabel: { color: "#20352d", fontWeight: "800", fontSize: 12, marginTop: 5, marginBottom: 8 },
  filterOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterOption: { borderRadius: 9, backgroundColor: "#f7f5f0", paddingHorizontal: 10, paddingVertical: 8 },
  filterOptionSelected: { backgroundColor: "#c55239" },
  filterOptionText: { color: "#20352d", fontSize: 11, fontWeight: "700" },
  filterOptionTextSelected: { color: "#fff" },
  filterHint: { color: "#77817c", fontSize: 10, lineHeight: 15, marginTop: 12 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16, marginBottom: 8 },
  sectionEyebrow: { color: "#91b3a3", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  sectionTitle: { color: "#20352d", fontSize: 18, fontWeight: "800", marginTop: 4 },
  resultCount: { color: "#77817c", fontSize: 11, fontWeight: "700" },
  featuredRow: { gap: 12, paddingBottom: 2 },
  featuredCard: { width: 205, overflow: "hidden", backgroundColor: "#fffdfa", borderRadius: 14, borderWidth: 1, borderColor: "#d9d6ce", paddingBottom: 11 },
  featuredImage: { height: 82, backgroundColor: "#20352d", alignItems: "center", justifyContent: "center" },
  offerBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "#c55239", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, margin: 8 },
  offerText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  featuredTitle: { color: "#20352d", fontSize: 15, fontWeight: "800", marginHorizontal: 10 },
  featuredLocation: { color: "#77817c", fontSize: 11, marginHorizontal: 10, marginTop: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  salonBadge: { width: 42, height: 42, borderRadius: 11, backgroundColor: "#dcece5", alignItems: "center", justifyContent: "center" },
  salonBadgeText: { color: "#20352d", fontSize: 18, fontWeight: "800" },
  cardIdentity: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 9 },
  serviceTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  serviceTag: { color: "#4c7567", backgroundColor: "#e5f1eb", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: "700" },
  clearButton: { alignSelf: "flex-start", backgroundColor: "#e5f1eb", borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginTop: 14 },
  clearButtonText: { color: "#20352d", fontWeight: "800", fontSize: 12 },
  card: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  compactCard: { marginTop: 8 },
  cardTitle: { color: "#20352d", fontSize: 18, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 6 },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 12,
    minHeight: 44,
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

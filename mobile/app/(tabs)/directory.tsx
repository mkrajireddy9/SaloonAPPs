import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
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
type Banner = {
  id: string;
  title: string;
  message: string;
};
const bannerWidth = Dimensions.get("window").width - 44;
const fallbackBanners: Banner[] = [
  {
    id: "default-banner-1",
    title: "Find a look that feels like you.",
    message: "Explore salon-ready hairstyle ideas with our private AI studio.",
  },
  {
    id: "default-banner-2",
    title: "Your next good hair day starts here.",
    message: "Discover thoughtful salons, talented stylists, and services made for you.",
  },
  {
    id: "default-banner-3",
    title: "Make room for a fresh feeling.",
    message: "Save your favorite looks and carry your hair story into every visit.",
  },
];
export default function Directory() {
  const { hairstyle } = useLocalSearchParams<{ hairstyle?: string }>();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [profile, setProfile] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerCarouselRef = useRef<any>(null);
  const carouselBanners = banners.length ? banners : fallbackBanners;
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
    api<Banner[]>("/banners")
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);
  useEffect(() => {
    if (carouselBanners.length < 2) return;
    const timer = setInterval(
      () => {
        setBannerIndex((current) => {
          const next = (current + 1) % carouselBanners.length;
          bannerCarouselRef.current?.scrollTo({
            x: next * bannerWidth,
            animated: true,
          });
          return next;
        });
      },
      3000,
    );
    return () => clearInterval(timer);
  }, [carouselBanners.length]);
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
        <ScrollView
          ref={bannerCarouselRef}
          horizontal
          pagingEnabled
          snapToInterval={bannerWidth}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          style={s.bannerViewport}
        >
          {carouselBanners.map((banner) => (
            <View style={s.bannerSlide} key={banner.id}>
              <View style={s.promoBanner}>
                <View style={s.promoBadge}>
                  <Text style={s.promoBadgeText}>HALO FEATURE</Text>
                </View>
                <Text style={s.promoTitle} numberOfLines={2}>
                  {banner.title}
                </Text>
                <Text style={s.promoCopy} numberOfLines={2}>
                  {banner.message}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        {carouselBanners.length > 1 ? (
          <View style={s.bannerDots}>
            {carouselBanners.map((banner, index) => (
              <View
                key={banner.id}
                style={[s.bannerDot, index === bannerIndex && s.bannerDotActive]}
              />
            ))}
          </View>
        ) : null}
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
                  params: { id: salon.id, hairstyle },
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
  bannerViewport: { height: 164 },
  bannerSlide: { width: bannerWidth, paddingRight: 12 },
  promoBanner: {
    width: "100%",
    backgroundColor: "#20352d",
    borderRadius: 18,
    padding: 18,
    height: 156,
    justifyContent: "center",
    position: "relative",
    shadowColor: "#20352d",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promoBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#c55239",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  promoBadgeText: {
    color: "#fffdfa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  promoTitle: {
    color: "#fffdfa",
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
    marginTop: 13,
    maxWidth: 235,
  },
  promoCopy: { color: "#c8d2cb", lineHeight: 19, marginTop: 6, maxWidth: 245 },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 14,
    marginTop: 2,
    marginBottom: 6,
    gap: 5,
  },
  bannerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#c9c6bd",
  },
  bannerDotActive: { width: 16, backgroundColor: "#c55239" },
});

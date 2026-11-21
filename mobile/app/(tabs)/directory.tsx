import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { AccountDrawer } from "../../src/components/AccountDrawer";
import { API_URL, api, getAccessToken, getUserLocation, setUserLocation } from "../../src/api";

type ServiceDetail = { category?: string; name: string; price?: number; discountPercent?: number; discountPrice?: number; offerText?: string; active?: boolean; imageUrl?: string };
type Salon = { id: string; name: string; location?: string; services: string[]; stylists: string[]; branches?: { location?: string; latitude?: number; longitude?: number; distanceKm?: number | null; active?: boolean }[]; serviceDetails?: ServiceDetail[]; distanceKm?: number | null; openingHours?: { open: string; close: string }; closedDays?: string[]; ratingAverage?: number | null; ratingCount?: number };
type WishlistEntry = { id: string; salonId: string; createdAt: string; salon: Salon };
type Banner = { id: string; title: string; message: string; imageUrl?: string | null; actionLabel?: string | null; actionUrl?: string | null };
type QuickFilter = "all" | "nearby" | "top-rated" | "offers" | "open-now";
type PriceFilter = "any" | "under-1000" | "1000-2000" | "2000-plus";

const categoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const value = category.toLowerCase();
  if (/facial|skin|makeup/.test(value)) return "sparkles-outline";
  if (/spa|massage|wellness/.test(value)) return "flower-outline";
  if (/nail|manicure|pedicure/.test(value)) return "color-palette-outline";
  if (/colour|color/.test(value)) return "color-fill-outline";
  return "cut-outline";
};
const serviceCategory = (service: string) => {
  const value = service.toLowerCase();
  if (/colour|color|highlight|balayage|gloss/.test(value)) return "Hair Colour";
  if (/spa|massage|facial|skin|wax|thread/.test(value)) return "Wellness";
  if (/nail|manicure|pedicure/.test(value)) return "Nails";
  return "Hair Care";
};
const activeDetails = (salon: Salon) => (salon.serviceDetails || []).filter((item) => item.active !== false);
const salonPrice = (salon: Salon) => {
  const prices = activeDetails(salon).map((item) => Number(item.discountPrice ?? item.price)).filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
};
const salonOffer = (salon: Salon) => {
  const details = activeDetails(salon);
  const discount = Math.max(...details.map((item) => {
    if (item.discountPercent) return Number(item.discountPercent);
    if (item.price && item.discountPrice != null && item.discountPrice < item.price) return Math.round(((item.price - item.discountPrice) / item.price) * 100);
    return 0;
  }), 0);
  return details.find((item) => item.offerText)?.offerText || (discount > 0 ? `${discount}% OFF` : null);
};
const salonImage = (salon: Salon) => {
  const image = activeDetails(salon).find((item) => item.imageUrl)?.imageUrl;
  return image && (/^https?:\/\//i.test(image) || image.startsWith("/media/")) ? image : null;
};
const distanceBetween = (from: { latitude: number; longitude: number }, to: { latitude?: number; longitude?: number }) => {
  if (!Number.isFinite(to.latitude) || !Number.isFinite(to.longitude)) return null;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(to.latitude! - from.latitude);
  const dLon = radians(to.longitude! - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude!)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const carryDistance = (salon: Salon, location: { latitude: number; longitude: number } | null) => {
  if (!location) return salon;
  if (typeof salon.distanceKm === "number" && Number.isFinite(salon.distanceKm)) return salon;
  const distances = (salon.branches || []).map((branch) => branch.distanceKm ?? distanceBetween(location, branch)).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return { ...salon, distanceKm: distances.length ? Math.min(...distances) : null };
};
function isOpenNow(salon: Salon) {
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  if (salon.closedDays?.includes(today)) return false;
  if (!salon.openingHours) return null;
  const toMinutes = (value: string) => { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; };
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(salon.openingHours.open) && current <= toMinutes(salon.openingHours.close);
}

export default function Directory() {
  const { hairstyle } = useLocalSearchParams<{ hairstyle?: string }>();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistSalons, setWishlistSalons] = useState<Salon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [radius, setRadius] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [price, setPrice] = useState<PriceFilter>("any");
  const [pricedOnly, setPricedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      let location = await getUserLocation();
      if (!location) {
        const permission = await Location.getForegroundPermissionsAsync();
        if (await Location.hasServicesEnabledAsync() && permission.status === Location.PermissionStatus.GRANTED) {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          await setUserLocation(location);
        }
      }
      const query = location ? `?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}&radiusKm=25` : "";
      const wishlistQuery = location ? `?latitude=${encodeURIComponent(location.latitude)}&longitude=${encodeURIComponent(location.longitude)}` : "";
      const [directory, wishlist] = await Promise.all([
        api<Salon[]>(`/salon/directory${query}`),
        api<WishlistEntry[]>(`/wishlist${wishlistQuery}`).catch(() => [] as WishlistEntry[]),
      ]);
      setSalons(directory.map((salon) => carryDistance(salon, location)));
      setWishlistIds(wishlist.map((item) => item.salonId));
      setWishlistSalons(wishlist.map((item) => item.salon).filter(Boolean).map((salon) => carryDistance(salon, location)));
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load salons."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    void load();
    getAccessToken().then((token) => {
      setAccessToken(token);
      return api<Banner[]>("/banners");
    }).then(setBanners).catch(() => setBanners([]));
    api<{ name?: string; email?: string }>("/customers/me").then(setProfile).catch(() => setProfile(null));
  }, []);
  useEffect(() => { const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void load(); }); return () => subscription.remove(); }, []);
  const categories = useMemo(() => {
    const values = salons.flatMap((salon) => { const details = activeDetails(salon); return details.length ? details.map((item) => item.category || serviceCategory(item.name)) : salon.services.map(serviceCategory); });
    return ["All", ...Array.from(new Set(values))];
  }, [salons]);
  const filteredSalons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return salons.filter((salon) => {
      const details = activeDetails(salon);
      const values = [salon.name, salon.location, ...salon.services, ...details.map((item) => item.name), ...(salon.branches || []).map((branch) => branch.location || "")];
      const priceValue = salonPrice(salon);
      const matchesSearch = !query || values.some((value) => value?.toLowerCase().includes(query));
      const matchesCategory = category === "All" || details.some((item) => (item.category || serviceCategory(item.name)) === category) || salon.services.some((item) => serviceCategory(item) === category);
      const matchesRadius = radius === null || (typeof salon.distanceKm === "number" && salon.distanceKm <= radius);
      const matchesRating = rating === null || (salon.ratingAverage ?? 0) >= rating;
      const matchesPrice = price === "any" || (price === "under-1000" && priceValue !== null && priceValue < 1000) || (price === "1000-2000" && priceValue !== null && priceValue >= 1000 && priceValue <= 2000) || (price === "2000-plus" && priceValue !== null && priceValue > 2000);
      const matchesPricedOnly = !pricedOnly || priceValue !== null;
      const matchesQuick = quickFilter === "all" || (quickFilter === "nearby" && salon.distanceKm !== null && salon.distanceKm !== undefined) || (quickFilter === "top-rated" && (salon.ratingAverage ?? 0) >= 4) || (quickFilter === "offers" && Boolean(salonOffer(salon))) || (quickFilter === "open-now" && isOpenNow(salon) === true);
      return matchesSearch && matchesCategory && matchesRadius && matchesRating && matchesPrice && matchesPricedOnly && matchesQuick;
    }).sort((a, b) => quickFilter === "nearby" ? (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER) : (b.ratingAverage ?? -1) - (a.ratingAverage ?? -1) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0));
  }, [salons, search, category, quickFilter, radius, rating, price, pricedOnly]);
  const featured = [...filteredSalons].sort((a, b) => (b.ratingAverage ?? -1) - (a.ratingAverage ?? -1) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0)).slice(0, 5);
  const nearby = [...filteredSalons].sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
  const topRated = filteredSalons.filter((salon) => (salon.ratingAverage ?? 0) >= 4).slice(0, 5);
  const offers = filteredSalons.filter((salon) => Boolean(salonOffer(salon))).slice(0, 5);
  const heroSalon = featured[0] || salons[0];
  const heroImage = heroSalon ? salonImage(heroSalon) : null;
  const activeBanner = banners[0];
  const bannerImage = activeBanner?.imageUrl || heroImage;
  const bannerUri = bannerImage ? (bannerImage.startsWith("/") ? API_URL + bannerImage : bannerImage) : null;
  const bannerSource = bannerUri ? { uri: bannerUri, ...(bannerUri.startsWith(API_URL) && accessToken ? { headers: { authorization: "Bearer " + accessToken } } : {}) } : undefined;
  const serviceCategories = categories.filter((item) => item !== "All").slice(0, 8);
  const hasRefinements = Boolean(search.trim() || category !== "All" || quickFilter !== "all" || radius !== null || rating !== null || price !== "any" || pricedOnly);
  const openSalon = (salon: Salon) => router.push({ pathname: "/salon/[id]", params: { id: salon.id, hairstyle, ...(salon.distanceKm != null ? { distanceKm: String(salon.distanceKm) } : {}) } });
  const openBooking = () => router.push({ pathname: "/(tabs)/appointments", params: { booking: "1" } });
  const openBanner = () => {
    if (activeBanner?.actionUrl?.startsWith("http")) {
      void Linking.openURL(activeBanner.actionUrl);
    } else if (activeBanner?.actionUrl) {
      router.push(activeBanner.actionUrl as any);
    } else if (heroSalon) {
      openSalon(heroSalon);
    } else {
      setFiltersOpen(true);
    }
  };
  const toggleWishlist = async (salon: Salon) => {
    const saved = wishlistIds.includes(salon.id);
    setError("");
    setWishlistIds((current) => saved ? current.filter((id) => id !== salon.id) : [...current, salon.id]);
    setWishlistSalons((current) => saved ? current.filter((item) => item.id !== salon.id) : [salon, ...current]);
    try {
      await api(`/wishlist/${encodeURIComponent(salon.id)}`, { method: saved ? "DELETE" : "POST" });
    } catch (e) {
      setWishlistIds((current) => saved ? [...current, salon.id] : current.filter((id) => id !== salon.id));
      setWishlistSalons((current) => saved ? [salon, ...current] : current.filter((item) => item.id !== salon.id));
      setError(e instanceof Error ? e.message : "Unable to update your wishlist.");
    }
  };
  const clearFilters = () => { setSearch(""); setCategory("All"); setQuickFilter("all"); setRadius(null); setRating(null); setPrice("any"); setPricedOnly(false); setFiltersOpen(false); };
  return <SafeAreaView style={s.safeArea}><ScrollView style={s.screen} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#c55239" />}>
    <View style={s.header}>
      <View>
        <View style={s.locationRow}><Ionicons name="location" size={18} color="#4c947d" /><Text style={s.locationText}>Near you</Text><Ionicons name="chevron-down" size={15} color="#20352d" /></View>
        <Text style={s.locationHint}>Find salons and services around you</Text>
      </View>
      <AccountDrawer profile={profile} />
    </View>
    <View style={s.searchBox}><Ionicons name="search-outline" size={21} color="#77817c" /><TextInput value={search} onChangeText={setSearch} placeholder="Search salons or services..." placeholderTextColor="#9ba39e" style={s.searchInput} returnKeyType="search" />{search ? <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={19} color="#77817c" /></Pressable> : null}<Pressable style={s.filterButton} onPress={() => setFiltersOpen((value) => !value)} accessibilityLabel="Open salon filters"><Ionicons name="options-outline" size={21} color="#4c947d" /></Pressable></View>
    <Pressable style={s.promoBanner} onPress={openBanner}>
      {bannerSource ? <Image source={bannerSource} style={s.promoImage} /> : null}
      <View style={s.promoOverlay} />
      <View style={s.promoContent}>
        <Text style={s.promoEyebrow}>HALO SALON</Text>
        <Text style={s.promoTitle}>{activeBanner?.title || (heroSalon ? "Your next salon moment starts here" : "Find your next salon")}</Text>
        <Text style={s.promoMessage} numberOfLines={2}>{activeBanner?.message || (heroSalon ? "Discover services, prices, and trusted salons near you." : "Explore salons and book a service that fits your style.")}</Text>
        <View style={s.promoActions}><View style={s.promoPrimary}><Ionicons name="sparkles-outline" size={15} color="#fff" /><Text style={s.promoPrimaryText}>{activeBanner?.actionLabel || "Explore salons"}</Text></View><View style={s.promoSecondary}><Ionicons name="calendar-outline" size={15} color="#fff" /><Text style={s.promoSecondaryText}>Book a visit</Text></View></View>
      </View>
    </Pressable>
    {banners.length > 1 ? <View style={s.bannerDots}>{banners.slice(0, 3).map((banner, index) => <View key={banner.id} style={[s.bannerDot, index === 0 && s.bannerDotActive]} />)}</View> : null}
    {!hasRefinements ? <TrustStrip onTopRated={() => setQuickFilter("top-rated")} onPrices={() => setPricedOnly((value) => !value)} pricedOnly={pricedOnly} onBooking={openBooking} onNearby={() => setQuickFilter("nearby")} /> : null}
    {serviceCategories.length ? <Section title="Popular services" action={serviceCategories.length + " available"}><View style={s.serviceGrid}>{serviceCategories.map((item) => <Pressable key={item} style={s.serviceCard} onPress={() => setCategory(item)}><View style={s.serviceIcon}><Ionicons name={categoryIcon(item)} size={23} color="#4c947d" /></View><Text style={s.serviceLabel} numberOfLines={2}>{item}</Text></Pressable>)}</View></Section> : null}
    {filtersOpen ? <FilterPanel radius={radius} setRadius={setRadius} rating={rating} setRating={setRating} price={price} setPrice={setPrice} onClear={clearFilters} /> : null}{error ? <Text style={s.error}>{error}</Text> : null}
    {!hasRefinements && wishlistSalons.length > 0 ? <Section title="Your wishlist" action={`${wishlistSalons.length} saved`}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>{wishlistSalons.map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} variant="featured" isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</ScrollView></Section> : null}
    {!hasRefinements && featured.length > 0 ? <Section title="Recommended for you" action="View all" onAction={() => setQuickFilter("top-rated")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>{featured.map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} variant="featured" isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</ScrollView></Section> : null}
    {!hasRefinements && nearby.length > 0 ? <Section title="Popular salons nearby" action="View all" onAction={() => setQuickFilter("nearby")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>{nearby.slice(0, 5).map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} variant="featured" isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</ScrollView></Section> : null}
    {!hasRefinements && offers.length > 0 ? <Section title="Special packages & offers" action="View all" onAction={() => setQuickFilter("offers")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>{offers.map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} variant="featured" isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</ScrollView></Section> : null}
    {hasRefinements && topRated.length > 0 ? <Section title="Top rated matches" action={topRated.length + " found"}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>{topRated.map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} variant="featured" isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</ScrollView></Section> : null}
    {hasRefinements ? <Section title="Search results" action={filteredSalons.length + " found"}>{nearby.map((salon) => <SalonCard key={salon.id} salon={salon} accessToken={accessToken} isWishlisted={wishlistIds.includes(salon.id)} onToggleWishlist={() => void toggleWishlist(salon)} onPress={() => openSalon(salon)} />)}</Section> : null}
    {!loading && !filteredSalons.length ? <View style={s.empty}><Ionicons name="search-outline" size={28} color="#4c947d" /><Text style={s.emptyTitle}>No salons match your search</Text><Text style={s.emptyText}>Try another service, category, or filter.</Text><Pressable style={s.clearButton} onPress={clearFilters}><Text style={s.clearText}>Clear filters</Text></Pressable></View> : null}{loading && !salons.length ? <View style={s.loader}><ActivityIndicator color="#c55239" /><Text style={s.emptyText}>Finding salons near you...</Text></View> : null}
  </ScrollView></SafeAreaView>;
}

function Section({ title, action, onAction, children }: { title: string; action: string; onAction?: () => void; children: any }) { return <View style={s.section}><View style={s.sectionHeader}><Text style={s.sectionTitle}>{title}</Text>{onAction ? <Pressable onPress={onAction}><Text style={s.sectionAction}>{action} →</Text></Pressable> : <Text style={s.resultCount}>{action}</Text>}</View>{children}</View>; }
function TrustStrip({ onTopRated, onPrices, pricedOnly, onBooking, onNearby }: { onTopRated: () => void; onPrices: () => void; pricedOnly: boolean; onBooking: () => void; onNearby: () => void }) {
  const items = [
    { icon: "shield-checkmark-outline", label: "Top rated", onPress: onTopRated, active: false },
    { icon: "pricetag-outline", label: pricedOnly ? "Prices shown" : "Clear pricing", onPress: onPrices, active: pricedOnly },
    { icon: "calendar-outline", label: "Easy booking", onPress: onBooking, active: false },
    { icon: "location-outline", label: "Near you", onPress: onNearby, active: false },
  ];
  return <View style={s.trustStrip}>{items.map((item) => <Pressable key={item.label} style={[s.trustItem, item.active && s.trustItemActive]} onPress={item.onPress} accessibilityRole="button"><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={21} color={item.active ? "#c55239" : "#4c947d"} /><Text style={[s.trustLabel, item.active && s.trustLabelActive]}>{item.label}</Text></Pressable>)}</View>;
}
function FilterPanel({ radius, setRadius, rating, setRating, price, setPrice, onClear }: { radius: number | null; setRadius: (value: number | null) => void; rating: number | null; setRating: (value: number | null) => void; price: PriceFilter; setPrice: (value: PriceFilter) => void; onClear: () => void }) { return <View style={s.filterPanel}><View style={s.filterHeader}><Text style={s.filterTitle}>Filters</Text><Pressable onPress={onClear}><Text style={s.sectionAction}>Reset</Text></Pressable></View><Text style={s.filterLabel}>Distance</Text><OptionRow options={[[null, "Any"], [1, "< 1 km"], [5, "1–5 km"], [10, "5–10 km"]]} value={radius} onChange={setRadius} /><Text style={s.filterLabel}>Rating</Text><OptionRow options={[[null, "Any"], [4, "4.0+"], [4.5, "4.5+"], [4.7, "4.7+"]]} value={rating} onChange={setRating} /><Text style={s.filterLabel}>Price from</Text><View style={s.optionRow}>{([['any', 'Any'], ['under-1000', 'Under ₹1k'], ['1000-2000', '₹1k–₹2k'], ['2000-plus', '₹2k+']] as [PriceFilter, string][]).map(([value, label]) => <Pressable key={value} style={[s.option, price === value && s.optionActive]} onPress={() => setPrice(value)}><Text style={[s.optionText, price === value && s.optionTextActive]}>{label}</Text></Pressable>)}</View></View>; }
function OptionRow({ options, value, onChange }: { options: [number | null, string][]; value: number | null; onChange: (value: number | null) => void }) { return <View style={s.optionRow}>{options.map(([option, label]) => <Pressable key={label} style={[s.option, value === option && s.optionActive]} onPress={() => onChange(option)}><Text style={[s.optionText, value === option && s.optionTextActive]}>{label}</Text></Pressable>)}</View>; }
function SalonCard({ salon, accessToken, onPress, onToggleWishlist, isWishlisted = false, variant = "list" }: { salon: Salon; accessToken: string | null; onPress: () => void; onToggleWishlist?: () => void; isWishlisted?: boolean; variant?: "featured" | "list" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = salonImage(salon);
  const offer = salonOffer(salon);
  const price = salonPrice(salon);
  const details = activeDetails(salon);
  const isOpen = isOpenNow(salon);
  const imageUri = image ? (image.startsWith("/") ? `${API_URL}${image}` : image) : null;
  const imageSource = imageUri ? { uri: imageUri, headers: imageUri.startsWith(API_URL) && accessToken ? { authorization: `Bearer ${accessToken}` } : undefined } : undefined;
  const imageView = imageSource && !imageFailed ? <Image source={imageSource} style={s.salonImage} onError={() => setImageFailed(true)} /> : <View style={s.imagePlaceholder}><Ionicons name="sparkles-outline" size={30} color="#4c947d" /><Text style={s.placeholderText}>Halo salon</Text></View>;
  const ratingView = salon.ratingAverage != null ? <><Ionicons name="star" size={15} color="#dfca73" /><Text style={s.rating}>{salon.ratingAverage.toFixed(1)}</Text><Text style={s.reviewCount}>({salon.ratingCount || 0})</Text></> : <Text style={s.reviewCount}>Not rated yet</Text>;
  const openView = isOpen === null ? null : <Text style={[s.openPill, isOpen ? s.open : s.closed]}>{isOpen ? "Open now" : "Closed"}</Text>;
  const priceView = price != null ? <View style={s.priceBlock}><Text style={s.priceLabel}>Starting at</Text><Text style={s.price}>₹{price.toLocaleString("en-IN")}</Text></View> : <View style={s.priceBlock}><Text style={s.priceLabel}>Pricing</Text><Text style={s.priceMuted}>On request</Text></View>;
  return (
    <Pressable style={[s.salonCard, variant === "featured" && s.featuredCard]} onPress={onPress}>
      <View style={[s.imageWrap, variant === "featured" && s.featuredImageWrap, variant === "list" && s.listImageWrap]}>{imageView}{offer ? <View style={s.offerBadge}><Text style={s.offerText}>{offer}</Text></View> : null}</View>
      <View style={[s.cardBody, variant === "list" && s.listCardBody]}>
        <View style={s.cardTitleRow}><Text style={s.salonName} numberOfLines={1}>{salon.name}</Text>{onToggleWishlist ? <Pressable style={s.favoriteButton} onPress={onToggleWishlist} accessibilityRole="button" accessibilityLabel={isWishlisted ? `Remove ${salon.name} from wishlist` : `Save ${salon.name} to wishlist`}><Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={21} color="#c55239" /></Pressable> : null}</View>
        <View style={s.ratingRow}>{ratingView}</View>
        <View style={s.metaRow}><Ionicons name="location-outline" size={15} color="#4c947d" /><Text style={s.metaText}>{salon.distanceKm != null ? `${salon.distanceKm.toFixed(1)} km` : salon.location || "Location not set"}</Text>{openView}</View>
        <Text style={s.services} numberOfLines={1}>{(details.length ? details.map((item) => item.name) : salon.services).slice(0, 3).join(", ") || "Services coming soon"}</Text>
        <View style={s.bottomRow}>{priceView}<View style={s.bookButton}><Text style={s.bookText}>View salon</Text></View></View>
      </View>
    </Pressable>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8f7" }, screen: { flex: 1, backgroundColor: "#fff8f7" }, content: { paddingHorizontal: 18, paddingBottom: 42 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }, locationRow: { flexDirection: "row", alignItems: "center", gap: 5 }, locationText: { color: "#221b2a", fontSize: 14, fontWeight: "800" }, title: { color: "#221b2a", fontSize: 30, lineHeight: 35, fontWeight: "900", marginTop: 24, maxWidth: 330 }, subtitle: { color: "#766b7c", fontSize: 15, marginTop: 5, marginBottom: 17 }, searchBox: { minHeight: 54, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 28, paddingHorizontal: 17, shadowColor: "#6b3154", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, searchInput: { flex: 1, color: "#221b2a", fontSize: 14, paddingHorizontal: 10 }, filterButton: { borderLeftWidth: 1, borderLeftColor: "#eee5eb", paddingLeft: 13 }, quickRow: { gap: 9, paddingVertical: 16, paddingRight: 14 }, quickChip: { borderWidth: 1, borderColor: "#eadfe7", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: "#fff" }, quickChipActive: { backgroundColor: "#d21c68", borderColor: "#d21c68" }, quickText: { color: "#342938", fontSize: 12, fontWeight: "800" }, quickTextActive: { color: "#fff" }, categoryRow: { gap: 10, paddingBottom: 6, paddingRight: 16 }, categoryChip: { alignItems: "center", width: 72 }, categoryIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: "#fff0f3", alignItems: "center", justifyContent: "center" }, categoryIconActive: { backgroundColor: "#ffe0eb" }, categoryChipActive: { opacity: 1 }, categoryText: { color: "#766b7c", fontSize: 10, fontWeight: "700", marginTop: 6, textAlign: "center" }, categoryTextActive: { color: "#d21c68" }, filterPanel: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginTop: 14, borderWidth: 1, borderColor: "#f0e5eb" }, filterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, filterTitle: { color: "#221b2a", fontSize: 18, fontWeight: "900" }, filterLabel: { color: "#342938", fontSize: 12, fontWeight: "900", marginTop: 15, marginBottom: 8 }, optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, option: { borderWidth: 1, borderColor: "#eadfe7", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, optionActive: { backgroundColor: "#d21c68", borderColor: "#d21c68" }, optionText: { color: "#554758", fontSize: 11, fontWeight: "700" }, optionTextActive: { color: "#fff" }, section: { marginTop: 24 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }, sectionTitle: { color: "#221b2a", fontSize: 20, fontWeight: "900" }, sectionAction: { color: "#d21c68", fontSize: 12, fontWeight: "900" }, resultCount: { color: "#8b8190", fontSize: 12, fontWeight: "700" }, cardRow: { gap: 12, paddingRight: 18 }, salonCard: { backgroundColor: "#fff", borderRadius: 20, marginBottom: 13, overflow: "hidden", borderWidth: 1, borderColor: "#f0e5eb", shadowColor: "#6b3154", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, featuredCard: { width: 285, marginBottom: 0 }, imageWrap: { height: 148, backgroundColor: "#f8e8ec", position: "relative" }, featuredImageWrap: { height: 128 }, salonImage: { width: "100%", height: "100%" }, imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8e8ec" }, placeholderText: { color: "#b45a7c", fontSize: 11, fontWeight: "800", marginTop: 4 }, offerBadge: { position: "absolute", bottom: 9, left: 10, backgroundColor: "#d21c68", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }, offerText: { color: "#fff", fontSize: 10, fontWeight: "900" }, cardBody: { padding: 13 }, cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 }, salonName: { flex: 1, color: "#221b2a", fontSize: 17, fontWeight: "900" }, ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 }, rating: { color: "#342938", fontSize: 12, fontWeight: "900" }, reviewCount: { color: "#8b8190", fontSize: 11 }, metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }, metaText: { flex: 1, color: "#766b7c", fontSize: 11 }, openPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: "900" }, open: { color: "#198754", backgroundColor: "#e4f7ed" }, closed: { color: "#a45555", backgroundColor: "#fbe9e9" }, services: { color: "#766b7c", fontSize: 11, marginTop: 8 }, bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }, price: { color: "#221b2a", fontSize: 14, fontWeight: "900" }, priceMuted: { color: "#8b8190", fontSize: 11 }, bookButton: { backgroundColor: "#fff0f3", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }, bookText: { color: "#d21c68", fontSize: 11, fontWeight: "900" }, empty: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", marginTop: 24 }, emptyTitle: { color: "#221b2a", fontSize: 16, fontWeight: "900", marginTop: 10 }, emptyText: { color: "#766b7c", fontSize: 12, marginTop: 6, textAlign: "center" }, clearButton: { backgroundColor: "#d21c68", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, marginTop: 15 }, clearText: { color: "#fff", fontWeight: "900", fontSize: 12 }, loader: { alignItems: "center", padding: 30 }, error: { color: "#a74e3d", marginTop: 14 },
});

const s = {
  ...baseStyles,
  safeArea: { ...baseStyles.safeArea, backgroundColor: "#f7f5f0" },
  screen: { ...baseStyles.screen, backgroundColor: "#f7f5f0" },
  content: { ...baseStyles.content, paddingHorizontal: 14, paddingBottom: 34 },
  header: { ...baseStyles.header, paddingTop: 10, paddingBottom: 13 },
  locationText: { ...baseStyles.locationText, color: "#20352d", fontSize: 15 },
  locationHint: { color: "#77817c", fontSize: 11, marginTop: 3, marginLeft: 23 },
  searchBox: { ...baseStyles.searchBox, backgroundColor: "#fffdfa", borderRadius: 16, shadowColor: "#20352d", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  searchInput: { ...baseStyles.searchInput, color: "#20352d" },
  filterButton: { ...baseStyles.filterButton, borderLeftColor: "#e1ddd4" },
  promoBanner: { height: 190, borderRadius: 18, overflow: "hidden" as const, backgroundColor: "#20352d", marginTop: 16, position: "relative" as const },
  promoImage: { position: "absolute" as const, right: 0, top: 0, bottom: 0, width: "55%" as const, opacity: 0.72 },
  promoOverlay: { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(32,53,45,0.56)" },
  promoContent: { flex: 1, padding: 16, width: "72%" as const, justifyContent: "center" as const },
  promoEyebrow: { color: "#dfca73", fontSize: 9, fontWeight: "900" as const, letterSpacing: 1.2 },
  promoTitle: { color: "#fffdfa", fontSize: 21, lineHeight: 25, fontWeight: "900" as const, marginTop: 5 },
  promoMessage: { color: "#e7f1ed", fontSize: 11, lineHeight: 16, marginTop: 7 },
  promoActions: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 13 },
  promoPrimary: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, backgroundColor: "#c55239", borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 },
  promoPrimaryText: { color: "#fff", fontSize: 10, fontWeight: "900" as const },
  promoSecondary: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.62)", borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7 },
  promoSecondaryText: { color: "#fff", fontSize: 10, fontWeight: "800" as const },
  bannerDots: { flexDirection: "row" as const, justifyContent: "center" as const, gap: 5, marginTop: 8 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d9d6ce" },
  bannerDotActive: { backgroundColor: "#4c947d", width: 16 },
  quickChip: { ...baseStyles.quickChip, borderColor: "#45465a", backgroundColor: "#2d2e3d" },
  quickChipActive: { ...baseStyles.quickChipActive, backgroundColor: "#d8b15e", borderColor: "#d8b15e" },
  quickText: { ...baseStyles.quickText, color: "#f8f2e7" },
  quickTextActive: { ...baseStyles.quickTextActive, color: "#1f2026" },
  serviceGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, justifyContent: "space-between" as const, gap: 9 },
  serviceCard: { width: "22%" as const, minHeight: 86, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "#fffdfa", borderRadius: 15, borderWidth: 1, borderColor: "#ebe7df", paddingHorizontal: 4, paddingVertical: 9 },
  serviceIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#e7f1ed", alignItems: "center" as const, justifyContent: "center" as const },
  serviceLabel: { color: "#20352d", fontSize: 10, fontWeight: "800" as const, textAlign: "center" as const, marginTop: 6 },
  categoryIcon: { ...baseStyles.categoryIcon, backgroundColor: "#303142" },
  categoryIconActive: { ...baseStyles.categoryIconActive, backgroundColor: "#484153" },
  categoryText: { ...baseStyles.categoryText, color: "#aaa8b4" },
  categoryTextActive: { ...baseStyles.categoryTextActive, color: "#d8b15e" },
  filterPanel: { ...baseStyles.filterPanel, backgroundColor: "#fffdfa", borderColor: "#e1ddd4" },
  filterTitle: { ...baseStyles.filterTitle, color: "#20352d" },
  filterLabel: { ...baseStyles.filterLabel, color: "#20352d" },
  option: { ...baseStyles.option, borderColor: "#d9d6ce" },
  optionActive: { ...baseStyles.optionActive, backgroundColor: "#20352d", borderColor: "#20352d" },
  optionText: { ...baseStyles.optionText, color: "#58665f" },
  optionTextActive: { ...baseStyles.optionTextActive, color: "#fffdfa" },
  sectionTitle: { ...baseStyles.sectionTitle, color: "#20352d", fontSize: 19 },
  sectionAction: { ...baseStyles.sectionAction, color: "#c55239" },
  resultCount: { ...baseStyles.resultCount, color: "#77817c" },
  salonCard: { ...baseStyles.salonCard, flexDirection: "row" as const, backgroundColor: "#fffdfa", borderColor: "#e1ddd4", borderRadius: 16, shadowOpacity: 0, elevation: 0 },
  featuredCard: { ...baseStyles.featuredCard, flexDirection: "column" as const, width: 218 },
  imageWrap: { ...baseStyles.imageWrap, backgroundColor: "#e7f1ed" },
  featuredImageWrap: { ...baseStyles.featuredImageWrap, backgroundColor: "#e7f1ed", height: 112 },
  listImageWrap: { width: 112, height: 126, flexShrink: 0 },
  listCardBody: { flex: 1, padding: 11, minWidth: 0 },
  imagePlaceholder: { ...baseStyles.imagePlaceholder, backgroundColor: "#e7f1ed" },
  placeholderText: { ...baseStyles.placeholderText, color: "#4c947d" },
  offerBadge: { ...baseStyles.offerBadge, backgroundColor: "#c55239" },
  offerText: { ...baseStyles.offerText, color: "#fff" },
  salonName: { ...baseStyles.salonName, color: "#20352d", fontSize: 15 },
  favoriteButton: { padding: 3, marginLeft: 4 },
  rating: { ...baseStyles.rating, color: "#20352d" },
  reviewCount: { ...baseStyles.reviewCount, color: "#77817c" },
  metaText: { ...baseStyles.metaText, color: "#77817c" },
  open: { ...baseStyles.open, color: "#4c947d", backgroundColor: "#e7f1ed" },
  closed: { ...baseStyles.closed, color: "#a45555", backgroundColor: "#fbe9e9" },
  services: { ...baseStyles.services, color: "#77817c", fontSize: 10 },
  bottomRow: { ...baseStyles.bottomRow, marginTop: 14, paddingTop: 11, borderTopWidth: 1, borderTopColor: "#e8e4db" },
  priceBlock: { minWidth: 76 },
  priceLabel: { color: "#77817c", fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.5, textTransform: "uppercase" as const },
  price: { ...baseStyles.price, color: "#20352d" },
  priceMuted: { ...baseStyles.priceMuted, color: "#77817c" },
  bookButton: { ...baseStyles.bookButton, minHeight: 36, minWidth: 104, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "#c55239", borderRadius: 18, paddingHorizontal: 14 },
  bookText: { ...baseStyles.bookText, color: "#fff" },
  trustStrip: { flexDirection: "row" as const, justifyContent: "space-between" as const, backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 16, paddingVertical: 13, paddingHorizontal: 8, marginTop: 24 },
  trustItem: { width: "25%" as const, alignItems: "center" as const, gap: 5 },
  trustItemActive: { backgroundColor: "#fff4ef", borderRadius: 11 },
  trustLabel: { color: "#58665f", fontSize: 9, fontWeight: "800" as const, textAlign: "center" as const },
  trustLabelActive: { color: "#c55239" },
  empty: { ...baseStyles.empty, backgroundColor: "#fffdfa" },
  emptyTitle: { ...baseStyles.emptyTitle, color: "#20352d" },
  emptyText: { ...baseStyles.emptyText, color: "#77817c" },
  clearButton: { ...baseStyles.clearButton, backgroundColor: "#c55239" },
  clearText: { ...baseStyles.clearText, color: "#fff" },
  loader: { ...baseStyles.loader, backgroundColor: "#f7f5f0" },
  error: { ...baseStyles.error, color: "#c55239" },
};

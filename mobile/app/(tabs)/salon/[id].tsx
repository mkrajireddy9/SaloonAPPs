import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL, api, getAccessToken } from "../../../src/api";
import { useToast } from "../../../src/components/ToastProvider";

type Branch = {
  id: string;
  name: string;
  location: string;
  contact?: string;
  closedDays?: string[];
  openingHours?: { open: string; close: string };
};
type ServiceDetail = {
  category?: string;
  name: string;
  price?: number;
  discountPrice?: number;
  discountPercent?: number;
  offerText?: string;
  durationMinutes?: number;
  active?: boolean;
  imageUrl?: string;
};
type Salon = {
  id: string;
  name: string;
  location?: string;
  services: string[];
  stylists: string[];
  branches?: Branch[];
  serviceDetails?: ServiceDetail[];
  products?: { name: string; description?: string; imageUrl?: string; active?: boolean }[];
  galleryImages?: string[];
  openingHours?: { open: string; close: string };
  closedDays?: string[];
  stylistProfiles?: Record<string, { bio?: string; imageUrl?: string }>;
  distanceKm?: number | null;
};
type Review = { id: string; guestName?: string; rating: number; comment?: string; createdAt?: string };
type WishlistEntry = { salonId: string };
type Tab = "services" | "reviews" | "about";
type ServiceSort = "recommended" | "price-low" | "price-high" | "duration";

const toMediaUrl = (value?: string) => {
  if (!value) return null;
  return value.startsWith("/") ? `${API_URL}${value}` : value;
};

const activeDetails = (salon: Salon) => (salon.serviceDetails || []).filter((item) => item.active !== false);
const serviceCategories = (items: ServiceDetail[]) => ["All", ...Array.from(new Set(items.map((item) => item.category).filter((item): item is string => Boolean(item))))];

const currentOpeningStatus = (salon: Salon) => {
  if (!salon.openingHours) return null;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  if (salon.closedDays?.includes(today)) return false;
  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(salon.openingHours.open) && current <= toMinutes(salon.openingHours.close);
};

export default function SalonDetails() {
  const { showToast } = useToast();
  const { id, hairstyle, distanceKm } = useLocalSearchParams<{ id: string; hairstyle?: string; distanceKm?: string | string[] }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("All");
  const [serviceSort, setServiceSort] = useState<ServiceSort>("recommended");
  const [galleryViewerVisible, setGalleryViewerVisible] = useState(false);
  const [galleryViewerIndex, setGalleryViewerIndex] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const details = useMemo(() => (salon ? activeDetails(salon) : []), [salon]);
  const categories = useMemo(() => serviceCategories(details), [details]);
  const filteredDetails = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    return [...details]
      .filter((item) => serviceCategoryFilter === "All" || item.category === serviceCategoryFilter)
      .filter((item) => !query || `${item.name} ${item.category || ""}`.toLowerCase().includes(query))
      .sort((a, b) => {
        if (serviceSort === "price-low") return Number(a.discountPrice ?? a.price ?? Number.MAX_SAFE_INTEGER) - Number(b.discountPrice ?? b.price ?? Number.MAX_SAFE_INTEGER);
        if (serviceSort === "price-high") return Number(b.discountPrice ?? b.price ?? 0) - Number(a.discountPrice ?? a.price ?? 0);
        if (serviceSort === "duration") return Number(a.durationMinutes ?? Number.MAX_SAFE_INTEGER) - Number(b.durationMinutes ?? Number.MAX_SAFE_INTEGER);
        return 0;
      });
  }, [details, serviceCategoryFilter, serviceQuery, serviceSort]);
  const products = useMemo(() => (salon?.products || []).filter((item) => item.active !== false), [salon]);
  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
  }, [reviews]);
  const galleryImages = useMemo(() => (salon?.galleryImages || []).map(toMediaUrl).filter((item): item is string => Boolean(item)), [salon]);
  const heroImage = useMemo(() => galleryImages[0] || details.find((item) => item.imageUrl)?.imageUrl || products.find((item) => item.imageUrl)?.imageUrl, [details, galleryImages, products]);
  const heroUri = toMediaUrl(heroImage);
  const heroSource = heroUri ? { uri: heroUri, ...(heroUri.startsWith(API_URL) && accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) } : undefined;
  const openStatus = salon ? currentOpeningStatus(salon) : null;
  const rawDistance = Array.isArray(distanceKm) ? distanceKm[0] : distanceKm;
  const parsedDistance = rawDistance && Number.isFinite(Number(rawDistance)) ? Number(rawDistance) : salon?.distanceKm ?? null;
  const currentOffer = useMemo(() => {
    const discount = Math.max(...details.map((item) => {
      if (item.discountPercent) return Number(item.discountPercent);
      if (item.price && item.discountPrice != null && item.discountPrice < item.price) return Math.round(((item.price - item.discountPrice) / item.price) * 100);
      return 0;
    }), 0);
    return details.find((item) => item.offerText)?.offerText || (discount > 0 ? `${discount}% off selected services` : null);
  }, [details]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setMessage("");
    void getAccessToken().then(setAccessToken);
    api<Salon>(`/salon/${id}`)
      .then((result) => {
        setSalon(result);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Unable to load this salon."))
      .finally(() => setLoading(false));
    api<Review[]>(`/reviews?salonId=${encodeURIComponent(id)}`).then(setReviews).catch(() => setReviews([]));
    api<WishlistEntry[]>("/wishlist")
      .then((items) => setWishlisted(items.some((item) => item.salonId === id)))
      .catch(() => setWishlisted(false));
  }, [id, hairstyle]);

  const openBooking = (serviceName?: string) => {
    if (!salon) return;
    router.push({
      pathname: "/(tabs)/appointments",
      params: {
        salonId: salon.id,
        booking: "1",
        ...(serviceName ? { service: serviceName } : {}),
        ...(hairstyle ? { hairstyle } : {}),
      },
    });
  };
  const toggleWishlist = async () => {
    if (!id) return;
    const next = !wishlisted;
    setWishlisted(next);
    try {
      await api(`/wishlist/${encodeURIComponent(id)}`, { method: next ? "POST" : "DELETE" });
    } catch (e) {
      setWishlisted(!next);
      setMessage(e instanceof Error ? e.message : "Unable to update your wishlist.");
    }
  };
  const salonContact = salon?.branches?.find((branch) => branch.contact)?.contact?.trim();
  const openSalonAction = async (action: "call" | "message" | "directions") => {
    if (!salon) return;
    const url = action === "directions"
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.location || salon.name)}`
      : salonContact
        ? `${action === "call" ? "tel" : "sms"}:${salonContact}`
        : "";
    if (!url) {
      showToast({ type: "warning", message: `No ${action === "directions" ? "location" : "contact number"} is available for this salon.` });
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      showToast({ type: "error", message: `Could not open ${action === "directions" ? "maps" : action}.` });
    }
  };
  const openGallery = (index: number) => {
    setGalleryViewerIndex(index);
    setGalleryViewerVisible(true);
  };

  if (loading) {
    return <SafeAreaView style={s.safeArea}><View style={s.center}><ActivityIndicator color="#c55239" /><Text style={s.muted}>Loading salon...</Text></View></SafeAreaView>;
  }
  if (!salon) {
    return <SafeAreaView style={s.safeArea}><View style={s.center}><Text style={s.error}>{message || "Unable to load this salon."}</Text><Pressable onPress={() => router.back()}><Text style={s.back}>‹ Back to salons</Text></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          {galleryImages.length ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} nestedScrollEnabled>{galleryImages.map((uri, index) => <Pressable key={`${uri}-hero-${index}`} style={[s.galleryHeroSlide, { width: screenWidth }]} onPress={() => openGallery(index)}><Image source={{ uri, ...(uri.startsWith(API_URL) && accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) }} style={s.heroImage} resizeMode="cover" /></Pressable>)}</ScrollView> : heroSource ? <Image source={heroSource} style={s.heroImage} resizeMode="cover" /> : <View style={s.heroPlaceholder}><Ionicons name="sparkles-outline" size={42} color="#dfca73" /><Text style={s.heroPlaceholderText}>Halo salon</Text></View>}
          <View style={s.heroShade} />
          <View style={s.heroTopBar}>
            <Pressable style={s.roundButton} onPress={() => router.back()} accessibilityLabel="Back to salons"><Ionicons name="arrow-back" size={20} color="#20352d" /></Pressable>
            <View style={s.heroActions}><Pressable style={s.roundButton} onPress={() => void toggleWishlist()} accessibilityRole="button" accessibilityLabel={wishlisted ? "Remove salon from wishlist" : "Save salon to wishlist"}><Ionicons name={wishlisted ? "heart" : "heart-outline"} size={20} color={wishlisted ? "#c55239" : "#20352d"} /></Pressable><Pressable style={s.roundButton} accessibilityLabel="Share salon"><Ionicons name="share-outline" size={19} color="#20352d" /></Pressable></View>
          </View>
        </View>

        {galleryImages.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryRow}>{galleryImages.map((uri, index) => <Pressable key={`${uri}-${index}`} onPress={() => openGallery(index)} accessibilityLabel={`Open salon image ${index + 1}`}><Image source={{ uri, ...(uri.startsWith(API_URL) && accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) }} style={s.galleryImage} /></Pressable>)}</ScrollView> : null}

        <Modal visible={galleryViewerVisible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setGalleryViewerVisible(false)}>
          <View style={s.galleryViewer}>
            <View style={s.galleryViewerTop}><Text style={s.galleryViewerCount}>{galleryViewerIndex + 1} / {galleryImages.length}</Text><Pressable style={s.galleryClose} onPress={() => setGalleryViewerVisible(false)} accessibilityLabel="Close image viewer"><Ionicons name="close" size={24} color="#fffdfa" /></Pressable></View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: galleryViewerIndex * screenWidth, y: 0 }} onMomentumScrollEnd={(event) => setGalleryViewerIndex(Math.round(event.nativeEvent.contentOffset.x / screenWidth))}>
              {galleryImages.map((uri, index) => <View style={[s.galleryViewerSlide, { width: screenWidth, height: screenHeight - 120 }]} key={`${uri}-full-${index}`}><Image source={{ uri, ...(uri.startsWith(API_URL) && accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) }} style={s.galleryViewerImage} resizeMode="contain" /></View>)}
            </ScrollView>
          </View>
        </Modal>

        <View style={s.profileCard}>
          <View style={s.profileTitleRow}><View style={s.salonMark}><Text style={s.salonMarkText}>{salon.name.charAt(0).toUpperCase()}</Text></View><View style={s.profileCopy}><Text style={s.title} numberOfLines={2}>{salon.name}</Text><Text style={s.location}><Ionicons name="location-outline" size={14} color="#4c947d" /> {salon.location || "Location not set"}</Text></View></View>
          <View style={s.profileMeta}><View style={s.metaItem}><Ionicons name="star" size={16} color="#dfca73" /><Text style={s.metaStrong}>{averageRating != null ? averageRating.toFixed(1) : "—"}</Text><Text style={s.metaMuted}>{reviews.length ? `(${reviews.length})` : "No reviews"}</Text></View>{parsedDistance != null ? <View style={s.metaItem}><Ionicons name="location-outline" size={15} color="#4c947d" /><Text style={s.metaMuted}>{parsedDistance.toFixed(1)} km away</Text></View> : null}{openStatus !== null ? <View style={[s.openPill, openStatus ? s.open : s.closed]}><Text style={[s.openText, openStatus ? s.openText : s.closedText]}>{openStatus ? "Open now" : "Closed now"}</Text></View> : null}</View>
          {currentOffer ? <View style={s.offerPill}><Ionicons name="pricetag-outline" size={15} color="#c55239" /><Text style={s.offerPillText}>{currentOffer}</Text></View> : null}
          <Pressable style={s.bookTopButton} onPress={() => openBooking()}><Text style={s.bookTopText}>Book appointment</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable>
          <View style={s.contactActions}>
            <Pressable style={s.contactAction} onPress={() => void openSalonAction("call")}><Ionicons name="call-outline" size={18} color="#26735a" /><Text style={s.contactActionText}>Call</Text></Pressable>
            <Pressable style={s.contactAction} onPress={() => void openSalonAction("message")}><Ionicons name="chatbubble-ellipses-outline" size={18} color="#26735a" /><Text style={s.contactActionText}>Message</Text></Pressable>
            <Pressable style={s.contactAction} onPress={() => void openSalonAction("directions")}><Ionicons name="navigate-outline" size={18} color="#26735a" /><Text style={s.contactActionText}>Directions</Text></Pressable>
          </View>
        </View>

        <View style={s.tabs}>{([['services', 'Services'], ['reviews', `Reviews${reviews.length ? ` (${reviews.length})` : ''}`], ['about', 'About']] as [Tab, string][]).map(([value, label]) => <Pressable key={value} style={[s.tab, activeTab === value && s.tabActive]} onPress={() => setActiveTab(value)}><Text style={[s.tabText, activeTab === value && s.tabTextActive]}>{label}</Text></Pressable>)}</View>

        {activeTab === "services" ? (
          <View style={s.sectionCard}>
            <View style={s.sectionHeading}><View><Text style={s.sectionEyebrow}>WHAT THIS SALON OFFERS</Text><Text style={s.sectionTitle}>Popular services</Text></View><Ionicons name="sparkles-outline" size={22} color="#c55239" /></View>
            {details.length ? <>
              <View style={s.serviceSearch}><Ionicons name="search-outline" size={18} color="#77817c" /><TextInput value={serviceQuery} onChangeText={setServiceQuery} placeholder="Search services..." placeholderTextColor="#9aa39e" style={s.serviceSearchInput} /></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.serviceFilters}>{categories.map((category) => <Pressable key={category} style={[s.serviceFilter, serviceCategoryFilter === category && s.serviceFilterActive]} onPress={() => setServiceCategoryFilter(category)}><Text style={[s.serviceFilterText, serviceCategoryFilter === category && s.serviceFilterTextActive]}>{category}</Text></Pressable>)}</ScrollView>
              <View style={s.serviceSortHeader}><Text style={s.filterCaption}>Sort services</Text><Text style={s.filterHint}>{filteredDetails.length} available</Text></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.serviceSorts}>{([['recommended', 'Recommended'], ['price-low', 'Price: low'], ['price-high', 'Price: high'], ['duration', 'Shortest']] as [ServiceSort, string][]).map(([value, label]) => <Pressable key={value} style={[s.serviceSort, serviceSort === value && s.serviceSortActive]} onPress={() => setServiceSort(value)}><Text style={[s.serviceSortText, serviceSort === value && s.serviceSortTextActive]}>{label}</Text></Pressable>)}</ScrollView>
              {filteredDetails.length ? filteredDetails.map((item, index) => <ServiceRow key={`${item.name}-${index}`} item={item} accessToken={accessToken} onBook={() => openBooking(item.name)} />) : <Text style={s.muted}>No services match your search.</Text>}
            </> : salon.services?.length ? salon.services.map((item) => <View style={s.simpleService} key={item}><View style={s.serviceIcon}><Ionicons name="cut-outline" size={18} color="#4c947d" /></View><Text style={s.serviceName}>{item}</Text><Text style={s.priceMuted}>Price on request</Text></View>) : <Text style={s.muted}>This salon has not published its services yet.</Text>}
            {products.length ? <><Text style={[s.sectionEyebrow, s.subsectionEyebrow]}>PRODUCTS USED</Text>{products.map((item, index) => <View style={s.productRow} key={`${item.name}-${index}`}><View style={s.productIcon}><Ionicons name="leaf-outline" size={18} color="#4c947d" /></View><View style={s.productCopy}><Text style={s.serviceName}>{item.name}</Text>{item.description ? <Text style={s.muted}>{item.description}</Text> : null}</View></View>)}</> : null}
          </View>
        ) : null}

        {activeTab === "reviews" ? <View style={s.sectionCard}><View style={s.reviewSummary}><Text style={s.reviewScore}>{averageRating != null ? averageRating.toFixed(1) : "—"}</Text><View><Text style={s.stars}>{averageRating != null ? "★".repeat(Math.round(averageRating)) : "☆☆☆☆☆"}</Text><Text style={s.muted}>{reviews.length ? `${reviews.length} guest reviews` : "No reviews yet"}</Text></View></View>{reviews.length ? reviews.map((review) => <View style={s.reviewRow} key={review.id}><View style={s.reviewTopline}><Text style={s.serviceName}>{review.guestName || "Guest"}</Text><Text style={s.starsSmall}>{"★".repeat(Number(review.rating || 0))}</Text></View>{review.comment ? <Text style={s.muted}>{review.comment}</Text> : null}</View>) : <Text style={s.muted}>Reviews will appear here after guests share their experience.</Text>}</View> : null}

        {activeTab === "about" ? <View style={s.sectionCard}><Text style={s.sectionEyebrow}>THE SALON</Text><Text style={s.sectionTitle}>About {salon.name}</Text><InfoRow icon="location-outline" label={salon.location || "Location not set"} /><InfoRow icon="time-outline" label={salon.openingHours ? `${salon.openingHours.open} – ${salon.openingHours.close}` : "Opening hours not published"} /><InfoRow icon="people-outline" label={salon.stylists.length ? `${salon.stylists.length} stylist${salon.stylists.length === 1 ? "" : "s"} available` : "Stylist details not published"} />{salon.branches?.length ? <><Text style={[s.sectionEyebrow, s.subsectionEyebrow]}>BRANCHES</Text>{salon.branches.map((item) => <View style={s.branchRow} key={item.id}><Ionicons name="storefront-outline" size={18} color="#4c947d" /><View style={s.productCopy}><Text style={s.serviceName}>{item.name}</Text><Text style={s.muted}>{item.location}</Text></View></View>)}</> : null}</View> : null}

      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceRow({ item, accessToken, onBook }: { item: ServiceDetail; accessToken: string | null; onBook: () => void }) {
  const price = item.discountPrice ?? item.price;
  const imageUri = toMediaUrl(item.imageUrl);
  const imageSource = imageUri ? { uri: imageUri, ...(imageUri.startsWith(API_URL) && accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) } : undefined;
  return <Pressable style={s.serviceRow} onPress={onBook}>{imageSource ? <Image source={imageSource} style={s.serviceImage} /> : <View style={s.serviceIcon}><Ionicons name="cut-outline" size={18} color="#4c947d" /></View>}<View style={s.serviceCopy}><Text style={s.serviceName}>{item.name}</Text><Text style={s.muted}>{item.durationMinutes || 60} minutes{item.category ? ` · ${item.category}` : ""}</Text>{item.offerText ? <Text style={s.offerText}>{item.offerText}</Text> : null}</View><View style={s.servicePrice}><Text style={s.price}>{price != null ? `₹${price.toLocaleString("en-IN")}` : "On request"}</Text><View style={s.serviceArrow}><Ionicons name="arrow-forward" size={14} color="#fffdfa" /></View></View></Pressable>;
}

function InfoRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return <View style={s.infoRow}><Ionicons name={icon} size={19} color="#4c947d" /><Text style={s.infoText}>{label}</Text></View>;
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { paddingBottom: 46 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f7f5f0", padding: 24 },
  hero: { height: 245, position: "relative", backgroundColor: "#20352d" },
  heroImage: { width: "100%", height: "100%" },
  galleryHeroSlide: { height: "100%" },
  heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#20352d" },
  heroPlaceholderText: { color: "#fffdfa", fontSize: 12, fontWeight: "800", marginTop: 8, letterSpacing: 1 },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(32,53,45,0.24)" },
  heroTopBar: { position: "absolute", top: 14, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  galleryRow: { gap: 10, paddingHorizontal: 14, paddingTop: 10 },
  galleryImage: { width: 112, height: 82, borderRadius: 14, backgroundColor: "#e7f1ed" },
  galleryViewer: { flex: 1, backgroundColor: "#15231e" },
  galleryViewerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingHorizontal: 18, paddingBottom: 10 },
  galleryViewerCount: { color: "#fffdfa", fontSize: 13, fontWeight: "800" },
  galleryClose: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,253,250,0.18)" },
  galleryViewerSlide: { alignItems: "center", justifyContent: "center" },
  galleryViewerImage: { width: "100%", height: "100%" },
  heroActions: { flexDirection: "row", gap: 8 },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,253,250,0.94)", alignItems: "center", justifyContent: "center" },
  profileCard: { marginTop: -24, marginHorizontal: 14, padding: 16, backgroundColor: "#fffdfa", borderRadius: 20, borderWidth: 1, borderColor: "#e1ddd4", shadowColor: "#20352d", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  profileTitleRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  salonMark: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#20352d", alignItems: "center", justifyContent: "center" },
  salonMarkText: { color: "#dfca73", fontSize: 24, fontWeight: "800" },
  profileCopy: { flex: 1 },
  title: { color: "#20352d", fontSize: 22, lineHeight: 27, fontWeight: "800" },
  location: { color: "#77817c", fontSize: 12, marginTop: 5 },
  profileMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaStrong: { color: "#20352d", fontSize: 13, fontWeight: "800" },
  metaMuted: { color: "#77817c", fontSize: 11 },
  offerPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, backgroundColor: "#fff1eb", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, marginTop: 12 },
  offerPillText: { color: "#c55239", fontSize: 11, fontWeight: "800" },
  openPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  open: { backgroundColor: "#e5f5ec" },
  closed: { backgroundColor: "#fbe9e4" },
  openText: { color: "#287b5c", fontSize: 10, fontWeight: "800" },
  closedText: { color: "#a74e3d", fontSize: 10, fontWeight: "800" },
  bookTopButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#c55239", borderRadius: 14, minHeight: 48, marginTop: 15 },
  bookTopText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  contactActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  contactAction: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#e7f1ed", borderRadius: 12, borderWidth: 1, borderColor: "#cfe0d7" },
  contactActionText: { color: "#26735a", fontSize: 11, fontWeight: "800" },
  tabs: { flexDirection: "row", marginTop: 18, marginHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#e1ddd4" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#c55239" },
  tabText: { color: "#77817c", fontSize: 12, fontWeight: "800" },
  tabTextActive: { color: "#c55239" },
  sectionCard: { backgroundColor: "#fffdfa", marginHorizontal: 14, marginTop: 16, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#e1ddd4" },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionEyebrow: { color: "#91b3a3", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  sectionTitle: { color: "#20352d", fontSize: 19, fontWeight: "800", marginTop: 4 },
  subsectionEyebrow: { marginTop: 18, marginBottom: 6 },
  serviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#eeeae2" },
  serviceSearch: { flexDirection: "row", alignItems: "center", minHeight: 46, backgroundColor: "#f7f5f0", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 13, paddingHorizontal: 12, marginBottom: 10 },
  serviceSearchInput: { flex: 1, color: "#20352d", fontSize: 12, paddingHorizontal: 8 },
  serviceFilters: { gap: 8, paddingBottom: 9 },
  serviceFilter: { borderWidth: 1, borderColor: "#d9d6ce", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fffdfa" },
  serviceFilterActive: { backgroundColor: "#20352d", borderColor: "#20352d" },
  serviceFilterText: { color: "#58665f", fontSize: 10, fontWeight: "800" },
  serviceFilterTextActive: { color: "#fffdfa" },
  serviceSortHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3, marginBottom: 7 },
  filterCaption: { color: "#20352d", fontSize: 11, fontWeight: "900" },
  filterHint: { color: "#91b3a3", fontSize: 10, fontWeight: "700" },
  serviceSorts: { gap: 8, paddingBottom: 12 },
  serviceSort: { borderWidth: 1, borderColor: "#d9e7df", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: "#f3f8f5" },
  serviceSortActive: { backgroundColor: "#fff1eb", borderColor: "#e8b7a9" },
  serviceSortText: { color: "#4c947d", fontSize: 10, fontWeight: "800" },
  serviceSortTextActive: { color: "#c55239" },
  serviceImage: { width: 48, height: 48, borderRadius: 13, backgroundColor: "#edf6f1", marginRight: 10 },
  serviceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#edf6f1", alignItems: "center", justifyContent: "center", marginRight: 10 },
  serviceCopy: { flex: 1 },
  serviceName: { color: "#20352d", fontSize: 13, fontWeight: "800" },
  muted: { color: "#77817c", fontSize: 11, lineHeight: 17, marginTop: 4 },
  servicePrice: { alignItems: "flex-end", gap: 4, marginLeft: 8 },
  serviceArrow: { width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#c55239" },
  price: { color: "#c55239", fontSize: 13, fontWeight: "900" },
  priceMuted: { color: "#77817c", fontSize: 10 },
  offerText: { color: "#c55239", fontSize: 10, fontWeight: "800", marginTop: 4 },
  simpleService: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eeeae2" },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eeeae2" },
  productIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#edf6f1", alignItems: "center", justifyContent: "center", marginRight: 10 },
  productCopy: { flex: 1 },
  reviewSummary: { flexDirection: "row", alignItems: "center", gap: 13, paddingBottom: 13 },
  reviewScore: { color: "#20352d", fontSize: 36, fontWeight: "900" },
  stars: { color: "#dfca73", fontSize: 18, letterSpacing: 2 },
  starsSmall: { color: "#dfca73", fontSize: 12, letterSpacing: 1 },
  reviewRow: { borderTopWidth: 1, borderTopColor: "#eeeae2", paddingVertical: 12 },
  reviewTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#eeeae2", paddingVertical: 13 },
  infoText: { flex: 1, color: "#20352d", fontSize: 13, fontWeight: "700" },
  branchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#eeeae2", paddingVertical: 11 },
  bookingCard: { backgroundColor: "#20352d", marginHorizontal: 14, marginTop: 18, padding: 16, borderRadius: 20 },
  bookingHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  bookingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#c55239", alignItems: "center", justifyContent: "center" },
  label: { color: "#dfca73", fontWeight: "800", fontSize: 11, marginTop: 17, marginBottom: 7 },
  dropdown: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 12, paddingHorizontal: 13 },
  dropdownMenu: { backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 12, marginTop: 6, overflow: "hidden" },
  dropdownOption: { paddingHorizontal: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#eeeae2" },
  choiceText: { color: "#20352d", fontWeight: "700", fontSize: 13 },
  input: { backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 12, padding: 13, color: "#20352d" },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  timeChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChoice: { minWidth: 92, alignItems: "center", backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  selected: { borderColor: "#c55239", backgroundColor: "#fff4ef" },
  couponChoices: { gap: 8 },
  couponChoice: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 11, padding: 12 },
  couponCopy: { flex: 1 },
  couponApplied: { color: "#4c947d", fontWeight: "800", marginLeft: 8 },
  couponNote: { color: "#c8d9d1", fontSize: 11, lineHeight: 17, marginTop: 8 },
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#c55239", borderRadius: 13, minHeight: 52, marginTop: 22 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  success: { color: "#9cddb9", marginTop: 14, textAlign: "center", fontWeight: "700" },
  error: { color: "#c55239", marginTop: 14, textAlign: "center" },
  back: { color: "#c55239", fontWeight: "700", marginTop: 14 },
});

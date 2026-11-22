// @ts-nocheck
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Google Maps remains available for a future billing-enabled build:
// import MapView, { Marker } from "react-native-maps";
import { FreeMap } from "../components/FreeMap";
import { API_URL, api, getAccessToken } from "../api";
import { useToast } from "../components/ToastProvider";
import { registerForPushNotifications } from "../push";

type Props = {
  role: "user" | "admin";
  email: string;
  initialSection?: string;
  showBack?: boolean;
  onBack?: () => void;
};
const SectionBannerVisibility = createContext(true);
type Price = {
  name: string;
  price: number;
  durationMinutes?: number;
  offerText?: string;
};
type Product = { id: string; name: string; description?: string; imageUrl?: string };
type Profile = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  texture?: string;
  length?: string;
  preferredStylist?: string;
};
type Passport = {
  guestName?: string;
  texture?: string;
  length?: string;
  preferredStylist?: string;
  notes?: string;
  preferences?: string[];
};
type Payment = {
  id?: string;
  appointmentId?: string;
  description?: string;
  amount?: number;
  total?: number;
  status?: string;
  createdAt?: string;
};

export function MoreScreen({
  role,
  email,
  initialSection,
  showBack = false,
  onBack,
}: Props) {
  const { showToast } = useToast();
  const [section, setSection] = useState(
    initialSection || (role === "admin" ? "customers" : "payments"),
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const contentOffsets = useRef<Record<string, number>>({});
  const pendingSection = useRef<string | null>(null);
  const selectSection = (value: string) => {
    pendingSection.current = value;
    setSection(value);
    requestAnimationFrame(() => {
      const offset = contentOffsets.current[value];
      if (offset != null) {
        scrollRef.current?.scrollTo({ y: Math.max(0, offset - 12), animated: true });
      }
    });
  };
  useEffect(() => {
    if (pendingSection.current !== section) return;
    const offset = contentOffsets.current[section];
    if (offset == null) return;
    pendingSection.current = null;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, offset - 12), animated: true }),
    );
  }, [section, loading]);
  const endpoints: Record<string, string> =
    role === "admin"
      ? {
          customers: "/customers",
          appointments: "/appointments",
          reports: "/dashboard/summary",
          consultations: "/consultations",
          salon: "/salon",
          prices: "/salon/price-list",
          products: "/salon",
          theme: "/salon/theme",
          media: "/salon",
          banners: "/banners/admin",
          reviews: "/reviews",
          payments: "/payments",
          passport: "/passport",
          notifications: "/auth/preferences",
          approvals: "/auth/admin-requests",
          memberships: "/memberships/admin/members",
          rewards: "/rewards/coupons/admin",
        }
      : {
          booking: "/salon/directory",
          payments: "/payments",
          profile: "/customers/me",
          lastVisit: "/customers/me/history",
          passport: "/passport",
          notifications: "/auth/preferences",
          reviews: "/reviews",
          memberships: "/memberships/me",
        };
  useEffect(() => {
    if (!initialSection || !endpoints[initialSection]) return;
    pendingSection.current = initialSection;
    if (initialSection !== section) setSection(initialSection);
  }, [initialSection]);
  useEffect(() => {
    setLoading(true);
    setError("");
    api<any>(endpoints[section])
      .then((result) => setData(result))
      .catch((e) =>
        (() => {
          const message = e instanceof Error ? e.message : "Unable to load this screen.";
          setError(message);
          showToast({ type: "error", message });
        })(),
      )
      .finally(() => setLoading(false));
  }, [section, showToast]);
  const prices = (
    Array.isArray(data) ? data : data?.serviceDetails || []
  ) as Price[];
  const products = (
    Array.isArray(data) ? data : data?.products || []
  ) as Product[];
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SectionBannerVisibility.Provider value={!showBack}>
        <ScrollView
          ref={scrollRef}
          style={styles.wrap}
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
      <MoreHeader
        endpoints={endpoints}
        section={section}
        setSection={selectSection}
        email={email}
        role={role}
        showBack={showBack}
        onBack={onBack}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#c55239" />
          <Text style={styles.muted}>Loading...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View
          style={styles.content}
          onLayout={(event) => {
            contentOffsets.current[section] = event.nativeEvent.layout.y;
            if (pendingSection.current === section) {
              requestAnimationFrame(() =>
                scrollRef.current?.scrollTo({
                  y: Math.max(0, event.nativeEvent.layout.y - 12),
                  animated: true,
                }),
              );
            }
          }}
        >
          {section === "booking" && (
            <BookingView salons={Array.isArray(data) ? data : []} />
          )}
          {section === "profile" && (
            <ProfileView profile={data || {}} email={email} />
          )}
          {section === "memberships" && (role === "admin" ? <MembershipAdminView initial={Array.isArray(data) ? data : []} /> : <MembershipView initial={Array.isArray(data) ? data : []} />)}
          {section === "lastVisit" && (
            <LastVisitView history={Array.isArray(data?.items) ? data.items : []} />
          )}
          {section === "passport" && <PassportView passport={data || {}} />}
          {section === "salon" && <AdminSalonView salon={data || {}} />}
          {section === "prices" && <AdminPriceView initial={prices} />}
          {section === "products" && <AdminProductView initial={products} />}
          {section === "theme" && <AdminThemeView initial={data || {}} />}
          {section === "media" && <AdminMediaView salon={data || {}} />}
          {section === "banners" && (
            <AdminBannerView initial={Array.isArray(data) ? data : []} />
          )}
          {section === "approvals" && (
            <AdminApprovalView initial={Array.isArray(data) ? data : []} />
          )}
          {section === "payments" && (
            <PaymentView payments={Array.isArray(data) ? data : []} />
          )}
          {section === "reviews" && (role === "admin" ? <AdminReviewsView initial={Array.isArray(data) ? data : []} /> : <ReviewView />)}
          {section === "notifications" && (
            <PreferencesView initial={data || {}} role={role} />
          )}
          {section === "customers" && (
            <AdminCustomersView
              initial={Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []}
            />
          )}
          {section === "appointments" && (
            <AdminAppointmentsView initial={Array.isArray(data) ? data : []} />
          )}
          {section === "reports" && <AdminReportsView initial={data || {}} />}
          {section === "consultations" && (
            <AdminConsultationsView initial={Array.isArray(data) ? data : []} />
          )}
          {section === "rewards" && <AdminRewardsView initial={data || {}} />}
        </View>
      )}
        </ScrollView>
      </SectionBannerVisibility.Provider>
    </KeyboardAvoidingView>
  );
}
const sectionMeta: Record<
  string,
  { label: string; description: string; icon: any }
> = {
  booking: {
    label: "Book a visit",
    description: "Find a salon and reserve a slot",
    icon: "calendar",
  },
  profile: {
    label: "My profile",
    description: "Personal details and preferences",
    icon: "person",
  },
  passport: {
    label: "Hair passport",
    description: "Keep your salon history handy",
    icon: "sparkles",
  },
  lastVisit: {
    label: "Last visit",
    description: "See your most recent salon appointment",
    icon: "time",
  },
  payments: {
    label: "Payments",
    description: "Invoices and payment history",
    icon: "card",
  },
  memberships: {
    label: "Memberships",
    description: "Plans, sessions and membership usage",
    icon: "ribbon",
  },
  reviews: {
    label: "Share feedback",
    description: "Tell us about your experience",
    icon: "heart",
  },
  notifications: {
    label: "Notifications",
    description: "Choose how we reach you",
    icon: "notifications",
  },
  customers: {
    label: "Customers",
    description: "Manage customer access",
    icon: "people",
  },
  appointments: {
    label: "Appointments",
    description: "Review and update booking requests",
    icon: "calendar",
  },
  reports: {
    label: "Reports and analytics",
    description: "Track bookings and salon performance",
    icon: "bar-chart",
  },
  consultations: {
    label: "Consultations",
    description: "Review guest consultations",
    icon: "chatbubbles",
  },
  salon: {
    label: "Salon setup",
    description: "Update your salon details",
    icon: "storefront",
  },
  theme: {
    label: "Branding",
    description: "Set your salon colours and identity",
    icon: "color-palette",
  },
  media: {
    label: "Private media",
    description: "Upload service and stylist images securely",
    icon: "images",
  },
  banners: {
    label: "Offers & banners",
    description: "Manage salon promotions",
    icon: "megaphone",
  },
  approvals: {
    label: "Approvals",
    description: "Review pending access",
    icon: "checkmark-circle",
  },
  rewards: {
    label: "Coupons and referrals",
    description: "Manage salon offers and referral reward settings",
    icon: "gift",
  },
};
function MoreHeader({
  endpoints,
  section,
  setSection,
  email,
  role,
  showBack,
  onBack,
}: {
  endpoints: Record<string, string>;
  section: string;
  setSection: (value: string) => void;
  email: string;
  role: "user" | "admin";
  showBack: boolean;
  onBack?: () => void;
}) {
  const displayEmail =
    email || (role === "admin" ? "Salon administrator" : "Welcome to Halo");
  const groups =
    role === "admin"
      ? [
          {
            title: "Salon management",
            keys: [
              "appointments",
              "reports",
              "salon",
              "customers",
              "consultations",
              "banners",
              "prices",
              "products",
              "theme",
              "media",
              "reviews",
              "payments",
              "passport",
              "notifications",
              "memberships",
              "rewards",
            ],
          },
        ]
      : [
          {
            title: "Your Halo account",
            keys: ["payments", "memberships", "lastVisit", "profile", "notifications", "reviews"],
          },
          ...(section !== "booking" &&
          section !== "payments" &&
          sectionMeta[section]
            ? [{ title: "Opened from account", keys: [section] }]
            : []),
        ];
  return (
    <View style={styles.headerContent}>
      <View style={styles.topBar}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Go back"
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: "#fffdfa",
              borderWidth: 1,
              borderColor: "#e4e1d9",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
            onPress={() => (onBack ? onBack() : router.back())}
          >
            <Ionicons name="arrow-back" size={22} color="#20352d" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.topEyebrow}>
            {role === "admin" ? "ADMIN SPACE" : "HALO ACCOUNT"}
          </Text>
          <Text style={styles.topTitle}>More</Text>
        </View>
        <View style={styles.topAvatar}>
          <Text style={styles.topAvatarText}>
            {(email || "H").slice(0, 1).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(email || "H").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.identityTitle}>
            {role === "admin" ? "Salon workspace" : "Your Halo account"}
          </Text>
          <Text style={styles.identityEmail}>{displayEmail}</Text>
        </View>
        <Ionicons name="shield-checkmark-outline" size={20} color="#4c947d" />
      </View>
      {showBack ? (
        <>
          <View style={styles.focusHeader}>
            <View style={styles.focusIcon}>
              <Ionicons name={sectionMeta[section]?.icon || "grid-outline"} size={23} color="#dfca73" />
            </View>
            <View style={styles.focusCopy}>
              <Text style={styles.focusEyebrow}>MANAGEMENT AREA</Text>
              <Text style={styles.focusTitle}>{sectionMeta[section]?.label || "Salon management"}</Text>
              <Text style={styles.focusDescription}>{sectionMeta[section]?.description || "Manage your salon workspace."}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNav}>
            {groups[0].keys.filter((key) => endpoints[key]).map((key) => {
              const item = sectionMeta[key] || { label: key, icon: "ellipse-outline" };
              const active = section === key;
              return (
                <Pressable key={key} style={[styles.quickNavChip, active && styles.quickNavChipActive]} onPress={() => setSection(key)}>
                  <Ionicons name={item.icon} size={14} color={active ? "#fff" : "#c55239"} />
                  <Text style={[styles.quickNavText, active && styles.quickNavTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : groups.map((group) => (
        <View key={group.title}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.settingsGroup}>
            {group.keys
              .filter((key) => endpoints[key])
              .map((key) => {
                const item = sectionMeta[key] || {
                  label: key,
                  description: "",
                  icon: "ellipse",
                };
                const active = section === key;
                return (
                  <Pressable key={key} style={[styles.settingRow, active && styles.settingRowActive]} onPress={() => setSection(key)}>
                    <View style={[styles.settingIcon, active && styles.settingIconActive]}>
                      <Ionicons name={item.icon} size={20} color={active ? "#fff" : "#c55239"} />
                    </View>
                    <View style={styles.settingCopy}>
                      <Text style={[styles.settingTitle, active && styles.settingTitleActive]}>{item.label}</Text>
                      <Text style={[styles.settingDescription, active && styles.settingDescriptionActive]} numberOfLines={1}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={active ? "#fff" : "#a7afa9"} />
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
    </View>
  );
}
function SectionBanner({ icon, eyebrow, title, description }: { icon: any; eyebrow: string; title: string; description: string }) {
  if (!useContext(SectionBannerVisibility)) return null;
  return (
    <View style={styles.sectionBanner}>
      <View style={styles.sectionBannerIcon}><Ionicons name={icon} size={22} color="#dfca73" /></View>
      <View style={styles.sectionBannerCopy}>
        <Text style={styles.sectionBannerEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionBannerTitle}>{title}</Text>
        <Text style={styles.sectionBannerDescription}>{description}</Text>
      </View>
    </View>
  );
}
function MessageToast({ message }: { message?: string }) {
  const { showToast } = useToast();
  const lastMessage = useRef("");
  useEffect(() => {
    if (!message) {
      lastMessage.current = "";
      return;
    }
    if (message === lastMessage.current) return;
    lastMessage.current = message;
    const type = /could not|unable|error|failed|cannot|required|invalid/i.test(message)
      ? "error"
      : /saved|sent|created|submitted|approved|activated|published|completed|cancelled|removed|updated/i.test(message)
        ? "success"
        : "warning";
    showToast({ type, message });
  }, [message, showToast]);
  return null;
}

function AdminRewardsView({ initial }: { initial: any }) {
  const [coupons, setCoupons] = useState<any[]>(initial.coupons || []);
  const [reward, setReward] = useState(String(initial.referralRewardAmount ?? 100));
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [message, setMessage] = useState("");
  const saveReward = async () => {
    try {
      await api("/rewards/referral-settings", {
        method: "PATCH",
        body: JSON.stringify({ rewardAmount: Number(reward) }),
      });
      setMessage("Referral reward saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save referral reward.");
    }
  };
  const addCoupon = async () => {
    if (!code.trim() || !discountValue.trim()) return setMessage("Enter a coupon code and discount value.");
    try {
      const coupon = await api<any>("/rewards/coupons", {
        method: "POST",
        body: JSON.stringify({ code: code.trim().toUpperCase(), discountType, discountValue: Number(discountValue), ...(maxUses.trim() ? { maxUses: Number(maxUses) } : {}) }),
      });
      setCoupons((items) => [coupon, ...items]);
      setCode(""); setDiscountValue(""); setMaxUses("");
      setMessage("Coupon added and available to customers now.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add coupon.");
    }
  };
  const toggleCoupon = async (coupon: any) => {
    try {
      const updated = await api<any>(`/rewards/coupons/${coupon.id}`, { method: "PATCH", body: JSON.stringify({ active: !coupon.active }) });
      setCoupons((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update coupon.");
    }
  };
  return (
    <View>
      <SectionBanner icon="gift-outline" eyebrow="REWARDS" title="Coupons and referrals" description="Change offers from the admin app. Customer checkout reads these settings live." />
      <View style={styles.rewardCard}><View style={styles.rewardCardTop}><View><Text style={styles.rewardEyebrow}>REFERRAL PROGRAM</Text><Text style={styles.rewardTitle}>Reward loyal guests</Text><Text style={styles.rewardHint}>Set the amount customers receive when they refer a friend.</Text></View><Text style={styles.rewardCurrency}>₹</Text></View><View style={styles.rewardInputRow}><View style={styles.rewardInputWrap}><Text style={styles.rewardInputPrefix}>₹</Text><TextInput value={reward} onChangeText={setReward} keyboardType="numeric" placeholder="100" style={styles.rewardInput} placeholderTextColor="#9aa19c" /></View><Pressable style={styles.rewardSaveButton} onPress={() => void saveReward()}><Text style={styles.rewardSaveText}>Save reward</Text></Pressable></View></View>
      <View style={styles.couponEditorCard}><View style={styles.couponEditorHeader}><View><Text style={styles.formSectionLabel}>CUSTOMER OFFERS</Text><Text style={styles.couponEditorTitle}>Create a coupon</Text></View><Text style={styles.couponHint}>Optional</Text></View><Text style={styles.couponFieldLabel}>COUPON CODE</Text><TextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="e.g. HALO10" style={styles.input} placeholderTextColor="#9aa19c" /><View style={styles.twoInputs}><View style={styles.couponDiscountInput}><Text style={styles.couponFieldLabel}>{discountType === "percent" ? "DISCOUNT %" : "DISCOUNT ₹"}</Text><TextInput value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" placeholder={discountType === "percent" ? "10" : "100"} style={styles.input} placeholderTextColor="#9aa19c" /></View><View style={styles.couponDiscountInput}><Text style={styles.couponFieldLabel}>TYPE</Text><Pressable style={[styles.input, styles.couponTypeButton]} onPress={() => setDiscountType((value) => value === "percent" ? "fixed" : "percent")}><Text style={styles.cardTextDark}>{discountType === "percent" ? "Percentage" : "Fixed amount"}</Text></Pressable></View></View><Text style={styles.couponFieldLabel}>USAGE LIMIT</Text><TextInput value={maxUses} onChangeText={setMaxUses} keyboardType="numeric" placeholder="Unlimited" style={styles.input} placeholderTextColor="#9aa19c" /><Pressable style={styles.secondary} onPress={() => void addCoupon()}><Text style={styles.actionText}>Add coupon</Text></Pressable></View>
      <Text style={styles.formSectionTitle}>Existing coupons</Text>
      {coupons.length ? coupons.map((coupon) => (
        <View style={styles.branchCard} key={coupon.id}>
          <View style={styles.branchHeader}><Text style={styles.cardTextDark}>{coupon.code}</Text><Pressable onPress={() => void toggleCoupon(coupon)}><Text style={coupon.active ? styles.activeText : styles.actionText}>{coupon.active ? "Active" : "Inactive"}</Text></Pressable></View>
          <Text style={styles.muted}>{coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`} · Used {coupon.usedCount || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ""}</Text>
        </View>
      )) : <Text style={styles.muted}>No coupons created yet.</Text>}
      <MessageToast message={message} />
    </View>
  );
}

function AdminSalonView({ salon }: { salon: any }) {
  const [name, setName] = useState(salon.name || "");
  const [location, setLocation] = useState(salon.location || "");
  const [services, setServices] = useState((salon.services || []).join(", "));
  const [stylists, setStylists] = useState((salon.stylists || []).join(", "));
  const [opening, setOpening] = useState(salon.openingHours?.open || "09:00");
  const [closing, setClosing] = useState(salon.openingHours?.close || "19:00");
  const [closedDays, setClosedDays] = useState((salon.closedDays || []).join(", "));
  const [stylistProfiles, setStylistProfiles] = useState(salon.stylistProfiles || {});
  const [stylistSchedules, setStylistSchedules] = useState(salon.stylistSchedules || {});
  const [branches, setBranches] = useState<any[]>(
    salon.branches?.length
      ? salon.branches
      : [
          {
            id: "main",
            name: salon.name || "Main branch",
            location: salon.location || "",
            contact: "",
            active: true,
            latitude: undefined,
            longitude: undefined,
            openingHours: { open: "09:00", close: "19:00" },
            closedDays: [],
            services: [],
            stylists: [],
          },
        ],
  );
  const [message, setMessage] = useState("");
  const updateBranch = (id: string, changes: any) =>
    setBranches((current) =>
      current.map((branch) =>
        branch.id === id ? { ...branch, ...changes } : branch,
      ),
    );
  const addBranch = () =>
    setBranches((current) => [
      ...current,
      {
        id: `branch-${Date.now()}`,
        name: "New branch",
        location: "",
        contact: "",
        active: true,
        openingHours: { open: opening || "09:00", close: closing || "19:00" },
        closedDays: [],
        services: [],
        stylists: [],
      },
    ]);
  async function save() {
    const serviceList = services
      .split(",")
      .map((x: string) => x.trim())
      .filter(Boolean);
    const stylistList = stylists
      .split(",")
      .map((x: string) => x.trim())
      .filter(Boolean);
    if (serviceList.some((item: string) => item.length < 2)) {
      setMessage("Each service must have at least 2 characters.");
      return;
    }
    if (stylistList.some((item: string) => item.length < 2)) {
      setMessage("Each stylist must have at least 2 characters.");
      return;
    }
    try {
      await api("/salon", {
        method: "PUT",
        body: JSON.stringify({
          name,
          location,
          services: serviceList,
          stylists: stylistList,
          openingHours: { open: opening, close: closing },
          closedDays: closedDays.split(",").map((day: string) => day.trim()).filter(Boolean),
          stylistProfiles,
          stylistSchedules,
          branches: branches.map((branch) => ({
            ...branch,
            name: branch.name.trim(),
            location: branch.location.trim(),
            contact: branch.contact?.trim() || "",
            active: branch.active !== false,
            latitude:
              branch.latitude === "" || branch.latitude == null
                ? undefined
                : Number(branch.latitude),
            longitude:
              branch.longitude === "" || branch.longitude == null
                ? undefined
                : Number(branch.longitude),
          })),
          products: salon.products || [],
          serviceDetails: salon.serviceDetails || [],
        }),
      });
      setMessage("Salon settings saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save salon.");
    }
  }
  return (
    <View>
      <SectionBanner icon="storefront-outline" eyebrow="STUDIO SETUP" title="Salon setup" description="Keep branches, hours, services, and stylists ready for guests." />
      <View style={styles.setupSummary}>
        <View style={styles.setupSummaryIcon}><Ionicons name="storefront-outline" size={23} color="#c55239" /></View>
        <View style={styles.setupSummaryCopy}><Text style={styles.setupSummaryTitle}>{name || "Your salon"}</Text><Text style={styles.setupSummaryText}>{location || "Add your main location"}</Text></View>
        <View style={styles.activePill}><View style={styles.activeDot} /><Text style={styles.activePillText}>Live setup</Text></View>
      </View>
      <Text style={styles.formSectionTitle}>Salon details</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Enter salon name" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={location} onChangeText={setLocation} placeholder="Enter main salon location" style={styles.input} placeholderTextColor="#9aa19c" />
      <Text style={styles.formSectionLabel}>OPENING HOURS</Text>
      <View style={styles.twoInputs}>
        <TextInput value={opening} onChangeText={setOpening} placeholder="Enter opening time (HH:MM)" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
        <TextInput value={closing} onChangeText={setClosing} placeholder="Enter closing time (HH:MM)" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
      </View>
      <TextInput value={services} onChangeText={setServices} placeholder="Enter services separated by commas" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={stylists} onChangeText={setStylists} placeholder="Enter stylist names separated by commas" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={closedDays} onChangeText={setClosedDays} placeholder="Enter closed days, e.g. Sunday" style={styles.input} placeholderTextColor="#9aa19c" />
      <View style={styles.stylistSectionHeader}>
        <View>
          <Text style={styles.formSectionLabel}>TEAM MANAGEMENT</Text>
          <Text style={styles.stylistSectionTitle}>Stylist profiles</Text>
        </View>
        <Text style={styles.stylistSectionCount}>{stylists.split(",").map((value: string) => value.trim()).filter(Boolean).length} team member{stylists.split(",").map((value: string) => value.trim()).filter(Boolean).length === 1 ? "" : "s"}</Text>
      </View>
      {stylists.split(",").map((value: string) => value.trim()).filter(Boolean).map((stylist: string) => {
        const profile = stylistProfiles[stylist] || { bio: "", imageUrl: "" };
        const schedule = stylistSchedules[stylist] || { workingDays: [], leaveDates: [] };
        return (
          <View style={styles.stylistProfileCard} key={stylist}>
            <View style={styles.stylistProfileHeader}>
              <View style={styles.stylistAvatar}><Text style={styles.stylistAvatarText}>{stylist.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.stylistProfileCopy}><Text style={styles.stylistName}>{stylist}</Text><Text style={styles.stylistMeta}>{schedule.workingDays?.length ? `${schedule.workingDays.length} working day${schedule.workingDays.length === 1 ? "" : "s"}` : "Availability not set"}</Text></View>
              <View style={styles.stylistStatusPill}><View style={styles.activeDot} /><Text style={styles.stylistStatusText}>Active</Text></View>
            </View>
            <Text style={styles.stylistFieldLabel}>PROFILE</Text>
            <TextInput
              value={profile.bio || ""}
              onChangeText={(value) => setStylistProfiles((current: any) => ({ ...current, [stylist]: { ...profile, bio: value } }))}
              placeholder="Add a short introduction"
              style={styles.stylistInput}
              placeholderTextColor="#9aa19c"
            />
            <TextInput
              value={profile.imageUrl || ""}
              onChangeText={(value) => setStylistProfiles((current: any) => ({ ...current, [stylist]: { ...profile, imageUrl: value } }))}
              placeholder="Profile image URL (optional)"
              style={styles.stylistInput}
              placeholderTextColor="#9aa19c"
              autoCapitalize="none"
            />
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleHeader}><Text style={styles.stylistFieldLabel}>SCHEDULE</Text><Text style={styles.scheduleHint}>Used for bookings</Text></View>
            <TextInput
              value={(schedule.workingDays || []).join(", ")}
              onChangeText={(value) => setStylistSchedules((current: any) => ({ ...current, [stylist]: { ...schedule, workingDays: value.split(",").map((day: string) => day.trim()).filter(Boolean) } }))}
              placeholder="Working days, e.g. Monday, Tuesday"
              style={styles.stylistInput}
              placeholderTextColor="#9aa19c"
            />
            <TextInput
              value={(schedule.leaveDates || []).join(", ")}
              onChangeText={(value) => setStylistSchedules((current: any) => ({ ...current, [stylist]: { ...schedule, leaveDates: value.split(",").map((day: string) => day.trim()).filter(Boolean) } }))}
              placeholder="Leave dates, e.g. 2026-11-20"
              style={[styles.stylistInput, { marginBottom: 0 }]}
              placeholderTextColor="#9aa19c"
            />
          </View>
        );
      })}
      <Text style={styles.subheading}>Branches</Text>
      {branches.map((branch) => (
        <View style={styles.branchCard} key={branch.id}>
          <View style={styles.branchHeader}>
            <View style={styles.branchTitleWrap}><View style={styles.branchIcon}><Ionicons name="location-outline" size={17} color="#c55239" /></View><View><Text style={styles.branchTitle}>{branch.name || "Branch"}</Text><Text style={styles.branchHint}>{branch.location || "Location not added"}</Text></View></View>
            <Pressable
              onPress={() => updateBranch(branch.id, { active: branch.active === false })}
            >
              <Text style={branch.active === false ? styles.actionText : styles.activeText}>
                {branch.active === false ? "Inactive" : "Active"}
              </Text>
            </Pressable>
          </View>
          <TextInput value={branch.name} onChangeText={(value) => updateBranch(branch.id, { name: value })} placeholder="Enter branch name" style={styles.input} placeholderTextColor="#9aa19c" />
          <TextInput value={branch.location} onChangeText={(value) => updateBranch(branch.id, { location: value })} placeholder="Enter branch location" style={styles.input} placeholderTextColor="#9aa19c" />
          <TextInput value={branch.contact || ""} onChangeText={(value) => updateBranch(branch.id, { contact: value })} placeholder="Enter branch phone or email" style={styles.input} placeholderTextColor="#9aa19c" />
          <View style={styles.twoInputs}>
            <TextInput value={branch.openingHours?.open || opening} onChangeText={(value) => updateBranch(branch.id, { openingHours: { ...branch.openingHours, open: value } })} placeholder="Enter opening time" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
            <TextInput value={branch.openingHours?.close || closing} onChangeText={(value) => updateBranch(branch.id, { openingHours: { ...branch.openingHours, close: value } })} placeholder="Enter closing time" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
          </View>
          <TextInput
            value={(branch.closedDays || []).join(", ")}
            onChangeText={(value) =>
              updateBranch(branch.id, {
                closedDays: value.split(",").map((day: string) => day.trim()).filter(Boolean),
              })
            }
            placeholder="Enter closed days, e.g. Sunday"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <View style={styles.twoInputs}>
          <TextInput value={branch.latitude == null ? "" : String(branch.latitude)} onChangeText={(value) => updateBranch(branch.id, { latitude: value })} placeholder="Enter latitude" keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
          <TextInput value={branch.longitude == null ? "" : String(branch.longitude)} onChangeText={(value) => updateBranch(branch.id, { longitude: value })} placeholder="Enter longitude" keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
          </View>
          {Number.isFinite(Number(branch.latitude)) && Number.isFinite(Number(branch.longitude)) ? (
            <View style={styles.branchMapCard}>
              <View style={styles.branchMapHeader}>
                <View>
                  <Text style={styles.branchMapTitle}>Branch location</Text>
                  <Text style={styles.branchMapHint}>Drag the pin to adjust the map location.</Text>
                </View>
                <Ionicons name="map-outline" size={18} color="#c55239" />
              </View>
              <FreeMap
                height={150}
                points={[{ id: branch.id, title: branch.name || "Branch", latitude: Number(branch.latitude), longitude: Number(branch.longitude), draggable: true }]}
                center={{ latitude: Number(branch.latitude), longitude: Number(branch.longitude) }}
                onMapPress={(coordinate) => updateBranch(branch.id, coordinate)}
                onMarkerDragEnd={(coordinate) => updateBranch(branch.id, coordinate)}
              />
              {/* Google Maps version retained for reference:
              <MapView ...><Marker ... /></MapView>
              */}
            </View>
          ) : (
            <View style={styles.branchMapEmpty}>
              <Ionicons name="location-outline" size={18} color="#4c947d" />
              <Text style={styles.branchMapEmptyText}>Add latitude and longitude to place this branch on the map.</Text>
            </View>
          )}
        </View>
      ))}
      <Pressable style={styles.secondary} onPress={addBranch}>
        <Text style={styles.actionText}>+ Add branch</Text>
      </Pressable>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save salon details</Text>
      </Pressable>
      <MessageToast message={message} />
    </View>
  );
}
function AdminPriceView({ initial }: { initial: Price[] }) {
  const [items, setItems] = useState<any[]>(initial.map((item) => ({ ...item })));
  const [editing, setEditing] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const updateItem = (index: number, values: any) =>
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  const addItem = () => {
    setItems((current) => [...current, { category: "General", name: "", price: "", durationMinutes: "60", active: true }]);
    setEditing(items.length);
    setMessage("");
  };
  async function save() {
    const invalid = items.some((item) => !String(item.name || "").trim() || Number(item.price) < 0 || !Number(item.durationMinutes));
    if (invalid) { setMessage("Complete the service name, price, and duration before saving."); return; }
    try {
      await api("/salon/price-list", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      setEditing(null);
      setMessage("Prices saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save prices.");
    }
  }
  return (
    <View>
      <SectionBanner icon="pricetag-outline" eyebrow="STUDIO CATALOG" title="Prices and offers" description="Keep your services clear, current, and ready for guests." />
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}><View style={styles.editorIcon}><Ionicons name="pricetag-outline" size={19} color="#c55239" /></View><View style={styles.editorHeaderCopy}><Text style={styles.editorTitle}>Service catalogue</Text><Text style={styles.editorHint}>Add and update each service individually.</Text></View></View>
        {items.length ? items.map((item, index) => (
          <View style={styles.catalogItem} key={`price-${index}`}>
            <View style={styles.catalogItemHeader}>
              <View style={styles.catalogItemCopy}>
                <Text style={styles.catalogItemTitle}>{item.name || "New service"}</Text>
                <Text style={styles.catalogItemMeta}>{item.category || "General"}</Text>
                <Text style={styles.catalogItemMeta}>₹{Number(item.price) || 0} · {item.durationMinutes || 60} minutes</Text>
              </View>
              <Pressable style={styles.editButton} onPress={() => setEditing(editing === index ? null : index)}>
                <Ionicons name={editing === index ? "checkmark-outline" : "create-outline"} size={16} color="#26735a" />
                <Text style={styles.editButtonText}>{editing === index ? "Done" : "Edit"}</Text>
              </Pressable>
            </View>
            {editing === index ? (
              <View style={styles.catalogEditor}>
                <Text style={styles.fieldLabel}>SERVICE CATEGORY</Text>
                <TextInput value={item.category || ""} onChangeText={(value) => updateItem(index, { category: value })} placeholder="Enter category, e.g. Hair, Nails, Skin" style={styles.input} placeholderTextColor="#9aa19c" />
                <Text style={styles.fieldLabel}>SERVICE NAME</Text>
                <TextInput value={item.name} onChangeText={(value) => updateItem(index, { name: value })} placeholder="Enter service name, e.g. Haircut" style={styles.input} placeholderTextColor="#9aa19c" />
                <View style={styles.twoInputs}>
                  <View style={styles.flexInput}><Text style={styles.fieldLabel}>PRICE (₹)</Text><TextInput value={String(item.price ?? "")} onChangeText={(value) => updateItem(index, { price: value })} keyboardType="numeric" placeholder="Enter price" style={styles.input} placeholderTextColor="#9aa19c" /></View>
                  <View style={styles.flexInput}><Text style={styles.fieldLabel}>DURATION (MIN)</Text><TextInput value={String(item.durationMinutes ?? "")} onChangeText={(value) => updateItem(index, { durationMinutes: value })} keyboardType="numeric" placeholder="Enter duration in minutes" style={styles.input} placeholderTextColor="#9aa19c" /></View>
                </View>
                <TextInput value={item.offerText || ""} onChangeText={(value) => updateItem(index, { offerText: value })} placeholder="Optional offer text" style={styles.input} placeholderTextColor="#9aa19c" />
                <Pressable onPress={() => { setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)); setEditing(null); }}>
                  <Text style={styles.deleteText}>Remove service</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )) : <Text style={styles.muted}>No services added yet. Add your first service below.</Text>}
        <Pressable style={styles.addItemButton} onPress={addItem}><Ionicons name="add-outline" size={18} color="#26735a" /><Text style={styles.actionText}>Add service</Text></Pressable>
      </View>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save prices</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function AdminProductView({ initial }: { initial: Product[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>(initial.map((item) => ({ ...item })));
  const [editing, setEditing] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [imageConsent, setImageConsent] = useState(false);
  const updateItem = (index: number, values: any) =>
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  const addItem = () => {
    setItems((current) => [...current, { id: `product-${Date.now()}`, name: "", description: "", active: true }]);
    setEditing(items.length);
    setImageConsent(false);
  };
  const chooseProductImage = async (index: number) => {
    if (!imageConsent) {
      showToast({ type: "warning", message: "Confirm that this product image may be stored for salon use." });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ type: "warning", message: "Photo permission is required to upload a product image." });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingIndex(index);
    try {
      const asset = result.assets[0];
      const normalized = await ImageManipulator.manipulateAsync(
        asset.uri,
        [],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      const form = new FormData();
      form.append("file", {
        uri: normalized.uri,
        name: `${items[index]?.id || "product"}.jpg`,
        type: "image/jpeg",
      } as any);
      form.append("consentGiven", "true");
      const uploaded = await api<any>("/media/upload", { method: "POST", body: form });
      updateItem(index, { imageUrl: `${API_URL}${uploaded.url}`, previewUri: normalized.uri });
      showToast({ type: "success", message: "Product image selected. Save products to publish it." });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not upload product image." });
    } finally {
      setUploadingIndex(null);
    }
  };
  async function save() {
    const products = items.map((item) => ({ id: String(item.id || "").trim(), name: String(item.name || "").trim(), description: String(item.description || "").trim(), imageUrl: String(item.imageUrl || "").trim(), active: item.active !== false }));
    if (products.some((item) => !item.id || item.name.length < 2)) { showToast({ type: "warning", message: "Complete the product ID and name before saving." }); return; }
    try {
      await api("/salon/products", {
        method: "PUT",
        body: JSON.stringify({ products }),
      });
      setEditing(null);
      showToast({ type: "success", message: "Products saved." });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not save products." });
    }
  }
  return (
    <View>
      <SectionBanner icon="cube-outline" eyebrow="PRODUCT CATALOG" title="Products used" description="Show guests the professional products behind every visit." />
      <View style={styles.editorCard}>
        <View style={styles.editorHeader}><View style={styles.editorIcon}><Ionicons name="cube-outline" size={19} color="#c55239" /></View><View style={styles.editorHeaderCopy}><Text style={styles.editorTitle}>Products used in the salon</Text><Text style={styles.editorHint}>Tap Edit to update the product guests see.</Text></View></View>
        {items.length ? items.map((item, index) => (
          <View style={styles.catalogItem} key={`product-${item.id || index}`}>
            <View style={styles.catalogItemHeader}>
              <View style={styles.catalogItemCopy}><Text style={styles.catalogItemTitle}>{item.name || "New product"}</Text><Text style={styles.catalogItemMeta}>{item.description || "No description added"}</Text></View>
              <Pressable style={styles.editButton} onPress={() => setEditing(editing === index ? null : index)}><Ionicons name={editing === index ? "checkmark-outline" : "create-outline"} size={16} color="#26735a" /><Text style={styles.editButtonText}>{editing === index ? "Done" : "Edit"}</Text></Pressable>
            </View>
            {editing === index ? (
              <View style={styles.catalogEditor}>
                {item.imageUrl ? <Image source={{ uri: item.previewUri || (String(item.imageUrl).startsWith("http") ? item.imageUrl : `${API_URL}${item.imageUrl}`) }} style={styles.productImagePreview} /> : <View style={styles.productImageEmpty}><Ionicons name="image-outline" size={22} color="#26735a" /><Text style={styles.muted}>No product image added</Text></View>}
                <Pressable style={[styles.secondary, uploadingIndex === index && styles.disabled]} disabled={uploadingIndex === index} onPress={() => void chooseProductImage(index)}>
                  <Ionicons name="cloud-upload-outline" size={17} color="#26735a" />
                  <Text style={styles.actionText}>{uploadingIndex === index ? "Uploading..." : item.imageUrl ? "Change product image" : "Upload product image"}</Text>
                </Pressable>
                <Pressable style={styles.preference} onPress={() => setImageConsent((value) => !value)}>
                  <Text style={styles.checkbox}>{imageConsent ? "✓" : ""}</Text>
                  <Text style={styles.cardTextDark}>I confirm this image may be stored for salon use.</Text>
                </Pressable>
                <Text style={styles.fieldLabel}>PRODUCT NAME</Text>
                <TextInput value={item.name} onChangeText={(value) => updateItem(index, { name: value })} placeholder="Enter product name, e.g. L'Oreal shampoo" style={styles.input} placeholderTextColor="#9aa19c" />
                <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                <TextInput value={item.description || ""} onChangeText={(value) => updateItem(index, { description: value })} placeholder="Describe what this product is used for" style={[styles.input, styles.multiline]} multiline placeholderTextColor="#9aa19c" />
                <Pressable onPress={() => { setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)); setEditing(null); }}><Text style={styles.deleteText}>Remove product</Text></Pressable>
              </View>
            ) : null}
          </View>
        )) : <Text style={styles.muted}>No products added yet. Add your first product below.</Text>}
        <Pressable style={styles.addItemButton} onPress={addItem}><Ionicons name="add-outline" size={18} color="#26735a" /><Text style={styles.actionText}>Add product</Text></Pressable>
      </View>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save products</Text>
      </Pressable>
    </View>
  );
}
function AdminThemeView({ initial }: { initial: any }) {
  const [theme, setTheme] = useState({
    brandName: initial.brandName || "halo",
    logoMark: initial.logoMark || "h",
    logoUrl: initial.logoUrl || "",
    primary: initial.primary || "#b9533a",
    sidebar: initial.sidebar || "#20352d",
    surface: initial.surface || "#f7f5f0",
    ink: initial.ink || "#25372f",
  });
  const [message, setMessage] = useState("");
  const update = (key: string, value: string) =>
    setTheme((current) => ({ ...current, [key]: value }));
  async function save() {
    try {
      const saved = await api<any>("/salon/theme", {
        method: "PUT",
        body: JSON.stringify(theme),
      });
      setTheme((current) => ({ ...current, ...saved }));
      setMessage("Branding saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save branding.");
    }
  }
  return (
    <View>
      <SectionBanner icon="color-palette-outline" eyebrow="BRAND STUDIO" title="Salon branding" description="Shape the visual identity guests see across your salon." />
      {([
        ["brandName", "Brand name"],
        ["logoMark", "Logo mark"],
        ["logoUrl", "Logo image URL"],
        ["primary", "Primary colour"],
        ["sidebar", "Sidebar colour"],
        ["surface", "Surface colour"],
        ["ink", "Text colour"],
      ] as [string, string][]).map(([key, placeholder]) => (
        <TextInput
          key={key}
          value={theme[key]}
          onChangeText={(value) => update(key, value)}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#9aa19c"
          autoCapitalize="none"
        />
      ))}
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save branding</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function AdminMediaView({ salon }: { salon: any }) {
  const [kind, setKind] = useState<"service" | "stylist" | "salon">("service");
  const [name, setName] = useState((salon.services || [])[0] || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(Array.isArray(salon.galleryImages) ? salon.galleryImages : []);
  const [galleryPreviews, setGalleryPreviews] = useState<Record<string, string>>({});
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { void getAccessToken().then(setAccessToken); }, []);
  const services = Array.isArray(salon.serviceDetails)
    ? salon.serviceDetails
    : (salon.services || []).map((item: string) => ({ name: item, imageUrl: "" }));
  const profiles = salon.stylistProfiles || {};
  const names = kind === "service" ? salon.services || [] : salon.stylists || [];
  const currentImage = kind === "service"
    ? services.find((item: any) => item.name === name)?.imageUrl
    : profiles[name]?.imageUrl;
  const currentImages = kind === "service"
    ? (services.find((item: any) => item.name === name)?.imageUrls || (currentImage ? [currentImage] : []))
    : (profiles[name]?.imageUrls || (currentImage ? [currentImage] : []));
  const changeKind = (next: "service" | "stylist" | "salon") => {
    setKind(next);
    if (next !== "salon") setName(next === "service" ? (salon.services || [])[0] || "" : (salon.stylists || [])[0] || "");
  };
  const chooseAndUpload = async () => {
    if (kind !== "salon" && !name) {
      setMessage("Select a service or stylist and confirm image storage consent.");
      return;
    }
    if (!consent) {
      setMessage(kind === "salon" ? "Confirm that these salon images may be stored for salon use." : "Confirm that this image may be stored for salon use.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo permission is required to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (result.canceled || !result.assets.length) return;
    setBusy(true);
    setMessage("");
    try {
      if (kind === "salon") {
        const uploadedImages: { url: string; preview: string }[] = [];
        for (const asset of result.assets) {
          const maxDimension = Math.max(asset.width || 0, asset.height || 0);
          const actions = maxDimension > 2400
            ? [{ resize: maxDimension === asset.width ? { width: 2400 } : { height: 2400 } }]
            : [];
          const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
            compress: 0.82,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: false,
          });
          const fileResponse = await fetch(normalized.uri);
          const imageBlob = await fileResponse.blob();
          const filename = `${(salon.name || "salon").replace(/\s+/g, "-")}-${Date.now()}-${uploadedImages.length}.jpg`;
          const form = new FormData();
          form.append("file", imageBlob as any, filename);
          form.append("consentGiven", "true");
          const uploaded = await api<any>("/media/upload", { method: "POST", body: form });
          uploadedImages.push({ url: `${API_URL}${uploaded.url}`, preview: normalized.uri });
        }
        const nextGallery = [...galleryImages, ...uploadedImages.map((item) => item.url)];
        await api("/salon/gallery", { method: "PUT", body: JSON.stringify({ galleryImages: nextGallery }) });
        setGalleryImages(nextGallery);
        setGalleryPreviews((current) => ({ ...current, ...Object.fromEntries(uploadedImages.map((item) => [item.url, item.preview])) }));
        setMessage(`${uploadedImages.length} salon image${uploadedImages.length === 1 ? "" : "s"} added.`);
        return;
      }
      const uploadedImages: { url: string; preview: string }[] = [];
      for (const asset of result.assets) {
        const maxDimension = Math.max(asset.width || 0, asset.height || 0);
        const actions = maxDimension > 2400
          ? [{ resize: maxDimension === asset.width ? { width: 2400 } : { height: 2400 } }]
          : [];
        const normalized = await ImageManipulator.manipulateAsync(asset.uri, actions, {
          compress: 0.82,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        });
        const fileResponse = await fetch(normalized.uri);
        const imageBlob = await fileResponse.blob();
        const filename = `${(name || salon.name || "salon").replace(/\s+/g, "-")}-${Date.now()}-${uploadedImages.length}.jpg`;
        const form = new FormData();
        form.append("file", imageBlob as any, filename);
        form.append("consentGiven", "true");
        const uploaded = await api<any>("/media/upload", { method: "POST", body: form });
        uploadedImages.push({ url: `${API_URL}${uploaded.url}`, preview: normalized.uri });
      }
      const imageUrls = uploadedImages.map((item) => item.url);
      const imageUrl = imageUrls[0];
      const nextServiceDetails = services.map((item: any) => item.name === name ? { ...item, imageUrl, imageUrls } : item);
      const nextProfiles = {
        ...profiles,
        [name]: { ...(profiles[name] || {}), imageUrl, imageUrls },
      };
      await api("/salon", {
        method: "PUT",
        body: JSON.stringify({
          services: salon.services?.length ? salon.services : ["Consultation"],
          stylists: salon.stylists?.length ? salon.stylists : ["Any available stylist"],
          serviceDetails: nextServiceDetails,
          stylistProfiles: nextProfiles,
          products: salon.products || [],
          branches: salon.branches || [],
        }),
      });
      setMessage(`${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} uploaded and linked.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not upload image.");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!currentImage) return;
    const id = String(currentImage).split("/media/")[1]?.split("?")[0];
    if (!id) {
      setMessage("This image cannot be removed from the mobile screen.");
      return;
    }
    setBusy(true);
    try {
      await api(`/media/${id}`, { method: "DELETE" });
      const serviceDetails = services.map((item: any) => item.name === name ? { ...item, imageUrl: "" } : item);
      const stylistProfiles = { ...profiles, [name]: { ...(profiles[name] || {}), imageUrl: "" } };
      await api("/salon", {
        method: "PUT",
        body: JSON.stringify({
          services: salon.services?.length ? salon.services : ["Consultation"],
          stylists: salon.stylists?.length ? salon.stylists : ["Any available stylist"],
          serviceDetails,
          stylistProfiles,
          products: salon.products || [],
          branches: salon.branches || [],
        }),
      });
      setMessage("Image removed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not remove image.");
    } finally {
      setBusy(false);
    }
  };
  const removeGalleryImage = async (imageUrl: string) => {
    setBusy(true);
    try {
      const id = String(imageUrl).split("/media/")[1]?.split("?")[0];
      if (id) await api(`/media/${id}`, { method: "DELETE" });
      const nextGallery = galleryImages.filter((item) => item !== imageUrl);
      await api("/salon/gallery", { method: "PUT", body: JSON.stringify({ galleryImages: nextGallery }) });
      setGalleryImages(nextGallery);
      setGalleryPreviews((current) => { const next = { ...current }; delete next[imageUrl]; return next; });
      setMessage("Salon image removed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not remove salon image.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <SectionBanner icon="images-outline" eyebrow="STUDIO ASSETS" title="Private media" description="Keep protected service and stylist images ready for the guest experience." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaChipRow}>
        <Pressable style={[styles.choice, kind === "service" && styles.choiceActive]} onPress={() => changeKind("service")}>
          <Text style={styles.cardTextDark}>Service image</Text>
        </Pressable>
        <Pressable style={[styles.choice, kind === "stylist" && styles.choiceActive]} onPress={() => changeKind("stylist")}>
          <Text style={styles.cardTextDark}>Stylist image</Text>
        </Pressable>
        <Pressable style={[styles.choice, kind === "salon" && styles.choiceActive]} onPress={() => changeKind("salon")}>
          <Text style={styles.cardTextDark}>Salon gallery</Text>
        </Pressable>
      </ScrollView>
      {kind === "salon" ? <View style={styles.galleryAdminCard}><Text style={styles.cardTextDark}>Salon gallery</Text><Text style={styles.muted}>Add multiple photos of the interior, exterior, chairs, and experience.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryAdminRow}>{galleryImages.map((imageUrl, index) => <View style={styles.galleryAdminItem} key={`${imageUrl}-${index}`}><Image source={{ uri: galleryPreviews[imageUrl] || imageUrl, ...(accessToken && !galleryPreviews[imageUrl] ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) }} style={styles.galleryAdminImage} /><Pressable style={styles.galleryRemoveButton} onPress={() => void removeGalleryImage(imageUrl)}><Ionicons name="close" size={14} color="#fff" /></Pressable></View>)}</ScrollView></View> : <><TextInput value={name} onChangeText={setName} placeholder={kind === "service" ? "Enter service name" : "Enter stylist name"} style={styles.input} placeholderTextColor="#9aa19c" /><Text style={styles.muted}>Available: {names.join(", ") || "None configured"}</Text></>}
      <Pressable style={[styles.secondary, busy && styles.disabled]} disabled={busy} onPress={() => void chooseAndUpload()}>
        <Text style={styles.actionText}>{busy ? "Working..." : kind === "salon" ? "Add salon image" : "Choose and upload image"}</Text>
      </Pressable>
      <Pressable style={[styles.preference, { marginTop: 8 }]} onPress={() => setConsent((value) => !value)}>
        <Text style={styles.checkbox}>{consent ? "✓" : ""}</Text>
        <Text style={styles.cardTextDark}>I confirm this {kind === "salon" ? "image" : "image"} may be stored for salon use.</Text>
      </Pressable>
      {kind !== "salon" && currentImage ? (
        <View style={styles.cardLight}>
          <Text style={styles.cardTextDark}>{currentImages.length} image{currentImages.length === 1 ? "" : "s"} linked</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryAdminRow}>{currentImages.map((imageUrl: string, index: number) => <Image key={`${imageUrl}-${index}`} source={{ uri: imageUrl, ...(accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {}) }} style={styles.galleryAdminImage} />)}</ScrollView>
          <Pressable style={styles.secondary} disabled={busy} onPress={() => void remove()}>
            <Text style={styles.actionText}>Remove image</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function AdminBannerView({ initial }: { initial: any[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const chooseBannerImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ type: "warning", message: "Photo permission is required to choose a banner image." });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, base64: true, allowsEditing: true, aspect: [16, 9] });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUrl(asset.base64 ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}` : asset.uri);
      showToast({ type: "success", message: "Banner image selected." });
    }
  };
  async function create() {
    try {
      const saved = await api<any>("/banners", {
        method: "POST",
        body: JSON.stringify({
          title,
          message,
          imageUrl: imageUrl || undefined,
          actionLabel: "Book now",
          actionUrl: "/appointments",
          active: true,
        }),
      });
      setItems([...items, saved]);
      setTitle("");
      setMessage("");
      setImageUrl("");
      showToast({ type: "success", message: "Banner created." });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not create banner." });
    }
  }
  async function remove(id: string) {
    try {
      await api(`/banners/${id}`, { method: "DELETE" });
      setItems(items.filter((item) => item.id !== id));
      showToast({ type: "success", message: "Banner deleted." });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not delete banner." });
    }
  }
  async function toggle(item: any) {
    try {
      const updated = await api<any>(`/banners/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: item.active === false }),
      });
      setItems(items.map((current) => (current.id === item.id ? { ...current, ...updated } : current)));
      showToast({ type: "success", message: item.active === false ? "Banner published." : "Banner paused." });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not update banner." });
    }
  }
  return (
    <View>
      <SectionBanner icon="megaphone-outline" eyebrow="GUEST COMMUNICATION" title="Offers and banners" description="Create polished promotions that help guests choose their next visit." />
      <View style={styles.bannerEditorCard}>
        <View style={styles.bannerEditorHeader}><View><Text style={styles.formSectionLabel}>CREATE PROMOTION</Text><Text style={styles.bannerEditorTitle}>Build a salon banner</Text></View><View style={styles.bannerEditorIcon}><Ionicons name="megaphone-outline" size={20} color="#dfca73" /></View></View>
        <Text style={styles.bannerFieldLabel}>TITLE</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. New customer offer" style={styles.input} placeholderTextColor="#9aa19c" />
        <Text style={styles.bannerFieldLabel}>BANNER IMAGE</Text>
        <View style={styles.bannerImageCard}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.bannerImagePreview} resizeMode="cover" /> : <View style={styles.bannerImageEmpty}><Ionicons name="image-outline" size={25} color="#4c947d" /><Text style={styles.bannerEmptyTitle}>Add a landscape image</Text><Text style={styles.muted}>Recommended: 1200 × 600</Text></View>}
          <Pressable style={styles.imageUploadButton} onPress={() => void chooseBannerImage()}><Ionicons name="cloud-upload-outline" size={17} color="#fffdfa" /><Text style={styles.imageUploadText}>{imageUrl ? "Change image" : "Upload image"}</Text></Pressable>
        </View>
        <Text style={styles.bannerFieldLabel}>MESSAGE</Text>
        <TextInput value={message} onChangeText={setMessage} placeholder="e.g. Enjoy 15% off your first visit" style={[styles.input, styles.bannerMessageInput]} placeholderTextColor="#9aa19c" multiline />
        <Pressable style={styles.primary} onPress={() => void create()}><Text style={styles.primaryText}>Create banner</Text></Pressable>
      </View>
      {items.map((item) => (
        <View style={styles.bannerListCard} key={item.id}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.bannerListImage} resizeMode="cover" /> : <View style={styles.bannerListPlaceholder}><Text style={styles.bannerListPlaceholderText}>No image</Text></View>}
          <View style={styles.bannerListBody}><View style={styles.bannerListTitleRow}><Text style={styles.bannerListTitle} numberOfLines={1}>{item.title}</Text><View style={[styles.bannerStatus, item.active === false && styles.bannerStatusPaused]}><Text style={styles.bannerStatusText}>{item.active === false ? "Paused" : "Live"}</Text></View></View><Text style={styles.bannerListMessage} numberOfLines={2}>{item.message}</Text><View style={styles.bannerActions}><Pressable style={styles.bannerActionButton} onPress={() => void toggle(item)}><Text style={styles.bannerActionText}>{item.active === false ? "Publish" : "Pause"}</Text></Pressable><Pressable style={styles.bannerDeleteButton} onPress={() => void remove(item.id)}><Text style={styles.bannerDeleteText}>Delete</Text></Pressable></View></View>
        </View>
      ))}
    </View>
  );
}
function AdminAppointmentsView({ initial }: { initial: any[] }) {
  const [items, setItems] = useState(initial);
  const [sessionsByAppointment, setSessionsByAppointment] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const updateStatus = async (
    id: string,
    status: "Requested" | "Confirmed" | "Completed" | "Cancelled",
  ) => {
    try {
      await api(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(status === "Completed" ? { sessionsUsed: Number(sessionsByAppointment[id]) || 1 } : {}) }),
      });
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      setMessage(`Appointment ${status.toLowerCase()}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update appointment.");
    }
  };
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO WORKSPACE</Text>
      <Text style={styles.title}>Appointments</Text>
      <Text style={styles.muted}>Review requests and keep today’s queue moving.</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}><Text style={styles.metricValue}>{items.length}</Text><Text style={styles.metricLabel}>Total</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricValue}>{items.filter((item) => item.status === "Requested").length}</Text><Text style={styles.metricLabel}>Requests</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricValue}>{items.filter((item) => item.status === "Confirmed").length}</Text><Text style={styles.metricLabel}>Confirmed</Text></View>
        <View style={styles.metricCard}><Text style={styles.metricValue}>{items.filter((item) => item.status === "Completed").length}</Text><Text style={styles.metricLabel}>Completed</Text></View>
      </View>
      {items.length ? (
        items.map((item) => (
          <View style={styles.appointmentCard} key={item.id}>
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentIcon}><Ionicons name="calendar-outline" size={20} color="#c55239" /></View>
              <View style={styles.appointmentIdentity}>
                <Text style={styles.appointmentTitle}>{item.service || "Salon appointment"}</Text>
                <Text style={styles.muted}>{item.guestName || item.guestEmail || "Guest"}</Text>
              </View>
              <View style={[styles.statusBadge, item.status === "Confirmed" && styles.statusConfirmed, item.status === "Completed" && styles.statusConfirmed, item.status === "Cancelled" && styles.statusCancelled]}>
                <Text style={[styles.statusText, item.status === "Confirmed" && styles.statusTextConfirmed, item.status === "Completed" && styles.statusTextConfirmed, item.status === "Cancelled" && styles.statusTextCancelled]}>{item.status || "Requested"}</Text>
              </View>
            </View>
            <View style={styles.appointmentDetails}>
              <View style={styles.detailItem}><Ionicons name="calendar-clear-outline" size={15} color="#77817c" /><Text style={styles.detailText}>{item.date || "Date pending"}</Text></View>
              <View style={styles.detailItem}><Ionicons name="time-outline" size={15} color="#77817c" /><Text style={styles.detailText}>{item.time || "Time pending"}</Text></View>
            </View>
            <View style={styles.actionRow}>
              {item.status === "Requested" ? (
                <Pressable style={styles.actionButton} onPress={() => void updateStatus(item.id, "Confirmed")}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#26735a" />
                  <Text style={styles.actionText}>Confirm</Text>
                </Pressable>
              ) : null}
              {item.status === "Confirmed" ? (
                <View style={styles.actionRow}>
                  <TextInput value={sessionsByAppointment[item.id] || "1"} onChangeText={(value) => setSessionsByAppointment((current) => ({ ...current, [item.id]: value.replace(/[^0-9]/g, "") }))} placeholder="Sessions" keyboardType="numeric" style={[styles.input, styles.sessionInput]} />
                  <Pressable style={styles.actionButton} onPress={() => void updateStatus(item.id, "Completed")}>
                    <Ionicons name="checkmark-done-outline" size={16} color="#26735a" />
                    <Text style={styles.actionText}>Complete</Text>
                  </Pressable>
                </View>
              ) : null}
              {item.status !== "Cancelled" ? (
                <Pressable style={styles.actionButtonMuted} onPress={() => void updateStatus(item.id, "Cancelled")}>
                  <Ionicons name="close-circle-outline" size={16} color="#b34d38" />
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={24} color="#c55239" /></View>
          <Text style={styles.cardTextDark}>No appointments yet</Text>
          <Text style={styles.muted}>New booking requests will appear here for quick confirmation.</Text>
        </View>
      )}
      <MessageToast message={message} />
    </View>
  );
}
function AdminCustomersView({ initial }: { initial: any[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Record<string, any[]>>({});
  const [historyBusy, setHistoryBusy] = useState("");
  const filtered = items.filter((item) =>
    `${item.name || ""} ${item.email || ""} ${item.phone || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const toggle = async (item: any) => {
    const active = item.active === false;
    try {
      await api(`/auth/users/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, active } : currentItem,
        ),
      );
      const message = active ? "Customer activated." : "Customer deactivated.";
      setMessage(message);
      showToast({ type: "success", message });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not update customer.";
      setMessage(message);
      showToast({ type: "error", message });
    }
  };
  const showHistory = async (item: any) => {
    if (history[item.id]) {
      setHistory((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      return;
    }
    setHistoryBusy(item.id);
    try {
      const result = await api<any[]>(`/customers/${item.id}/history`);
      setHistory((current) => ({ ...current, [item.id]: Array.isArray(result) ? result : [] }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load customer history.";
      setMessage(message);
      showToast({ type: "error", message });
    } finally {
      setHistoryBusy("");
    }
  };
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO WORKSPACE</Text>
      <Text style={styles.title}>Customers</Text>
      <View style={styles.customerSummary}>
        <View style={styles.customerSummaryIcon}><Ionicons name="people-outline" size={23} color="#dfca73" /></View>
        <View style={styles.customerSummaryCopy}><Text style={styles.customerSummaryTitle}>{items.length} salon guests</Text><Text style={styles.customerSummaryText}>Keep every visit personal and easy to follow.</Text></View>
      </View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search customers by name, email, or phone"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      {filtered.length ? (
        filtered.map((item) => (
          <View style={styles.customerCard} key={item.id}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}><Text style={styles.customerAvatarText}>{(item.name || item.email || "G").slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.customerIdentity}><Text style={styles.customerName}>{item.name || "Guest customer"}</Text><Text style={styles.customerEmail}>{item.email || "Email not added"}</Text></View>
              <View style={[styles.customerStatus, item.active === false && styles.customerStatusInactive]}><Text style={[styles.customerStatusText, item.active === false && styles.customerStatusTextInactive]}>{item.active === false ? "Inactive" : "Active"}</Text></View>
            </View>
            <View style={styles.customerStats}>
              <View style={styles.customerStat}><Text style={styles.customerStatValue}>{item.appointmentCount || 0}</Text><Text style={styles.customerStatLabel}>Visits</Text></View>
              <View style={styles.customerStat}><Text style={styles.customerStatValue}>{item.lastAppointment?.date || "—"}</Text><Text style={styles.customerStatLabel}>Last visit</Text></View>
            </View>
            <View style={styles.actionRow}>
              <Pressable style={styles.actionButton} onPress={() => void toggle(item)}>
                <Ionicons name={item.active === false ? "checkmark-circle-outline" : "pause-circle-outline"} size={16} color="#26735a" />
                <Text style={styles.actionText}>{item.active === false ? "Activate" : "Deactivate"}</Text>
              </Pressable>
              <Pressable style={styles.actionButtonMuted} disabled={historyBusy === item.id} onPress={() => void showHistory(item)}>
                <Ionicons name="time-outline" size={16} color="#b34d38" />
                <Text style={styles.actionText}>{historyBusy === item.id ? "Loading..." : history[item.id] ? "Hide history" : "History"}</Text>
              </Pressable>
            </View>
            {history[item.id]?.length ? (
              <View style={styles.historyBox}>
                <Text style={styles.historyTitle}>Recent visits</Text>
                {history[item.id].map((visit: any) => (
                  <View key={visit.id} style={styles.historyRow}><Ionicons name="checkmark-circle-outline" size={15} color="#4c947d" /><Text style={styles.historyText}>{visit.date || "Undated"} · {visit.service || "Appointment"} · {visit.status || "Requested"}</Text></View>
                ))}
              </View>
            ) : history[item.id] ? (
              <Text style={styles.muted}>No appointment history.</Text>
            ) : null}
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No customers found.</Text>
      )}
      <MessageToast message={message} />
    </View>
  );
}
function AdminConsultationsView({ initial }: { initial: any[] }) {
  const [items, setItems] = useState(initial);
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [capturedViews, setCapturedViews] = useState<string[]>([]);
  const [quality, setQuality] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const create = async () => {
    if (guestName.trim().length < 2) {
      setMessage("Enter the guest name.");
      return;
    }
    try {
      const consultation = await api<any>("/consultations", {
        method: "POST",
        body: JSON.stringify({
          guestName: guestName.trim(),
          phone: phone.trim() || undefined,
          goal: goal.trim() || undefined,
        }),
      });
      setItems((current) => [consultation, ...current]);
      setSelected(consultation);
      setCapturedViews([]);
      setGuestName("");
      setPhone("");
      setGoal("");
      setMessage("Consultation created.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create consultation.");
    }
  };
  const choosePhoto = async (camera: boolean) => {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo permission is required for consultation analysis.");
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        });
    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setAsset(selectedAsset);
      try {
        setQuality(await api<any>("/ai/quality-check", {
          method: "POST",
          body: JSON.stringify({ view: "front", imageBase64: selectedAsset.base64 || undefined }),
        }));
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not check image quality.");
      }
    }
  };
  const captureView = async (view: "front" | "left" | "right") => {
    if (!selected?.id) {
      setMessage("Create a consultation first.");
      return;
    }
    try {
      await api(`/consultations/${selected.id}/capture`, {
        method: "POST",
        body: JSON.stringify({ view }),
      });
      setCapturedViews((current) => current.includes(view) ? current : [...current, view]);
      setMessage(`${view[0].toUpperCase() + view.slice(1)} view captured.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not capture this view.");
    }
  };
  const analyze = async () => {
    if (!selected?.id) {
      setMessage("Create or select a consultation first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const analyzed = await api<any>(`/consultations/${selected.id}/analyze`, {
        method: "POST",
        body: JSON.stringify({ imageBase64: asset?.base64 || undefined }),
      });
      setSelected(analyzed);
      setItems((current) =>
        current.map((item) => (item.id === analyzed.id ? analyzed : item)),
      );
      setMessage("Consultation analysis completed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not analyze consultation.");
    } finally {
      setBusy(false);
    }
  };
  const saveResult = async () => {
    if (!selected?.id || !selected.report) return;
    setBusy(true);
    try {
      const saved = await api<any>(`/consultations/${selected.id}/save`, {
        method: "POST",
        body: JSON.stringify({
          selectedStyle: selected.selectedStyle || selected.report.recommendations?.[0]?.name,
          selectedServices: selected.selectedServices || selected.report.services?.map((item: any) => item.name) || [],
          afterImage: selected.afterImage || undefined,
        }),
      });
      setSelected(saved);
      setMessage("Consultation result saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save consultation result.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <SectionBanner icon="chatbubbles-outline" eyebrow="GUEST EXPERIENCE" title="Consultations" description="Capture the guest goal before the service begins." />
      <View style={styles.consultationSummary}><View style={styles.consultationSummaryIcon}><Ionicons name="person-add-outline" size={22} color="#c55239" /></View><View style={styles.consultationSummaryCopy}><Text style={styles.consultationSummaryTitle}>Start with the guest</Text><Text style={styles.consultationSummaryText}>Capture a little context before taking photos.</Text></View></View>
      <View style={styles.formCard}>
        <Text style={styles.formCardTitle}>Guest details</Text>
        <TextInput value={guestName} onChangeText={setGuestName} placeholder="Enter guest name" style={styles.input} placeholderTextColor="#9aa19c" />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Enter guest mobile number" style={styles.input} keyboardType="phone-pad" placeholderTextColor="#9aa19c" />
        <TextInput value={goal} onChangeText={setGoal} placeholder="What would the guest like?" style={styles.input} placeholderTextColor="#9aa19c" />
      </View>
      <Pressable style={[styles.primary, styles.consultationStartButton]} onPress={() => void create()}>
        <Text style={styles.primaryText}>Start consultation</Text>
      </Pressable>
      {selected ? (
        <View style={styles.consultationCard}>
          <View style={styles.consultationCardHeader}><View style={styles.consultationAvatar}><Text style={styles.consultationAvatarText}>{(selected.guestName || "G").slice(0, 1).toUpperCase()}</Text></View><View style={styles.consultationCardCopy}><Text style={styles.consultationCardTitle}>{selected.guestName}</Text><Text style={styles.muted}>Consultation in progress</Text></View><View style={styles.progressPill}><Text style={styles.progressPillText}>{capturedViews.length}/3 views</Text></View></View>
          <Text style={styles.formSectionLabel}>CAPTURE ANGLES</Text>
          <Text style={styles.muted}>Capture front, left, and right before analysis.</Text>
          <View style={[styles.actionRow, styles.consultationChipRow]}>
            {(["front", "left", "right"] as const).map((view) => (
              <Pressable key={view} style={[styles.choice, capturedViews.includes(view) && styles.choiceActive]} onPress={() => void captureView(view)}>
                <Ionicons name={capturedViews.includes(view) ? "checkmark-circle" : "ellipse-outline"} size={15} color={capturedViews.includes(view) ? "#26735a" : "#77817c"} /><Text style={styles.choiceLabel}>{view}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.formSectionLabel}>PHOTO SOURCE</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton} onPress={() => void choosePhoto(true)}>
              <Ionicons name="camera-outline" size={16} color="#26735a" />
              <Text style={styles.actionText}>Take photo</Text>
            </Pressable>
            <Pressable style={styles.actionButtonMuted} onPress={() => void choosePhoto(false)}>
              <Ionicons name="images-outline" size={16} color="#b34d38" />
              <Text style={styles.actionText}>Choose photo</Text>
            </Pressable>
          </View>
          {asset?.uri ? <Image source={{ uri: asset.uri }} style={styles.consultationImage} /> : null}
          {quality ? <Text style={styles.muted}>{quality.passed ? `Image quality ready · ${quality.score || 0}/100` : `Retake recommended: ${(quality.retakeGuidance || []).join(" ")}`}</Text> : null}
          <Pressable style={[styles.primary, (busy || capturedViews.length < 3) && styles.disabled]} disabled={busy || capturedViews.length < 3} onPress={() => void analyze()}>
            <Text style={styles.primaryText}>{busy ? "Analyzing..." : capturedViews.length < 3 ? "Capture all views first" : "Analyze consultation"}</Text>
          </Pressable>
          {selected.report ? (
            <View>
              <Text style={styles.formSectionLabel}>RECOMMENDATIONS</Text>
              {(selected.report.recommendations || []).map((item: any) => (
                <Pressable
                  key={item.name}
                  style={[styles.recommendationCard, selected.selectedStyle === item.name && styles.choiceActive]}
                  onPress={() => setSelected((current: any) => ({ ...current, selectedStyle: item.name }))}
                >
                  <View style={styles.recommendationTop}><Text style={styles.cardTextDark}>{item.name}</Text><Text style={styles.scorePill}>{item.score || 0}% match</Text></View>
                  <Text style={styles.muted}>{item.description}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.secondary} onPress={() => void saveResult()}>
                <Text style={styles.actionText}>Save consultation result</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      {items.length ? (
        <View>
          <Text style={styles.formSectionTitle}>Recent consultations</Text>
          {items.map((item) => (
            <View style={styles.consultationHistoryCard} key={item.id}>
              <View style={styles.consultationHistoryHeader}>
                <View style={styles.consultationAvatar}><Text style={styles.consultationAvatarText}>{(item.guestName || "G").slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.consultationCardCopy}><Text style={styles.consultationCardTitle}>{item.guestName || "Guest"}</Text><Text style={styles.muted}>{item.goal || "Style consultation"}</Text></View>
                <View style={styles.progressPill}><Text style={styles.progressPillText}>{item.status || "Started"}</Text></View>
              </View>
              <View style={styles.consultationHistoryFooter}><Ionicons name="time-outline" size={14} color="#77817c" /><Text style={styles.historyText}>Consultation record</Text></View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={24} color="#c55239" /></View><Text style={styles.cardTextDark}>No consultations yet</Text><Text style={styles.muted}>Start one above when a guest is ready for a style conversation.</Text></View>
      )}
      <MessageToast message={message} />
    </View>
  );
}
function AdminReportsView({ initial }: { initial: any }) {
  const analytics = initial.analytics || {};
  const statusBreakdown = Array.isArray(analytics.statusBreakdown)
    ? analytics.statusBreakdown
    : [];
  const totalBookings = Number(analytics.totalBookings || 0);
  return (
    <View>
      <SectionBanner icon="bar-chart-outline" eyebrow="MANAGEMENT AREA" title="Reports and analytics" description="Track bookings, revenue, and salon performance in one place." />
      <View style={styles.reportHero}>
        <View style={styles.reportHeroTop}><Text style={styles.reportHeroEyebrow}>SALON PERFORMANCE</Text><Ionicons name="trending-up-outline" size={22} color="#dfca73" /></View>
        <Text style={styles.reportHeroValue}>₹{Number(analytics.revenue || 0).toLocaleString("en-IN")}</Text>
        <Text style={styles.reportHeroLabel}>Confirmed revenue</Text>
        <View style={styles.reportHeroFooter}><Text style={styles.reportHeroMeta}>{totalBookings} total booking{totalBookings === 1 ? "" : "s"}</Text><Text style={styles.reportHeroMeta}>{analytics.cancellationRate || 0}% cancelled</Text></View>
      </View>
      <View style={styles.reportMetricGrid}>
        <MetricCard label="Average visit value" value={`₹${Number(initial.averageVisitValue || 0).toLocaleString("en-IN")}`} />
        <MetricCard label="Consultations" value={initial.consultations || 0} />
      </View>
      <Text style={styles.subheading}>Booking flow</Text>
      {statusBreakdown.length ? (
        statusBreakdown.map((item: any) => (
          <View style={styles.reportStatusRow} key={item.status}>
            <View style={styles.reportStatusHeader}><View style={styles.reportStatusName}><View style={[styles.reportStatusDot, item.status === "Cancelled" ? styles.reportStatusDotRed : item.status === "Confirmed" ? styles.reportStatusDotGreen : styles.reportStatusDotGold]} /><Text style={styles.statusCardLabel}>{item.status}</Text></View><Text style={styles.statusCountText}>{item.count || 0}</Text></View>
            <View style={styles.reportTrack}><View style={[styles.reportProgress, item.status === "Cancelled" ? styles.reportProgressRed : item.status === "Confirmed" ? styles.reportProgressGreen : styles.reportProgressGold, { width: `${Math.max(totalBookings ? ((item.count || 0) / totalBookings) * 100 : 0, item.count ? 7 : 0)}%` }]} /></View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No booking activity yet.</Text>
      )}
    </View>
  );
}
function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}
function AdminApprovalView({ initial }: { initial: any[] }) {
  const [message, setMessage] = useState("");
  async function approve(id: string, approved: boolean) {
    try {
      await api(`/auth/admin-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      setMessage(approved ? "Admin approved." : "Admin rejected.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update approval.");
    }
  }
  async function toggleUser(id: string, active: boolean) {
    try {
      await api(`/auth/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      setMessage(active ? "Customer activated." : "Customer deactivated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update customer.");
    }
  }
  return (
    <View>
      <List
        title="Admin approvals and customer access"
        items={initial.map(
          (item) =>
            `${item.name || item.email} · ${item.adminApprovalStatus || (item.active === false ? "inactive" : "active")}`,
        )}
      />
      {initial.map((item) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 12,
            backgroundColor: "#fffdfa",
            borderWidth: 1,
            borderColor: "#d9d6ce",
            borderRadius: 8,
            marginTop: 8,
          }}
          key={item.id}
        >
          <Text style={styles.cardTextDark}>{item.email || item.name}</Text>
          {item.adminApprovalStatus ? (
            <>
              <Pressable onPress={() => void approve(item.id, true)}>
                <Text
                  style={{ color: "#c55239", fontWeight: "700", fontSize: 12 }}
                >
                  Approve
                </Text>
              </Pressable>
              <Pressable onPress={() => void approve(item.id, false)}>
                <Text
                  style={{ color: "#c55239", fontWeight: "700", fontSize: 12 }}
                >
                  Reject
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void toggleUser(item.id, item.active === false)}
            >
              <Text
                style={{ color: "#c55239", fontWeight: "700", fontSize: 12 }}
              >
                {item.active === false ? "Activate" : "Deactivate"}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function Editor({
  title,
  fields,
  save,
  message,
}: {
  title: string;
  fields: [string, (value: string) => void, string][];
  save: () => void;
  message: string;
}) {
  return (
    <View>
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>{title}</Text>
      {fields.map(([value, setter, placeholder]) => (
        <TextInput
          key={placeholder}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#9aa19c"
        />
      ))}
      <Pressable style={styles.primary} onPress={save}>
        <Text style={styles.primaryText}>Save changes</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function SalonInfoView({ salon }: { salon: any }) {
  const prices = Array.isArray(salon?.serviceDetails)
    ? salon.serviceDetails
    : [];
  const products = Array.isArray(salon?.products) ? salon.products : [];
  return (
    <View>
      <Text style={styles.eyebrow}>YOUR SALON</Text>
      <Text style={styles.title}>Services & products</Text>
      {salon?.name ? (
        <Text style={styles.muted}>
          {salon.name}
          {salon.location ? ` · ${salon.location}` : ""}
        </Text>
      ) : null}
      <Text style={styles.subheading}>Services and prices</Text>
      {prices.length ? (
        prices.map((item: any, index: number) => (
          <View style={styles.infoRow} key={`${item.name}-${index}`}>
            <View style={styles.infoRowCopy}>
              <Text style={styles.cardTextDark}>{item.name}</Text>
              <Text style={styles.muted}>
                {item.durationMinutes || 60} minutes
              </Text>
            </View>
            <Text style={styles.priceText}>₹{item.price}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Service pricing is not available yet.</Text>
      )}
      <Text style={styles.subheading}>Products used</Text>
      {products.length ? (
        products.map((item: any, index: number) => (
          <View style={styles.infoRow} key={`${item.id || item.name}-${index}`}>
            <View style={styles.infoRowCopy}>
              <Text style={styles.cardTextDark}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.muted}>{item.description}</Text>
              ) : null}
            </View>
            <Ionicons name="bag-handle-outline" size={18} color="#91b3a3" />
          </View>
        ))
      ) : (
        <Text style={styles.muted}>
          Product information is not available yet.
        </Text>
      )}
    </View>
  );
}
function PreferencesView({ initial, role }: { initial: any; role: "user" | "admin" }) {
  const [email, setEmail] = useState(initial.email !== false);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp !== false);
  const [appointmentReminders, setAppointmentReminders] = useState(
    initial.appointmentReminders !== false,
  );
  const [push, setPush] = useState(initial.push !== false);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    api<any[]>("/notifications/user")
      .then((result) => setHistory(Array.isArray(result) ? result : []))
      .catch(() => setHistory([]));
  }, []);
  async function markNotificationRead(id: string) {
    await api(`/notifications/user/${id}/read`, { method: "PATCH" }).catch(() => undefined);
    setHistory((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
  }
  async function save() {
    try {
      await api("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ email, whatsapp, appointmentReminders, push }),
      });
      if (push) {
        await registerForPushNotifications();
      } else {
        await api("/notifications/mobile/unregister", { method: "POST" });
      }
      setMessage("Preferences saved.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not save preferences.",
      );
    }
  }
  async function sendManualWhatsApp() {
    if (!recipientPhone.trim() || !manualMessage.trim()) {
      setMessage("Enter a recipient phone number and message.");
      return;
    }
    setSending(true);
    try {
      await api("/notifications/whatsapp/send", {
        method: "POST",
        body: JSON.stringify({ recipientPhone: recipientPhone.trim(), message: manualMessage.trim() }),
      });
      setMessage("WhatsApp message sent.");
      setManualMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not send WhatsApp message.");
    } finally {
      setSending(false);
    }
  }
  return (
    <View>
      <SectionBanner icon="notifications-outline" eyebrow="NOTIFICATIONS" title="Stay in the loop" description="Choose the updates that matter to you." />
      <View style={styles.notificationPreferencesCard}><Text style={styles.notificationCardTitle}>Your notification choices</Text><Text style={styles.preferenceHint}>Turn updates on or off anytime.</Text><Pressable style={styles.preference} onPress={() => setEmail(!email)}>
        <Text style={styles.checkbox}>{email ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>Email reminders</Text>
          <Text style={styles.preferenceHint}>Offers and salon news</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.preference}
        onPress={() => setAppointmentReminders(!appointmentReminders)}
      >
        <Text style={styles.checkbox}>{appointmentReminders ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>Appointment reminders</Text>
          <Text style={styles.preferenceHint}>Reminders for upcoming visits</Text>
        </View>
      </Pressable>
      <Pressable style={styles.preference} onPress={() => setWhatsapp(!whatsapp)}>
        <Text style={styles.checkbox}>{whatsapp ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>WhatsApp updates</Text>
          <Text style={styles.preferenceHint}>Booking and salon messages</Text>
        </View>
      </Pressable>
      <Pressable style={styles.preference} onPress={() => setPush(!push)}>
        <Text style={styles.checkbox}>{push ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>Push notifications</Text>
          <Text style={styles.preferenceHint}>Alerts on this device</Text>
        </View>
      </Pressable>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save preferences</Text>
      </Pressable>
      </View>
      <MessageToast message={message} />
      {role === "admin" ? (
        <View style={styles.manualNotificationCard}>
          <Text style={styles.notificationCardEyebrow}>DIRECT MESSAGE</Text><Text style={styles.notificationCardTitleDark}>Send WhatsApp message</Text>
          <Text style={styles.manualHint}></Text>
          <TextInput
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            placeholder="Customer WhatsApp number"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <TextInput
            value={manualMessage}
            onChangeText={setManualMessage}
            placeholder="Write a reminder, product update, or salon message"
            multiline
            maxLength={4096}
            style={[styles.input, styles.multilineInput]}
          />
          <Pressable style={styles.primary} onPress={() => void sendManualWhatsApp()} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send on WhatsApp</Text>}
          </Pressable>
        </View>
      ) : null}
      <View style={styles.notificationActivityHeader}><View><Text style={styles.notificationCardEyebrow}>ACTIVITY</Text><Text style={styles.notificationActivityTitle}>Recent activity</Text></View><Text style={styles.notificationActivityHint}>{history.length ? `${history.length} update${history.length === 1 ? "" : "s"}` : "All clear"}</Text></View>
      {history.length ? (
        history.map((item: any, index: number) => (
          <Pressable
            style={[styles.notificationHistoryCard, !item.isRead && styles.notificationUnreadCard]}
            key={`${item.id || item.createdAt || index}`}
            onPress={() => item.id && void markNotificationRead(item.id)}
          >
            <View style={styles.infoRowCopy}>
              <Text style={styles.notificationHistoryTitle} numberOfLines={1}>
                {item.title || item.notificationType || item.type || "Notification"}
              </Text>
              <Text style={styles.notificationHistoryMessage} numberOfLines={2}>
                {item.message || item.status || "Sent"}
              </Text>
            </View>
            <View style={[styles.notificationStatusDot, item.isRead && styles.notificationReadDot]} />
          </Pressable>
        ))
      ) : (
        <Text style={styles.muted}>No notifications yet.</Text>
      )}
    </View>
  );
}
function BookingView({ salons }: { salons: any[] }) {
  const salon = salons[0];
  const serviceDetails = salon?.serviceDetails || [];
  const categories = Array.from(new Set((serviceDetails.length ? serviceDetails.map((item: any) => item.category || "General") : ["General"]).filter(Boolean)));
  const stylists = salon?.stylists || [];
  const [serviceCategory, setServiceCategory] = useState(categories[0] || "General");
  const services = serviceDetails.length ? serviceDetails.filter((item: any) => (item.category || "General") === serviceCategory).map((item: any) => item.name) : (salon?.services || []);
  const [service, setService] = useState(services[0] || "Haircut");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [stylist, setStylist] = useState(stylists[0] || "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [stylistOpen, setStylistOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!salon || !date || !service) {
      setMessage("Choose a salon, service, and date.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          salonId: salon.id,
          service,
          date,
          time,
          stylist,
          notes,
        }),
      });
      setDate("");
      setTime("");
      setNotes("");
      setMessage("Appointment request sent to the salon.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not create appointment.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View>
      <SectionBanner icon="calendar-outline" eyebrow="YOUR NEXT VISIT" title="Book a visit" description="Choose a service, stylist, and time that works for you." />
      {!salon ? (
        <Text style={styles.muted}>No salons are open for booking.</Text>
      ) : (
        <>
          <Text style={styles.muted}>
            {salon.name} · {salon.location}
          </Text>
          <Text style={styles.label}>Service category</Text>
          <Pressable style={styles.dropdown} onPress={() => { setCategoryOpen((open) => !open); setServiceOpen(false); setStylistOpen(false); }}>
            <Text style={styles.cardTextDark}>{serviceCategory || "Select a category"}</Text>
            <Ionicons name={categoryOpen ? "chevron-up" : "chevron-down"} size={18} color="#c55239" />
          </Pressable>
          {categoryOpen ? <View style={styles.dropdownMenu}>{categories.map((item: string) => <Pressable key={item} style={styles.dropdownOption} onPress={() => { const next = serviceDetails.filter((detail: any) => (detail.category || "General") === item).map((detail: any) => detail.name); setServiceCategory(item); setService(next[0] || salon.services?.[0] || ""); setCategoryOpen(false); }}><Text style={styles.cardTextDark}>{item}</Text></Pressable>)}</View> : null}
          <Text style={styles.label}>Service</Text>
          <Pressable style={styles.dropdown} onPress={() => { setServiceOpen((open) => !open); setCategoryOpen(false); setStylistOpen(false); }}>
            <Text style={styles.cardTextDark}>{service || "Select a service"}</Text>
            <Ionicons name={serviceOpen ? "chevron-up" : "chevron-down"} size={18} color="#c55239" />
          </Pressable>
          {serviceOpen ? <View style={styles.dropdownMenu}>{services.map((item: string) => <Pressable key={item} style={styles.dropdownOption} onPress={() => { setService(item); setServiceOpen(false); }}><Text style={styles.cardTextDark}>{item}</Text></Pressable>)}</View> : null}
          <Text style={styles.label}>Preferred stylist</Text>
          <Pressable style={styles.dropdown} onPress={() => { setStylistOpen((open) => !open); setServiceOpen(false); setCategoryOpen(false); }}>
            <Text style={styles.cardTextDark}>{stylist || "Select a stylist"}</Text>
            <Ionicons name={stylistOpen ? "chevron-up" : "chevron-down"} size={18} color="#c55239" />
          </Pressable>
          {stylistOpen ? <View style={styles.dropdownMenu}>{stylists.map((item: string) => <Pressable key={item} style={styles.dropdownOption} onPress={() => { setStylist(item); setStylistOpen(false); }}><Text style={styles.cardTextDark}>{item}</Text></Pressable>)}</View> : null}
          <Text style={styles.label}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="Enter appointment date (YYYY-MM-DD)"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <Text style={styles.label}>Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="Enter appointment time"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Tell us about the guest's hair goals"
            style={[styles.input, styles.multiline]}
            multiline
            placeholderTextColor="#9aa19c"
          />
          <Pressable
            style={styles.primary}
            onPress={() => void submit()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Request appointment</Text>
            )}
          </Pressable>
          <MessageToast message={message} />
        </>
      )}
    </View>
  );
}
function PaymentView({ payments }: { payments: Payment[] }) {
  const [appointmentId, setAppointmentId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");
  const safePayments = Array.isArray(payments) ? payments : [];
  async function createIntent() {
    if (!appointmentId.trim())
      return setMessage("Enter the appointment ID you want to pay for.");
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
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not start payment.");
    }
  }
  return (
    <View>
      <SectionBanner icon="card-outline" eyebrow="FINANCE" title="Payments and invoices" description="Keep payment requests and guest invoices in one place." />
      <TextInput
        value={appointmentId}
        onChangeText={setAppointmentId}
        placeholder="Enter appointment ID"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <TextInput
        value={couponCode}
        onChangeText={setCouponCode}
        autoCapitalize="characters"
        placeholder="Enter a coupon code (optional)"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void createIntent()}>
        <Text style={styles.primaryText}>Start payment</Text>
      </Pressable>
      <MessageToast message={message} />
      <List
        title="Payment history"
        items={safePayments.map(
          (item) =>
            `${item.description || item.appointmentId || "Salon payment"} · ₹${item.amount || item.total || 0} · ${item.status || "Pending"}`,
        )}
      />
    </View>
  );
}
function AdminReviewsView({ initial }: { initial: any[] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initial);
  const update = async (id: string, status: "Published" | "Rejected") => {
    try {
      const saved = await api<any>(`/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...saved } : item));
      showToast({ type: "success", message: `Review ${status.toLowerCase()}.` });
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not update review." });
    }
  };
  return (
    <View>
      <SectionBanner icon="heart-outline" eyebrow="GUEST FEEDBACK" title="Share feedback" description="Review guest experiences and keep your salon reputation trusted." />
      <View style={styles.feedbackSummary}>
        <View style={styles.feedbackSummaryIcon}><Ionicons name="star" size={22} color="#dfca73" /></View>
        <View style={styles.feedbackSummaryCopy}><Text style={styles.feedbackSummaryTitle}>{items.length} guest {items.length === 1 ? "review" : "reviews"}</Text><Text style={styles.feedbackSummaryText}>Approve thoughtful feedback before it appears publicly.</Text></View>
        <View style={styles.feedbackCount}><Text style={styles.feedbackCountValue}>{items.filter((item) => item.status === "Pending").length}</Text><Text style={styles.feedbackCountLabel}>pending</Text></View>
      </View>
      {items.length ? items.map((item) => (
        <View style={styles.feedbackCard} key={item.id}>
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackAvatar}><Text style={styles.feedbackAvatarText}>{String(item.guestName || "G").trim().charAt(0).toUpperCase()}</Text></View>
            <View style={styles.feedbackIdentity}><Text style={styles.feedbackName}>{item.guestName || "Guest"}</Text><Text style={styles.feedbackMeta}>Guest experience</Text></View>
            <View style={[styles.feedbackStatus, item.status === "Published" && styles.feedbackStatusPublished, item.status === "Rejected" && styles.feedbackStatusRejected]}><Text style={[styles.feedbackStatusText, item.status === "Published" && styles.feedbackStatusTextPublished, item.status === "Rejected" && styles.feedbackStatusTextRejected]}>{item.status === "Pending" ? "Pending" : item.status}</Text></View>
          </View>
          <View style={styles.feedbackRating}><Text style={styles.feedbackStars}>{"★".repeat(Number(item.rating || 0))}</Text><Text style={styles.feedbackRatingText}>{Number(item.rating || 0)} / 5</Text></View>
          <Text style={styles.feedbackComment}>{item.comment || "No written comment provided."}</Text>
          {item.status === "Pending" ? (
            <View style={styles.feedbackActions}>
              <Pressable style={styles.feedbackPublishButton} onPress={() => void update(item.id, "Published")}><Ionicons name="checkmark-circle-outline" size={17} color="#26735a" /><Text style={styles.feedbackPublishText}>Publish review</Text></Pressable>
              <Pressable style={styles.feedbackRejectButton} onPress={() => void update(item.id, "Rejected")}><Ionicons name="close-circle-outline" size={17} color="#b34d38" /><Text style={styles.feedbackRejectText}>Reject</Text></Pressable>
            </View>
          ) : null}
        </View>
      )) : <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="heart-outline" size={24} color="#c55239" /></View><Text style={styles.cardTextDark}>No reviews yet</Text><Text style={styles.muted}>Guest feedback will appear here after salon visits.</Text></View>}
    </View>
  );
}
function ReviewView() {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  useEffect(() => {
    api<any[]>("/appointments")
      .then((items) => setAppointments(Array.isArray(items) ? items : []))
      .catch(() => setAppointments([]));
  }, []);
  const completedAppointments = appointments.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    if (status === "cancelled" || status === "rejected") return false;
    return status === "completed" || (typeof item.date === "string" && item.date < new Date().toISOString().slice(0, 10));
  });
  async function submit() {
    if (!appointmentId) {
      showToast({ type: "warning", message: "Choose a completed visit to rate." });
      return;
    }
    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ rating, comment, appointmentId }),
      });
      showToast({ type: "success", message: "Review submitted for salon approval." });
      setComment("");
      setAppointmentId("");
    } catch (e) {
      showToast({ type: "error", message: e instanceof Error ? e.message : "Could not submit review." });
    }
  }
  return (
    <View>
      <SectionBanner icon="star-outline" eyebrow="GUEST FEEDBACK" title="Share your experience" description="A few stars help your salon keep improving." />
      <View style={styles.reviewFormCard}>
      <View style={styles.reviewRatingHeader}>
        <View><Text style={styles.reviewSectionLabel}>YOUR RATING</Text><Text style={styles.reviewPrompt}>How was your visit?</Text></View>
        <View style={styles.ratingPill}><Text style={styles.ratingPillText}>{rating}/5</Text></View>
      </View>
      <View style={styles.starPicker}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} style={[styles.starButton, value <= rating && styles.starButtonSelected]} onPress={() => setRating(value)} accessibilityLabel={`${value} stars`}>
            <Text style={[styles.star, value <= rating && styles.starSelected]}>★</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.reviewDivider} />
      <View style={styles.reviewVisitHeader}><View><Text style={styles.reviewSectionLabel}>CHOOSE A VISIT</Text><Text style={styles.reviewPrompt}>Which visit would you like to review?</Text></View><Ionicons name="calendar-outline" size={20} color="#4c947d" /></View>
      {completedAppointments.length ? (
        <View style={styles.reviewChoiceList}>
          {completedAppointments.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.reviewChoice, appointmentId === item.id && styles.reviewChoiceActive]}
              onPress={() => setAppointmentId(item.id)}
            >
              <View style={styles.reviewChoiceIcon}><Ionicons name="checkmark-circle-outline" size={19} color={appointmentId === item.id ? "#26735a" : "#4c947d"} /></View>
              <View style={styles.reviewChoiceCopy}><Text style={styles.cardTextDark}>{item.service || "Salon visit"}</Text><Text style={styles.muted}>{item.date} · Visit completed</Text></View>
              {appointmentId === item.id ? <Ionicons name="checkmark-circle" size={20} color="#26735a" /> : <Ionicons name="chevron-forward" size={17} color="#a7afa9" />}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.reviewEmpty}><Ionicons name="sparkles-outline" size={20} color="#4c947d" /><Text style={styles.reviewEmptyText}>Complete a salon visit before sharing a rating.</Text></View>
      )}
      <Text style={styles.reviewSectionLabel}>YOUR FEEDBACK</Text>
      <TextInput value={comment} onChangeText={setComment} placeholder="Tell us about your visit" style={[styles.input, styles.reviewComment]} multiline placeholderTextColor="#9aa19c" />
      <Pressable disabled={!completedAppointments.length || !appointmentId} style={[styles.primary, styles.reviewSubmit, (!completedAppointments.length || !appointmentId) && styles.primaryDisabled]} onPress={() => void submit()}>
        <Text style={styles.primaryText}>Submit review</Text>
      </Pressable>
      </View>
    </View>
  );
}
function LastVisitView({ history }: { history: any[] }) {
  const lastVisit = history[0];
  return (
    <View>
      <SectionBanner icon="time-outline" eyebrow="YOUR HALO HISTORY" title="Last visit" description="A quick, friendly reminder of your latest salon experience." />
      {lastVisit ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{lastVisit.service || "Salon appointment"}</Text>
          <Text style={styles.cardText}>{lastVisit.date || "Date unavailable"} · {lastVisit.time || "Time unavailable"}</Text>
          <Text style={styles.cardText}>Stylist: {lastVisit.stylist || "To be confirmed"}</Text>
          <Text style={styles.cardText}>Status: {lastVisit.status || "Recorded"}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No visits yet</Text>
          <Text style={styles.muted}>Your latest appointment will appear here after you book a salon.</Text>
        </View>
      )}
    </View>
  );
}
function MembershipView({ initial }: { initial: any[] }) {
  return (
    <View>
      <SectionBanner icon="ribbon-outline" eyebrow="YOUR MEMBERSHIP" title="Your memberships" description="Track balances, sessions, and the services included in your plan." />
      {initial.length ? initial.map((item) => (
        <View style={styles.membershipCard} key={item.id}>
          <View style={styles.membershipTopline}>
            <Text style={styles.membershipTitle}>{item.plan?.name || "Salon membership"}</Text>
            <Text style={styles.membershipStatus}>{item.status}</Text>
          </View>
          <Text style={styles.membershipBalance}>{item.remainingSessions} sessions remaining</Text>
          <Text style={styles.cardTextDark}>Used {Math.max(0, item.totalSessions - item.remainingSessions)} of {item.totalSessions} sessions</Text>
          <Text style={styles.muted}>Amount paid: ₹{Number(item.amountPaid || 0).toLocaleString("en-IN")}</Text>
          <Text style={styles.muted}>Valid until {item.expiresAt}</Text>
          {item.plan?.eligibleServices?.length ? <Text style={styles.muted}>Services: {item.plan.eligibleServices.join(", ")}</Text> : null}
          {item.usage?.length ? <Text style={styles.muted}>Last used: {item.usage[0].service} · ₹{item.usage[0].serviceCost || 0}</Text> : null}
        </View>
      )) : (
        <View style={styles.cardLight}>
          <Text style={styles.cardTextDark}>No active membership</Text>
          <Text style={styles.muted}>Your salon administrator will add your membership after payment.</Text>
        </View>
      )}
    </View>
  );
}
function MembershipAdminView({ initial }: { initial: any[] }) {
  const [members, setMembers] = useState(initial);
  const [plans, setPlans] = useState<any[]>([]);
  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("5");
  const [eligibleServices, setEligibleServices] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSessions, setEditSessions] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<any[]>("/memberships/plans")
      .then((items) => {
        const available = Array.isArray(items) ? items : [];
        setPlans(available);
        setSelectedPlan(available[0]?.id || "");
      })
      .catch(() => setPlans([]));
  }, []);
  const createPlan = async () => {
    if (!planName.trim()) return setMessage("Enter a membership plan name.");
    try {
      await api("/memberships/plans", { method: "POST", body: JSON.stringify({ name: planName, price: Number(price) || 0, sessionCount: Number(sessions) || 1, eligibleServices: eligibleServices.split(",").map((item) => item.trim()).filter(Boolean) }) });
      const available = await api<any[]>("/memberships/plans");
      setPlans(Array.isArray(available) ? available : []);
      setSelectedPlan(available?.[0]?.id || "");
      setPlanName(""); setPrice(""); setEligibleServices(""); setMessage("Membership plan created.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not create membership plan."); }
  };
  const assignMembership = async () => {
    if (!memberEmail.trim() || !selectedPlan) {
      setMessage("Enter the user email and choose a plan.");
      return;
    }
    try {
      const member = await api<any>("/memberships", {
        method: "POST",
        body: JSON.stringify({ planId: selectedPlan, guestEmail: memberEmail.trim(), amountPaid: Number(amountPaid) || undefined }),
      });
      setMembers((current) => [member, ...current.filter((item) => item.id !== member.id)]);
      setMemberEmail("");
      setAmountPaid("");
      setMessage("Membership assigned. The user can see it now.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not assign membership."); }
  };
  const saveMembership = async (id: string, values: { status?: "active" | "cancelled" }) => {
    try {
      const updated = await api<any>(`/memberships/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          ...(editAmount.trim() ? { amountPaid: Number(editAmount) } : {}),
          ...(editSessions.trim() ? { remainingSessions: Number(editSessions) } : {}),
        }),
      });
      setMembers((current) => current.map((item) => item.id === id ? updated : item));
      setEditingId(""); setMessage(values.status === "cancelled" ? "Membership cancelled." : "Membership updated.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not update membership."); }
  };
  return (
    <View>
      <SectionBanner icon="ribbon-outline" eyebrow="STUDIO MEMBERSHIPS" title="Memberships" description="Create plans, assign members, and keep session balances current." />
      <Text style={styles.subheading}>Create a plan</Text>
      <TextInput value={planName} onChangeText={setPlanName} placeholder="Enter membership plan name" placeholderTextColor="#77817c" style={styles.input} />
      <View style={styles.twoInputs}>
        <TextInput value={price} onChangeText={setPrice} placeholder="Enter price" placeholderTextColor="#77817c" keyboardType="numeric" style={[styles.input, styles.halfInput]} />
        <TextInput value={sessions} onChangeText={setSessions} placeholder="Enter session count" placeholderTextColor="#77817c" keyboardType="numeric" style={[styles.input, styles.halfInput]} />
      </View>
      <TextInput value={eligibleServices} onChangeText={setEligibleServices} placeholder="Eligible services, comma separated (optional)" placeholderTextColor="#77817c" style={styles.input} />
      <Pressable style={styles.primary} onPress={() => void createPlan()}><Text style={styles.primaryText}>Create membership plan</Text></Pressable>
      <MessageToast message={message} />
      <Text style={styles.subheading}>Add membership after payment</Text>
      <Text style={styles.muted}>Use the email from the user account. The membership will appear in that user’s More screen.</Text>
      <TextInput value={memberEmail} onChangeText={setMemberEmail} placeholder="Enter member email address" placeholderTextColor="#77817c" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <TextInput value={amountPaid} onChangeText={setAmountPaid} placeholder="Amount paid (₹)" placeholderTextColor="#77817c" keyboardType="numeric" style={styles.input} />
      <View style={styles.choiceRow}>
        {plans.map((plan) => (
          <Pressable key={plan.id} style={[styles.choice, selectedPlan === plan.id && styles.choiceActive]} onPress={() => setSelectedPlan(plan.id)}>
            <Text style={styles.cardTextDark}>{plan.name}</Text>
            <Text style={styles.muted}>₹{plan.price} · {plan.sessionCount} sessions</Text>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={!plans.length} style={[styles.primary, !plans.length && styles.disabled]} onPress={() => void assignMembership()}><Text style={styles.primaryText}>Add membership to user</Text></Pressable>
      <Text style={styles.subheading}>Member balances</Text>
      {members.length ? members.map((item) => (
        <View style={styles.infoRow} key={item.id}>
          <View style={styles.infoRowCopy}>
            <Text style={styles.cardTextDark}>{item.guestEmail}</Text>
            <Text style={styles.muted}>{item.plan?.name || "Membership"} · {item.remainingSessions}/{item.totalSessions} sessions · ₹{Number(item.amountPaid || 0).toLocaleString("en-IN")}</Text>
          </View>
          <Text style={styles.priceText}>{item.status}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton} onPress={() => { setEditingId(item.id); setEditAmount(String(item.amountPaid || "")); setEditSessions(String(item.remainingSessions || "")); }}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
            {item.status !== "cancelled" ? <Pressable style={styles.actionButtonMuted} onPress={() => void saveMembership(item.id, { status: "cancelled" })}>
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable> : null}
          </View>
          {editingId === item.id ? <View style={styles.twoInputs}>
            <TextInput value={editAmount} onChangeText={setEditAmount} placeholder="Amount paid" placeholderTextColor="#77817c" keyboardType="numeric" style={[styles.input, styles.halfInput]} />
            <TextInput value={editSessions} onChangeText={setEditSessions} placeholder="Sessions left" placeholderTextColor="#77817c" keyboardType="numeric" style={[styles.input, styles.halfInput]} />
            <Pressable style={styles.primary} onPress={() => void saveMembership(item.id, {})}><Text style={styles.primaryText}>Save changes</Text></Pressable>
          </View> : null}
        </View>
      )) : <Text style={styles.muted}>No members added yet.</Text>}
    </View>
  );
}
function ProfileView({ profile, email }: { profile: Profile; email: string }) {
  return (
    <View>
      <SectionBanner icon="person-outline" eyebrow="YOUR HALO ACCOUNT" title="Profile details" description="Keep your personal details ready for a smoother salon visit." />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile details</Text>
        <Text style={styles.cardText}>
          Phone: {profile.phone || "Not added"}
        </Text>
        <Text style={styles.cardText}>
          Location: {profile.location || "Not added"}
        </Text>
        <Text style={styles.cardText}>
          Hair texture: {profile.texture || "Not added"}
        </Text>
        <Text style={styles.cardText}>
          Preferred stylist: {profile.preferredStylist || "Not added"}
        </Text>
      </View>
    </View>
  );
}
function PassportView({ passport }: { passport: Passport }) {
  const [guestName, setGuestName] = useState(passport.guestName || "");
  const [texture, setTexture] = useState(passport.texture || "");
  const [length, setLength] = useState(passport.length || "");
  const [preferredStylist, setPreferredStylist] = useState(
    passport.preferredStylist || "",
  );
  const [notes, setNotes] = useState(passport.notes || "");
  const [message, setMessage] = useState("");
  const save = async () => {
    try {
      await api("/passport", {
        method: "PUT",
        body: JSON.stringify({
          guestName,
          texture,
          length,
          preferredStylist,
          notes,
        }),
      });
      setMessage("Hair passport saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save passport.");
    }
  };
  return (
    <View>
      <SectionBanner icon="sparkles-outline" eyebrow="YOUR HAIR PASSPORT" title="Your hair passport" description="Save the details that help your stylist understand your look." />
      {[
        [guestName, setGuestName, "Guest name"],
        [texture, setTexture, "Hair texture"],
        [length, setLength, "Hair length"],
        [preferredStylist, setPreferredStylist, "Preferred stylist"],
      ].map(([value, setter, placeholder]: any) => (
        <TextInput
          key={placeholder}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#9aa19c"
        />
      ))}
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes for the stylist"
        multiline
        style={[styles.input, styles.multiline]}
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save hair passport</Text>
      </Pressable>
      <MessageToast message={message} />
    </View>
  );
}
function List({ title, items }: { title: string; items: string[] }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {items.length ? (
        items.map((item, index) => (
          <View style={styles.row} key={`${item}-${index}`}>
            <Text style={styles.cardText}>{item}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Nothing here yet.</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  screenContent: { paddingBottom: 28 },
  headerScroll: { maxHeight: 430 },
  headerContent: { padding: 18, paddingBottom: 8 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  topEyebrow: {
    color: "#91b3a3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  topTitle: { color: "#20352d", fontSize: 32, fontWeight: "800", marginTop: 2 },
  topAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#20352d",
    alignItems: "center",
    justifyContent: "center",
  },
  topAvatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20352d",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#c55239",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: "#a9c9ba",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 2 },
  heroSubtitle: { color: "#c8d2cb", fontSize: 13, marginTop: 2 },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dceee8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#20352d", fontSize: 17, fontWeight: "800" },
  identityCopy: { flex: 1 },
  identityTitle: { color: "#20352d", fontWeight: "800", fontSize: 14 },
  identityEmail: { color: "#77817c", fontSize: 12, marginTop: 3 },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#20352d",
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },
  focusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(223,202,115,0.16)",
    borderWidth: 1,
    borderColor: "rgba(223,202,115,0.36)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  focusCopy: { flex: 1, minWidth: 0 },
  focusEyebrow: { color: "#a9c9ba", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  focusTitle: { color: "#fffdfa", fontSize: 20, fontWeight: "800", marginTop: 3 },
  focusDescription: { color: "#c8d2cb", fontSize: 11, marginTop: 3 },
  quickNav: { paddingBottom: 8, paddingRight: 16 },
  quickNavChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    backgroundColor: "#fffdfa",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickNavChipActive: { backgroundColor: "#c55239", borderColor: "#c55239" },
  quickNavText: { color: "#20352d", fontSize: 11, fontWeight: "800", marginLeft: 5 },
  quickNavTextActive: { color: "#fffdfa" },
  groupTitle: {
    color: "#77817c",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 9,
    marginLeft: 3,
  },
  settingsGroup: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  settingRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeae3",
  },
  settingRowActive: {
    backgroundColor: "#c55239",
    borderBottomColor: "#c55239",
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#f8e5df",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  settingIconActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  settingCopy: { flex: 1, paddingRight: 8 },
  settingTitle: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  settingTitleActive: { color: "#fff" },
  settingDescription: { color: "#77817c", fontSize: 12, marginTop: 4 },
  settingDescriptionActive: { color: "#fbe9e4" },
  content: { padding: 22, paddingTop: 6, paddingBottom: 40 },
  subheading: {
    color: "#20352d",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  infoRowCopy: { flex: 1 },
  priceText: { color: "#c55239", fontSize: 15, fontWeight: "800" },
  membershipCard: { backgroundColor: "#20352d", borderRadius: 14, padding: 18, marginTop: 12 },
  membershipTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  membershipTitle: { color: "#fffdfa", fontSize: 18, fontWeight: "800" },
  membershipStatus: { color: "#dfca73", fontWeight: "800", textTransform: "capitalize" },
  membershipBalance: { color: "#fffdfa", fontSize: 22, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  mediaChipRow: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingRight: 8 },
  actionButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e5f1eb", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, marginRight: 8 },
  actionButtonMuted: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8e5df", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, marginRight: 8 },
  appointmentCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginTop: 12, shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  appointmentHeader: { flexDirection: "row", alignItems: "center" },
  appointmentIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginRight: 11 },
  appointmentIdentity: { flex: 1, minWidth: 0 },
  appointmentTitle: { color: "#20352d", fontSize: 15, fontWeight: "800" },
  statusBadge: { backgroundColor: "#fff0d8", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 8 },
  statusConfirmed: { backgroundColor: "#e5f1eb" },
  statusCancelled: { backgroundColor: "#f8e5df" },
  statusText: { color: "#93631d", fontSize: 10, fontWeight: "800" },
  statusTextConfirmed: { color: "#26735a" },
  statusTextCancelled: { color: "#b34d38" },
  appointmentDetails: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: "#eeeae3", marginTop: 14, paddingTop: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", marginRight: 16, marginBottom: 2 },
  detailText: { color: "#60736a", fontSize: 12, fontWeight: "700", marginLeft: 5 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
  metricCard: {
    width: "47%",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  reportHero: { backgroundColor: "#20352d", borderRadius: 20, padding: 18, marginTop: 18, shadowColor: "#20352d", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  reportHeroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportHeroEyebrow: { color: "#b8c9c0", fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  reportHeroValue: { color: "#fffdfa", fontSize: 30, fontWeight: "800", marginTop: 16 },
  reportHeroLabel: { color: "#c8d2cb", fontSize: 12, marginTop: 2 },
  reportHeroFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", marginTop: 16, paddingTop: 12 },
  reportHeroMeta: { color: "#dfca73", fontSize: 11, fontWeight: "700" },
  reportMetricGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  reportStatusRow: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 15, padding: 13, marginBottom: 9 },
  reportStatusHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportStatusName: { flexDirection: "row", alignItems: "center", flex: 1 },
  reportStatusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 9 },
  reportStatusDotGold: { backgroundColor: "#dfca73" },
  reportStatusDotGreen: { backgroundColor: "#4c947d" },
  reportStatusDotRed: { backgroundColor: "#c55239" },
  reportTrack: { height: 8, backgroundColor: "#edf1ed", borderRadius: 5, overflow: "hidden", marginTop: 10 },
  reportProgress: { height: 8, borderRadius: 5 },
  reportProgressGold: { backgroundColor: "#dfca73" },
  reportProgressGreen: { backgroundColor: "#4c947d" },
  reportProgressRed: { backgroundColor: "#c55239" },
  metricLabel: { color: "#77817c", fontSize: 10, fontWeight: "800", marginTop: 5, textTransform: "uppercase" },
  statusCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 14, padding: 12, marginBottom: 9 },
  statusCardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginRight: 9 },
  statusCardLabel: { color: "#20352d", fontSize: 13, fontWeight: "800", flex: 1, textTransform: "capitalize" },
  statusCount: { minWidth: 34, height: 30, borderRadius: 10, backgroundColor: "#e5f1eb", alignItems: "center", justifyContent: "center" },
  statusCountText: { color: "#26735a", fontWeight: "800" },
  metricValue: { color: "#20352d", fontSize: 24, fontWeight: "800" },
  center: { alignItems: "center", padding: 35, gap: 8 },
  muted: { color: "#77817c", marginTop: 8 },
  error: { color: "#c55239", padding: 22 },
  message: { color: "#4c947d", marginTop: 12 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.7,
  },
  title: {
    color: "#20352d",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 12,
  },
  label: {
    color: "#20352d",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
  },
  fieldLabel: { color: "#20352d", fontWeight: "700", fontSize: 12, marginBottom: 6 },
  reviewFormCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 20, padding: 16, marginTop: 4 },
  reviewRatingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewVisitHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  reviewSectionLabel: { color: "#4c947d", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 7 },
  reviewPrompt: { color: "#20352d", fontSize: 16, fontWeight: "800" },
  ratingPill: { backgroundColor: "#fff1ed", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  ratingPillText: { color: "#c55239", fontSize: 12, fontWeight: "900" },
  starPicker: { flexDirection: "row", justifyContent: "center", gap: 9, marginTop: 15, marginBottom: 2 },
  starButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#f7f5f0", alignItems: "center", justifyContent: "center" },
  starButtonSelected: { backgroundColor: "#fff1d6" },
  star: { color: "#d9d6ce", fontSize: 32, transform: [{ translateY: -5 }] },
  starSelected: { color: "#dfb83f" },
  reviewDivider: { height: 1, backgroundColor: "#eeeae3", marginVertical: 18 },
  reviewComment: { minHeight: 92, textAlignVertical: "top", marginTop: 2 },
  reviewSubmit: { marginTop: 14 },
  primaryDisabled: { opacity: 0.45 },
  reviewChoiceList: { gap: 9, marginBottom: 4 },
  reviewChoice: { minHeight: 64, flexDirection: "row", alignItems: "center", backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 15, paddingHorizontal: 11, paddingVertical: 9 },
  reviewChoiceActive: { backgroundColor: "#e7f1ed", borderColor: "#9fc8b7" },
  reviewChoiceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#edf5f1", alignItems: "center", justifyContent: "center", marginRight: 10 },
  reviewChoiceCopy: { flex: 1, minWidth: 0 },
  reviewEmpty: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#edf5f1", borderRadius: 14, padding: 12, marginBottom: 4 },
  reviewEmptyText: { flex: 1, color: "#60736a", fontSize: 12, lineHeight: 17 },
  reviewPendingBadge: { alignSelf: "flex-start", backgroundColor: "#fff1d6", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, marginTop: 7 },
  reviewPendingText: { color: "#93631d", fontSize: 10, fontWeight: "800" },
  feedbackSummary: { flexDirection: "row", alignItems: "center", backgroundColor: "#20352d", borderRadius: 18, padding: 15, marginBottom: 14 },
  feedbackSummaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(223,202,115,0.16)", borderWidth: 1, borderColor: "rgba(223,202,115,0.35)", alignItems: "center", justifyContent: "center", marginRight: 11 },
  feedbackSummaryCopy: { flex: 1, minWidth: 0 },
  feedbackSummaryTitle: { color: "#fffdfa", fontSize: 16, fontWeight: "800" },
  feedbackSummaryText: { color: "#c8d2cb", fontSize: 11, lineHeight: 16, marginTop: 3 },
  feedbackCount: { alignItems: "center", minWidth: 46, borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.16)", paddingLeft: 10 },
  feedbackCountValue: { color: "#dfca73", fontSize: 20, fontWeight: "800" },
  feedbackCountLabel: { color: "#b8c9c0", fontSize: 9, fontWeight: "800", textTransform: "uppercase", marginTop: 2 },
  feedbackCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginBottom: 11, shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  feedbackHeader: { flexDirection: "row", alignItems: "center" },
  feedbackAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#dceee8", alignItems: "center", justifyContent: "center", marginRight: 10 },
  feedbackAvatarText: { color: "#20352d", fontSize: 17, fontWeight: "800" },
  feedbackIdentity: { flex: 1, minWidth: 0 },
  feedbackName: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  feedbackMeta: { color: "#77817c", fontSize: 11, marginTop: 3 },
  feedbackStatus: { backgroundColor: "#fff1d6", borderRadius: 13, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 7 },
  feedbackStatusPublished: { backgroundColor: "#e5f1eb" },
  feedbackStatusRejected: { backgroundColor: "#f8e5df" },
  feedbackStatusText: { color: "#93631d", fontSize: 10, fontWeight: "800" },
  feedbackStatusTextPublished: { color: "#26735a" },
  feedbackStatusTextRejected: { color: "#b34d38" },
  feedbackRating: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  feedbackStars: { color: "#dfb83f", fontSize: 16, letterSpacing: 1 },
  feedbackRatingText: { color: "#77817c", fontSize: 11, fontWeight: "700", marginLeft: 8 },
  feedbackComment: { color: "#53645b", fontSize: 13, lineHeight: 19, marginTop: 10 },
  feedbackActions: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#eeeae3", marginTop: 14, paddingTop: 12, gap: 8 },
  feedbackPublishButton: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#e5f1eb", borderWidth: 1, borderColor: "#cfe0d7" },
  feedbackPublishText: { color: "#26735a", fontSize: 12, fontWeight: "800", marginLeft: 5 },
  feedbackRejectButton: { minHeight: 42, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#fff4f1", borderWidth: 1, borderColor: "#efd1c8" },
  feedbackRejectText: { color: "#b34d38", fontSize: 12, fontWeight: "800", marginLeft: 5 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 12,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 13,
    color: "#20352d",
    marginBottom: 10,
  },
  sessionInput: { width: 78, height: 42, marginRight: 8, marginBottom: 0 },
  multilineInput: { height: 108, paddingTop: 13, textAlignVertical: "top" },
  manualNotificationCard: {
    backgroundColor: "#20352d",
    borderWidth: 1,
    borderColor: "#20352d",
    borderRadius: 20,
    padding: 15,
    marginBottom: 18,
    marginTop: 12,
  },
  notificationPreferencesCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#dfe9e3", borderRadius: 20, padding: 16, marginTop: 16 },
  notificationCardEyebrow: { color: "#dfca73", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 5 },
  notificationCardTitle: { color: "#20352d", fontSize: 17, fontWeight: "900" },
  notificationCardTitleDark: { color: "#fffdfa", fontSize: 17, fontWeight: "900" },
  notificationActivityHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 10 },
  notificationActivityTitle: { color: "#20352d", fontSize: 19, fontWeight: "900", marginTop: 3 },
  notificationActivityHint: { color: "#26735a", fontSize: 11, fontWeight: "800", paddingBottom: 2 },
  notificationHistoryTitle: { flex: 1, color: "#20352d", fontSize: 13, fontWeight: "900" },
  notificationHistoryMessage: { flex: 1, color: "#77817c", fontSize: 11, lineHeight: 16, marginTop: 4 },
  notificationHistoryCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1e8e3", borderRadius: 16, padding: 14, marginBottom: 9 },
  notificationUnreadCard: { borderColor: "#cfe3d8", backgroundColor: "#f4f9f6" },
  notificationStatusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#c55239", marginLeft: 10 },
  notificationReadDot: { backgroundColor: "#b8c8c0" },
  twoInputs: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  branchCard: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  branchTitleWrap: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  branchIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginRight: 9 },
  branchTitle: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  branchHint: { color: "#77817c", fontSize: 10, marginTop: 2 },
  activeText: { color: "#26735a", fontWeight: "800" },
  secondary: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cfe0d7",
    backgroundColor: "#edf5f1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  multiline: { height: 90, paddingTop: 13, textAlignVertical: "top" },
  editorCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginTop: 4, marginBottom: 4 },
  editorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  editorHeaderCopy: { flex: 1, minWidth: 0 },
  editorIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginRight: 10 },
  editorTitle: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  editorHint: { color: "#77817c", fontSize: 11, marginTop: 3 },
  catalogItem: { backgroundColor: "#f8faf7", borderWidth: 1, borderColor: "#e1e8e2", borderRadius: 14, padding: 12, marginTop: 10 },
  catalogItemHeader: { flexDirection: "row", alignItems: "center" },
  catalogItemCopy: { flex: 1, minWidth: 0, paddingRight: 8 },
  catalogItemTitle: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  catalogItemMeta: { color: "#77817c", fontSize: 12, marginTop: 4 },
  productImagePreview: { width: "100%", height: 150, borderRadius: 14, backgroundColor: "#e7f1ed", marginBottom: 9 },
  productImageEmpty: { height: 86, borderRadius: 14, backgroundColor: "#f1f6f2", alignItems: "center", justifyContent: "center", marginBottom: 9 },
  galleryAdminCard: { backgroundColor: "#f8faf7", borderWidth: 1, borderColor: "#e1e8e2", borderRadius: 15, padding: 12, marginBottom: 10 },
  galleryAdminRow: { gap: 9, paddingTop: 11, paddingRight: 2 },
  galleryAdminItem: { width: 112, height: 92, borderRadius: 13, overflow: "hidden", backgroundColor: "#e7f1ed", position: "relative" },
  galleryAdminImage: { width: "100%", height: "100%" },
  galleryRemoveButton: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(32,53,45,0.8)", alignItems: "center", justifyContent: "center" },
  editButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e5f1eb", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  editButtonText: { color: "#26735a", fontSize: 12, fontWeight: "800", marginLeft: 4 },
  catalogEditor: { borderTopWidth: 1, borderTopColor: "#e1e8e2", marginTop: 12, paddingTop: 4 },
  flexInput: { flex: 1, minWidth: 0 },
  addItemButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "#e5f1eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 },
  deleteText: { color: "#b34d38", fontSize: 12, fontWeight: "800", marginTop: 4 },
  sectionBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#20352d", borderRadius: 18, padding: 15, marginTop: 4, marginBottom: 14 },
  sectionBannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(223,202,115,0.16)", borderWidth: 1, borderColor: "rgba(223,202,115,0.35)", alignItems: "center", justifyContent: "center", marginRight: 11 },
  sectionBannerCopy: { flex: 1, minWidth: 0 },
  sectionBannerEyebrow: { color: "#a9c9ba", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  sectionBannerTitle: { color: "#fffdfa", fontSize: 17, fontWeight: "800", marginTop: 3 },
  sectionBannerDescription: { color: "#c8d2cb", fontSize: 11, lineHeight: 16, marginTop: 3 },
  setupSummary: { flexDirection: "row", alignItems: "center", backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 17, padding: 13, marginBottom: 18 },
  setupSummaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginRight: 10 },
  setupSummaryCopy: { flex: 1, minWidth: 0 },
  setupSummaryTitle: { color: "#20352d", fontSize: 15, fontWeight: "800" },
  setupSummaryText: { color: "#77817c", fontSize: 11, marginTop: 3 },
  activePill: { flexDirection: "row", alignItems: "center", backgroundColor: "#e5f1eb", borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 7 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4c947d", marginRight: 5 },
  activePillText: { color: "#26735a", fontSize: 10, fontWeight: "800" },
  stylistSectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, marginBottom: 10 },
  stylistSectionTitle: { color: "#20352d", fontSize: 19, fontWeight: "900", marginTop: 3 },
  stylistSectionCount: { color: "#26735a", fontSize: 11, fontWeight: "800", paddingBottom: 2 },
  stylistProfileCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#dce9e3", borderRadius: 20, padding: 15, marginBottom: 12 },
  stylistProfileHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: "#edf0eb" },
  stylistAvatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#dceee8", alignItems: "center", justifyContent: "center", marginRight: 10 },
  stylistAvatarText: { color: "#26735a", fontSize: 18, fontWeight: "900" },
  stylistProfileCopy: { flex: 1, minWidth: 0 },
  stylistName: { color: "#20352d", fontSize: 15, fontWeight: "900" },
  stylistMeta: { color: "#77817c", fontSize: 11, marginTop: 3 },
  stylistStatusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#e7f1ed", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, marginLeft: 6 },
  stylistStatusText: { color: "#26735a", fontSize: 10, fontWeight: "900" },
  stylistFieldLabel: { color: "#91b3a3", fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 13, marginBottom: 6 },
  stylistInput: { height: 46, borderWidth: 1, borderColor: "#e1e8e3", borderRadius: 12, backgroundColor: "#f8faf7", paddingHorizontal: 12, color: "#20352d", marginBottom: 9 },
  scheduleDivider: { height: 1, backgroundColor: "#edf0eb", marginTop: 3 },
  scheduleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleHint: { color: "#a0aaa5", fontSize: 10, marginTop: 13, marginBottom: 6 },
  formSectionTitle: { color: "#20352d", fontSize: 17, fontWeight: "800", marginBottom: 8 },
  formSectionLabel: { color: "#91b3a3", fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginTop: 6, marginBottom: 7 },
  formCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginBottom: 2 },
  formCardTitle: { color: "#20352d", fontSize: 15, fontWeight: "800", marginBottom: 3 },
  consultationSummary: { flexDirection: "row", alignItems: "center", backgroundColor: "#e7f1ed", borderRadius: 16, padding: 13, marginBottom: 12 },
  consultationSummaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#fffdfa", alignItems: "center", justifyContent: "center", marginRight: 10 },
  consultationSummaryCopy: { flex: 1 },
  consultationSummaryTitle: { color: "#20352d", fontSize: 14, fontWeight: "800" },
  consultationSummaryText: { color: "#60736a", fontSize: 11, marginTop: 3 },
  consultationCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginTop: 16, shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  consultationCardHeader: { flexDirection: "row", alignItems: "center" },
  consultationAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#dceee8", alignItems: "center", justifyContent: "center", marginRight: 10 },
  consultationAvatarText: { color: "#20352d", fontSize: 18, fontWeight: "800" },
  consultationCardCopy: { flex: 1 },
  consultationCardTitle: { color: "#20352d", fontSize: 15, fontWeight: "800" },
  progressPill: { backgroundColor: "#f8e5df", borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6 },
  progressPillText: { color: "#b34d38", fontSize: 10, fontWeight: "800" },
  choiceLabel: { color: "#20352d", fontSize: 12, fontWeight: "700", marginLeft: 5 },
  recommendationCard: { backgroundColor: "#f7f5f0", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 13, padding: 12, marginBottom: 8 },
  recommendationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scorePill: { color: "#26735a", backgroundColor: "#e5f1eb", borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4, fontSize: 10, fontWeight: "800" },
  consultationHistoryCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 16, padding: 13, marginBottom: 10, shadowColor: "#20352d", shadowOpacity: 0.04, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  consultationHistoryHeader: { flexDirection: "row", alignItems: "center" },
  consultationHistoryFooter: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#eeeae3", marginTop: 11, paddingTop: 9 },
  consultationStartButton: { marginBottom: 8 },
  consultationChipRow: { marginTop: 10 },
  rewardCard: { backgroundColor: "#20352d", borderRadius: 20, padding: 16, marginTop: 16, marginBottom: 14 },
  rewardCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  rewardEyebrow: { color: "#dfca73", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  rewardTitle: { color: "#fffdfa", fontSize: 19, fontWeight: "900", marginTop: 5 },
  rewardHint: { color: "#c8d2cb", fontSize: 11, lineHeight: 16, marginTop: 5, maxWidth: 250 },
  rewardCurrency: { color: "#dfca73", fontSize: 30, fontWeight: "900" },
  rewardInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  rewardInputWrap: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", backgroundColor: "#fffdfa", borderRadius: 12, paddingHorizontal: 12 },
  rewardInputPrefix: { color: "#c55239", fontSize: 16, fontWeight: "900", marginRight: 5 },
  rewardInput: { flex: 1, color: "#20352d", fontSize: 15, fontWeight: "800", paddingVertical: 0 },
  rewardSaveButton: { minHeight: 46, justifyContent: "center", backgroundColor: "#c55239", borderRadius: 12, paddingHorizontal: 13 },
  rewardSaveText: { color: "#fffdfa", fontSize: 11, fontWeight: "900" },
  couponEditorCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#dce9e3", borderRadius: 20, padding: 16, marginBottom: 18 },
  couponEditorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
  couponEditorTitle: { color: "#20352d", fontSize: 19, fontWeight: "900", marginTop: 4 },
  couponHint: { color: "#26735a", backgroundColor: "#e7f1ed", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: "900" },
  couponFieldLabel: { color: "#77817c", fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 13, marginBottom: 5 },
  couponDiscountInput: { flex: 1 },
  couponTypeButton: { justifyContent: "center" },
  bannerEditorCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#dce9e3", borderRadius: 20, padding: 16, marginTop: 16, marginBottom: 16 },
  bannerEditorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  bannerEditorTitle: { color: "#20352d", fontSize: 18, fontWeight: "900", marginTop: 4 },
  bannerEditorIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#20352d", alignItems: "center", justifyContent: "center" },
  bannerFieldLabel: { color: "#77817c", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  bannerMessageInput: { minHeight: 72, textAlignVertical: "top", paddingTop: 13 },
  bannerImageCard: { backgroundColor: "#f4f8f5", borderWidth: 1, borderColor: "#dce9e3", borderRadius: 16, padding: 10, marginBottom: 2 },
  bannerImagePreview: { width: "100%", height: 150, borderRadius: 12, backgroundColor: "#e7f1ed" },
  bannerImageEmpty: { height: 150, borderRadius: 12, backgroundColor: "#e7f1ed", alignItems: "center", justifyContent: "center" },
  bannerEmptyTitle: { color: "#20352d", fontSize: 12, fontWeight: "800", marginTop: 8 },
  imageUploadButton: { alignItems: "center", justifyContent: "center", backgroundColor: "#26735a", borderRadius: 12, minHeight: 44, marginTop: 10 },
  imageUploadText: { color: "#fffdfa", fontSize: 12, fontWeight: "900" },
  bannerListCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 10, marginBottom: 12 },
  bannerListPlaceholder: { width: "100%", height: 130, borderRadius: 12, backgroundColor: "#e7f1ed", alignItems: "center", justifyContent: "center" },
  bannerListPlaceholderText: { color: "#4c947d", fontSize: 11, fontWeight: "800" },
  bannerListImage: { width: "100%", height: 130, borderRadius: 12, backgroundColor: "#e7f1ed" },
  bannerListBody: { paddingHorizontal: 3, paddingTop: 12 },
  bannerListTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  bannerListTitle: { flex: 1, color: "#20352d", fontSize: 14, fontWeight: "900" },
  bannerStatus: { backgroundColor: "#e5f5ec", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  bannerStatusPaused: { backgroundColor: "#fbe9e4" },
  bannerStatusText: { color: "#287b5c", fontSize: 9, fontWeight: "900" },
  bannerListMessage: { color: "#77817c", fontSize: 11, lineHeight: 16, marginTop: 6 },
  bannerActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  bannerActionButton: { backgroundColor: "#e7f1ed", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  bannerActionText: { color: "#26735a", fontSize: 10, fontWeight: "900" },
  bannerDeleteButton: { backgroundColor: "#fff1ed", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  bannerDeleteText: { color: "#b24e3c", fontSize: 10, fontWeight: "900" },
  customerSummary: { flexDirection: "row", alignItems: "center", backgroundColor: "#20352d", borderRadius: 18, padding: 15, marginTop: 4, marginBottom: 14 },
  customerSummaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(223,202,115,0.16)", alignItems: "center", justifyContent: "center", marginRight: 11 },
  customerSummaryCopy: { flex: 1 },
  customerSummaryTitle: { color: "#fffdfa", fontSize: 16, fontWeight: "800" },
  customerSummaryText: { color: "#c8d2cb", fontSize: 11, marginTop: 3 },
  customerCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, padding: 15, marginTop: 12, shadowColor: "#20352d", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  customerHeader: { flexDirection: "row", alignItems: "center" },
  customerAvatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#dceee8", alignItems: "center", justifyContent: "center", marginRight: 11 },
  customerAvatarText: { color: "#20352d", fontSize: 19, fontWeight: "800" },
  customerIdentity: { flex: 1, minWidth: 0 },
  customerName: { color: "#20352d", fontSize: 15, fontWeight: "800" },
  customerEmail: { color: "#77817c", fontSize: 11, marginTop: 3 },
  customerStatus: { backgroundColor: "#e5f1eb", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 8 },
  customerStatusInactive: { backgroundColor: "#f8e5df" },
  customerStatusText: { color: "#26735a", fontSize: 10, fontWeight: "800" },
  customerStatusTextInactive: { color: "#b34d38" },
  customerStats: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#eeeae3", marginTop: 14, paddingVertical: 11 },
  customerStat: { minWidth: 105, marginRight: 18 },
  customerStatValue: { color: "#20352d", fontSize: 13, fontWeight: "800" },
  customerStatLabel: { color: "#77817c", fontSize: 10, marginTop: 3, textTransform: "uppercase", fontWeight: "700" },
  historyTitle: { color: "#20352d", fontSize: 12, fontWeight: "800", marginBottom: 7 },
  historyRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  historyText: { color: "#60736a", fontSize: 11, marginLeft: 6, flexShrink: 1 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dropdown: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 9, paddingHorizontal: 13 },
  dropdownMenu: { backgroundColor: "#fffdfa", borderColor: "#d9d6ce", borderWidth: 1, borderRadius: 9, marginTop: 6, overflow: "hidden" },
  dropdownOption: { paddingHorizontal: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#eeeae2" },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    marginRight: 8,
    marginBottom: 8,
  },
  choiceActive: { backgroundColor: "#dceee8", borderColor: "#dceee8" },
  primary: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#c55239",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  preference: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  preferenceHint: { color: "#77817c", fontSize: 12, marginTop: 3 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#c55239",
    color: "#c55239",
    textAlign: "center",
    paddingTop: 1,
  },
  cardTextDark: { color: "#20352d", fontSize: 14, fontWeight: "700" },
  card: {
    backgroundColor: "#20352d",
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },
  cardLight: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  consultationImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#e8eee9",
  },
  disabled: { opacity: 0.55 },
  cardTitle: {
    color: "#f7f5f0",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardText: { color: "#c8d2cb", lineHeight: 22 },
  row: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e1ddd4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#20352d",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  actionText: { color: "#20352d", fontSize: 12, fontWeight: "800", marginLeft: 5 },
  emptyCard: { backgroundColor: "#fffdfa", borderWidth: 1, borderColor: "#e1ddd4", borderRadius: 18, alignItems: "center", padding: 24, marginTop: 14 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#f8e5df", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  historyBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e1d9",
    gap: 4,
  },
  branchMapCard: {
    marginTop: 4,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dce9e3",
    backgroundColor: "#f4f8f5",
  },
  branchMapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  branchMapTitle: { color: "#20352d", fontSize: 12, fontWeight: "900" },
  branchMapHint: { color: "#77817c", fontSize: 10, marginTop: 2 },
  branchMap: { width: "100%", height: 150 },
  branchMapEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce9e3",
    backgroundColor: "#f4f8f5",
    padding: 12,
  },
  branchMapEmptyText: { flex: 1, color: "#60736a", fontSize: 11, lineHeight: 16 },
});

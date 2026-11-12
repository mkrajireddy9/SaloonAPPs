// @ts-nocheck
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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
import { API_URL, api } from "../api";

type Props = {
  role: "user" | "admin";
  email: string;
  initialSection?: string;
  showBack?: boolean;
};
type Price = {
  name: string;
  price: number;
  durationMinutes?: number;
  offerText?: string;
};
type Product = { id: string; name: string; description?: string };
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
}: Props) {
  const [section, setSection] = useState(
    initialSection || (role === "admin" ? "customers" : "booking"),
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        }
      : {
          booking: "/salon/directory",
          payments: "/payments",
          profile: "/customers/me",
          passport: "/passport",
          notifications: "/auth/preferences",
          salonInfo: "/salon",
          reviews: "/reviews",
        };
  useEffect(() => {
    if (
      initialSection &&
      initialSection !== section &&
      endpoints[initialSection]
    )
      setSection(initialSection);
  }, [initialSection]);
  useEffect(() => {
    setLoading(true);
    setError("");
    api<any>(endpoints[section])
      .then((result) => setData(result))
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load this screen.",
        ),
      )
      .finally(() => setLoading(false));
  }, [section]);
  const prices = (
    Array.isArray(data) ? data : data?.serviceDetails || []
  ) as Price[];
  const products = (
    Array.isArray(data) ? data : data?.products || []
  ) as Product[];
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
      <MoreHeader
        endpoints={endpoints}
        section={section}
        setSection={setSection}
        email={email}
        role={role}
        showBack={showBack}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#c55239" />
          <Text style={styles.muted}>Loading...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.content}>
          {section === "booking" && (
            <BookingView salons={Array.isArray(data) ? data : []} />
          )}
          {section === "profile" && (
            <ProfileView profile={data || {}} email={email} />
          )}
          {section === "passport" && <PassportView passport={data || {}} />}
          {section === "salon" && <AdminSalonView salon={data || {}} />}
          {section === "salonInfo" && <SalonInfoView salon={data || {}} />}
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
            <PreferencesView initial={data || {}} />
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
        </View>
      )}
      </ScrollView>
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
  salonInfo: {
    label: "Salon details",
    description: "Services, prices and products",
    icon: "storefront",
  },
  payments: {
    label: "Payments",
    description: "Invoices and payment history",
    icon: "card",
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
};
function MoreHeader({
  endpoints,
  section,
  setSection,
  email,
  role,
  showBack,
}: {
  endpoints: Record<string, string>;
  section: string;
  setSection: (value: string) => void;
  email: string;
  role: "user" | "admin";
  showBack: boolean;
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
            ],
          },
        ]
      : [
          { title: "Quick actions", keys: ["booking", "payments"] },
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
            onPress={() => router.back()}
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
      {groups.map((group) => (
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
                  <Pressable
                    key={key}
                    style={[
                      styles.settingRow,
                      active && styles.settingRowActive,
                    ]}
                    onPress={() => setSection(key)}
                  >
                    <View
                      style={[
                        styles.settingIcon,
                        active && styles.settingIconActive,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? "#fff" : "#c55239"}
                      />
                    </View>
                    <View style={styles.settingCopy}>
                      <Text
                        style={[
                          styles.settingTitle,
                          active && styles.settingTitleActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          active && styles.settingDescriptionActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={active ? "#fff" : "#a7afa9"}
                    />
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
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
      <Text style={styles.eyebrow}>STUDIO SETUP</Text>
      <Text style={styles.title}>Salon setup</Text>
      <Text style={styles.muted}>Manage the details guests use to find and book your salon.</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Salon name" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={location} onChangeText={setLocation} placeholder="Main location" style={styles.input} placeholderTextColor="#9aa19c" />
      <View style={styles.twoInputs}>
        <TextInput value={opening} onChangeText={setOpening} placeholder="Opening HH:MM" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
        <TextInput value={closing} onChangeText={setClosing} placeholder="Closing HH:MM" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
      </View>
      <TextInput value={services} onChangeText={setServices} placeholder="Services separated by commas" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={stylists} onChangeText={setStylists} placeholder="Stylists separated by commas" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={closedDays} onChangeText={setClosedDays} placeholder="Closed days, e.g. Sunday" style={styles.input} placeholderTextColor="#9aa19c" />
      <Text style={styles.subheading}>Stylist profiles and schedules</Text>
      {stylists.split(",").map((value: string) => value.trim()).filter(Boolean).map((stylist: string) => {
        const profile = stylistProfiles[stylist] || { bio: "", imageUrl: "" };
        const schedule = stylistSchedules[stylist] || { workingDays: [], leaveDates: [] };
        return (
          <View style={styles.branchCard} key={stylist}>
            <Text style={styles.cardTextDark}>{stylist}</Text>
            <TextInput
              value={profile.bio || ""}
              onChangeText={(value) => setStylistProfiles((current: any) => ({ ...current, [stylist]: { ...profile, bio: value } }))}
              placeholder="Stylist bio"
              style={styles.input}
              placeholderTextColor="#9aa19c"
            />
            <TextInput
              value={profile.imageUrl || ""}
              onChangeText={(value) => setStylistProfiles((current: any) => ({ ...current, [stylist]: { ...profile, imageUrl: value } }))}
              placeholder="Profile image URL"
              style={styles.input}
              placeholderTextColor="#9aa19c"
              autoCapitalize="none"
            />
            <TextInput
              value={(schedule.workingDays || []).join(", ")}
              onChangeText={(value) => setStylistSchedules((current: any) => ({ ...current, [stylist]: { ...schedule, workingDays: value.split(",").map((day: string) => day.trim()).filter(Boolean) } }))}
              placeholder="Working days, e.g. Monday, Tuesday"
              style={styles.input}
              placeholderTextColor="#9aa19c"
            />
            <TextInput
              value={(schedule.leaveDates || []).join(", ")}
              onChangeText={(value) => setStylistSchedules((current: any) => ({ ...current, [stylist]: { ...schedule, leaveDates: value.split(",").map((day: string) => day.trim()).filter(Boolean) } }))}
              placeholder="Leave dates, e.g. 2026-11-20"
              style={styles.input}
              placeholderTextColor="#9aa19c"
            />
          </View>
        );
      })}
      <Text style={styles.subheading}>Branches</Text>
      {branches.map((branch) => (
        <View style={styles.branchCard} key={branch.id}>
          <View style={styles.branchHeader}>
            <Text style={styles.cardTextDark}>{branch.name || "Branch"}</Text>
            <Pressable
              onPress={() => updateBranch(branch.id, { active: branch.active === false })}
            >
              <Text style={branch.active === false ? styles.actionText : styles.activeText}>
                {branch.active === false ? "Inactive" : "Active"}
              </Text>
            </Pressable>
          </View>
          <TextInput value={branch.name} onChangeText={(value) => updateBranch(branch.id, { name: value })} placeholder="Branch name" style={styles.input} placeholderTextColor="#9aa19c" />
          <TextInput value={branch.location} onChangeText={(value) => updateBranch(branch.id, { location: value })} placeholder="Branch location" style={styles.input} placeholderTextColor="#9aa19c" />
          <TextInput value={branch.contact || ""} onChangeText={(value) => updateBranch(branch.id, { contact: value })} placeholder="Contact phone or email" style={styles.input} placeholderTextColor="#9aa19c" />
          <View style={styles.twoInputs}>
            <TextInput value={branch.openingHours?.open || opening} onChangeText={(value) => updateBranch(branch.id, { openingHours: { ...branch.openingHours, open: value } })} placeholder="Opening" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
            <TextInput value={branch.openingHours?.close || closing} onChangeText={(value) => updateBranch(branch.id, { openingHours: { ...branch.openingHours, close: value } })} placeholder="Closing" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
          </View>
          <TextInput
            value={(branch.closedDays || []).join(", ")}
            onChangeText={(value) =>
              updateBranch(branch.id, {
                closedDays: value.split(",").map((day: string) => day.trim()).filter(Boolean),
              })
            }
            placeholder="Closed days, e.g. Sunday"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <View style={styles.twoInputs}>
            <TextInput value={branch.latitude == null ? "" : String(branch.latitude)} onChangeText={(value) => updateBranch(branch.id, { latitude: value })} placeholder="Latitude" keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
            <TextInput value={branch.longitude == null ? "" : String(branch.longitude)} onChangeText={(value) => updateBranch(branch.id, { longitude: value })} placeholder="Longitude" keyboardType="numeric" style={[styles.input, styles.halfInput]} placeholderTextColor="#9aa19c" />
          </View>
        </View>
      ))}
      <Pressable style={styles.secondary} onPress={addBranch}>
        <Text style={styles.actionText}>+ Add branch</Text>
      </Pressable>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save salon details</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function AdminPriceView({ initial }: { initial: Price[] }) {
  const [text, setText] = useState(
    initial
      .map((x) => `${x.name}|${x.price}|${x.durationMinutes || 60}`)
      .join("\n"),
  );
  const [message, setMessage] = useState("");
  async function save() {
    const items = text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, price, durationMinutes] = line.split("|");
        return {
          name,
          price: Number(price),
          durationMinutes: Number(durationMinutes) || 60,
          active: true,
        };
      });
    try {
      await api("/salon/price-list", {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
      setMessage("Prices saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save prices.");
    }
  }
  return (
    <View>
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>Prices and offers</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        style={[styles.input, styles.multiline]}
        placeholder="Service|price|minutes"
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save prices</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
function AdminProductView({ initial }: { initial: Product[] }) {
  const [text, setText] = useState(
    initial.map((x) => `${x.id}|${x.name}|${x.description || ""}`).join("\n"),
  );
  const [message, setMessage] = useState("");
  async function save() {
    const products = text
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [id, name, description] = line.split("|");
        return { id, name, description, active: true };
      });
    try {
      await api("/salon/products", {
        method: "PUT",
        body: JSON.stringify({ products }),
      });
      setMessage("Products saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save products.");
    }
  }
  return (
    <View>
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>Products used</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        style={[styles.input, styles.multiline]}
        placeholder="id|name|description"
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save products</Text>
      </Pressable>
      <Text style={styles.message}>{message}</Text>
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
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>Salon branding</Text>
      <Text style={styles.muted}>Keep the guest-facing identity consistent across your salon.</Text>
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
  const [kind, setKind] = useState<"service" | "stylist">("service");
  const [name, setName] = useState((salon.services || [])[0] || "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const services = Array.isArray(salon.serviceDetails)
    ? salon.serviceDetails
    : (salon.services || []).map((item: string) => ({ name: item, imageUrl: "" }));
  const profiles = salon.stylistProfiles || {};
  const names = kind === "service" ? salon.services || [] : salon.stylists || [];
  const currentImage = kind === "service"
    ? services.find((item: any) => item.name === name)?.imageUrl
    : profiles[name]?.imageUrl;
  const changeKind = (next: "service" | "stylist") => {
    setKind(next);
    setName(next === "service" ? (salon.services || [])[0] || "" : (salon.stylists || [])[0] || "");
  };
  const chooseAndUpload = async () => {
    if (!name || !consent) {
      setMessage("Select a service or stylist and confirm image storage consent.");
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
    });
    if (result.canceled || !result.assets[0]) return;
    setBusy(true);
    setMessage("");
    try {
      const asset = result.assets[0];
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: asset.fileName || `${name.replace(/\s+/g, "-")}.jpg`,
        type: asset.mimeType || "image/jpeg",
      } as any);
      form.append("consentGiven", "true");
      const uploaded = await api<any>("/media/upload", { method: "POST", body: form });
      const imageUrl = `${API_URL}${uploaded.url}`;
      const nextServiceDetails = services.map((item: any) => item.name === name ? { ...item, imageUrl } : item);
      const nextProfiles = {
        ...profiles,
        [name]: { ...(profiles[name] || {}), imageUrl },
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
      setMessage("Image uploaded and linked.");
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
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO SETUP</Text>
      <Text style={styles.title}>Private media</Text>
      <Text style={styles.muted}>Upload protected service and stylist images for the guest experience.</Text>
      <View style={styles.actionRow}>
        <Pressable style={[styles.choice, kind === "service" && styles.choiceActive]} onPress={() => changeKind("service")}>
          <Text style={styles.cardTextDark}>Service image</Text>
        </Pressable>
        <Pressable style={[styles.choice, kind === "stylist" && styles.choiceActive]} onPress={() => changeKind("stylist")}>
          <Text style={styles.cardTextDark}>Stylist image</Text>
        </Pressable>
      </View>
      <TextInput value={name} onChangeText={setName} placeholder={kind === "service" ? "Service name" : "Stylist name"} style={styles.input} placeholderTextColor="#9aa19c" />
      <Text style={styles.muted}>Available: {names.join(", ") || "None configured"}</Text>
      <Pressable style={[styles.secondary, busy && styles.disabled]} disabled={busy} onPress={() => void chooseAndUpload()}>
        <Text style={styles.actionText}>{busy ? "Working..." : "Choose and upload image"}</Text>
      </Pressable>
      <Pressable style={[styles.preference, { marginTop: 8 }]} onPress={() => setConsent((value) => !value)}>
        <Text style={styles.checkbox}>{consent ? "✓" : ""}</Text>
        <Text style={styles.cardTextDark}>I confirm this image may be stored for salon use.</Text>
      </Pressable>
      {currentImage ? (
        <View style={styles.cardLight}>
          <Text style={styles.cardTextDark}>Current image linked</Text>
          <Text style={styles.muted}>{currentImage}</Text>
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
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  async function create() {
    try {
      const saved = await api<any>("/banners", {
        method: "POST",
        body: JSON.stringify({
          title,
          message,
          actionLabel: "Book now",
          actionUrl: "/appointments",
          active: true,
        }),
      });
      setItems([...items, saved]);
      setTitle("");
      setMessage("");
      setStatus("Banner created.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not create banner.");
    }
  }
  async function remove(id: string) {
    try {
      await api(`/banners/${id}`, { method: "DELETE" });
      setItems(items.filter((item) => item.id !== id));
      setStatus("Banner deleted.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete banner.");
    }
  }
  async function toggle(item: any) {
    try {
      const updated = await api<any>(`/banners/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: item.active === false }),
      });
      setItems(items.map((current) => (current.id === item.id ? { ...current, ...updated } : current)));
      setStatus(item.active === false ? "Banner published." : "Banner paused.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not update banner.");
    }
  }
  return (
    <View>
      <Text style={styles.eyebrow}>ADMIN</Text>
      <Text style={styles.title}>Offers and banners</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Banner title"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Banner message"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void create()}>
        <Text style={styles.primaryText}>Create banner</Text>
      </Pressable>
      {items.map((item) => (
        <View style={styles.row} key={item.id}>
          <Text style={styles.cardTextDark}>{item.title}</Text>
          <Text style={styles.muted}>{item.message}</Text>
          <View style={styles.actionRow}>
            <Pressable onPress={() => void toggle(item)}>
              <Text style={styles.actionText}>{item.active === false ? "Publish" : "Pause"}</Text>
            </Pressable>
            <Pressable onPress={() => void remove(item.id)}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Text style={styles.message}>{status}</Text>
    </View>
  );
}
function AdminAppointmentsView({ initial }: { initial: any[] }) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState("");
  const updateStatus = async (
    id: string,
    status: "Requested" | "Confirmed" | "Cancelled",
  ) => {
    try {
      await api(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
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
      {items.length ? (
        items.map((item) => (
          <View style={styles.row} key={item.id}>
            <Text style={styles.cardTextDark}>{item.service || "Appointment"}</Text>
            <Text style={styles.muted}>
              {item.date} · {item.time} · {item.guestName || item.guestEmail || "Guest"}
            </Text>
            <Text style={styles.cardText}>{item.status || "Requested"}</Text>
            <View style={styles.actionRow}>
              {item.status === "Requested" ? (
                <Pressable onPress={() => void updateStatus(item.id, "Confirmed")}>
                  <Text style={styles.actionText}>Confirm</Text>
                </Pressable>
              ) : null}
              {item.status !== "Cancelled" ? (
                <Pressable onPress={() => void updateStatus(item.id, "Cancelled")}>
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No appointments yet.</Text>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function AdminCustomersView({ initial }: { initial: any[] }) {
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
      setMessage(active ? "Customer activated." : "Customer deactivated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update customer.");
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
      setMessage(e instanceof Error ? e.message : "Could not load customer history.");
    } finally {
      setHistoryBusy("");
    }
  };
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO WORKSPACE</Text>
      <Text style={styles.title}>Customers</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search customers"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      {filtered.length ? (
        filtered.map((item) => (
          <View style={styles.row} key={item.id}>
            <Text style={styles.cardTextDark}>{item.name || item.email}</Text>
            <Text style={styles.muted}>{item.email}</Text>
            <Text style={styles.cardText}>
              {item.appointmentCount || 0} visits · {item.active === false ? "Inactive" : "Active"}
            </Text>
            <View style={styles.actionRow}>
              <Pressable onPress={() => void toggle(item)}>
                <Text style={styles.actionText}>{item.active === false ? "Activate" : "Deactivate"}</Text>
              </Pressable>
              <Pressable disabled={historyBusy === item.id} onPress={() => void showHistory(item)}>
                <Text style={styles.actionText}>{historyBusy === item.id ? "Loading..." : history[item.id] ? "Hide history" : "History"}</Text>
              </Pressable>
              {item.lastAppointment ? (
                <Text style={styles.muted}>
                  Last visit: {item.lastAppointment.date || "Not dated"}
                </Text>
              ) : null}
            </View>
            {history[item.id]?.length ? (
              <View style={styles.historyBox}>
                {history[item.id].map((visit: any) => (
                  <Text key={visit.id} style={styles.muted}>
                    {visit.date || "Undated"} · {visit.service || "Appointment"} · {visit.status || "Requested"}
                  </Text>
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
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
      <Text style={styles.eyebrow}>STUDIO WORKSPACE</Text>
      <Text style={styles.title}>Consultations</Text>
      <Text style={styles.muted}>Start a guest consultation from the salon floor.</Text>
      <TextInput value={guestName} onChangeText={setGuestName} placeholder="Guest name" style={styles.input} placeholderTextColor="#9aa19c" />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" style={styles.input} keyboardType="phone-pad" placeholderTextColor="#9aa19c" />
      <TextInput value={goal} onChangeText={setGoal} placeholder="What would the guest like?" style={styles.input} placeholderTextColor="#9aa19c" />
      <Pressable style={styles.primary} onPress={() => void create()}>
        <Text style={styles.primaryText}>Start consultation</Text>
      </Pressable>
      {selected ? (
        <View style={styles.cardLight}>
          <Text style={styles.cardTextDark}>Working with {selected.guestName}</Text>
          <Text style={styles.muted}>Capture front, left, and right before analysis.</Text>
          <View style={styles.actionRow}>
            {(["front", "left", "right"] as const).map((view) => (
              <Pressable key={view} style={[styles.choice, capturedViews.includes(view) && styles.choiceActive]} onPress={() => void captureView(view)}>
                <Text style={styles.cardTextDark}>{capturedViews.includes(view) ? "✓ " : ""}{view}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actionRow}>
            <Pressable onPress={() => void choosePhoto(true)}>
              <Text style={styles.actionText}>Take photo</Text>
            </Pressable>
            <Pressable onPress={() => void choosePhoto(false)}>
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
              <Text style={styles.subheading}>Recommendations</Text>
              {(selected.report.recommendations || []).map((item: any) => (
                <Pressable
                  key={item.name}
                  style={[styles.choice, selected.selectedStyle === item.name && styles.choiceActive]}
                  onPress={() => setSelected((current: any) => ({ ...current, selectedStyle: item.name }))}
                >
                  <Text style={styles.cardTextDark}>{item.name} · {item.score || 0}%</Text>
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
        items.map((item) => (
          <View style={styles.row} key={item.id}>
            <Text style={styles.cardTextDark}>{item.guestName || "Guest"}</Text>
            <Text style={styles.muted}>{item.status || "started"}</Text>
            {item.goal ? <Text style={styles.cardText}>{item.goal}</Text> : null}
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No consultations yet.</Text>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function AdminReportsView({ initial }: { initial: any }) {
  const analytics = initial.analytics || {};
  const statusBreakdown = Array.isArray(analytics.statusBreakdown)
    ? analytics.statusBreakdown
    : [];
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO ANALYTICS</Text>
      <Text style={styles.title}>Reports and analytics</Text>
      <Text style={styles.muted}>A quick view of booking activity and revenue.</Text>
      <View style={styles.metricsGrid}>
        <MetricCard label="Bookings" value={analytics.totalBookings || 0} />
        <MetricCard label="Confirmed" value={analytics.confirmedBookings || 0} />
        <MetricCard label="Requested" value={analytics.requestedBookings || 0} />
        <MetricCard label="Revenue" value={`₹${analytics.revenue || 0}`} />
      </View>
      <Text style={styles.subheading}>Booking status</Text>
      {statusBreakdown.length ? (
        statusBreakdown.map((item: any) => (
          <View style={styles.infoRow} key={item.status}>
            <Text style={styles.cardTextDark}>{item.status}</Text>
            <Text style={styles.priceText}>{item.count || 0}</Text>
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
function PreferencesView({ initial }: { initial: any }) {
  const [email, setEmail] = useState(initial.email !== false);
  const [appointmentReminders, setAppointmentReminders] = useState(
    initial.appointmentReminders !== false,
  );
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<any>("/notifications")
      .then((result) => setHistory(Array.isArray(result) ? result : []))
      .catch(() => setHistory([]));
  }, []);
  async function save() {
    try {
      await api("/auth/preferences", {
        method: "PUT",
        body: JSON.stringify({ email, appointmentReminders }),
      });
      setMessage("Preferences saved.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not save preferences.",
      );
    }
  }
  return (
    <View>
      <Text style={styles.eyebrow}>PREFERENCES</Text>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.muted}>Choose how Halo keeps you updated.</Text>
      <Pressable style={styles.preference} onPress={() => setEmail(!email)}>
        <Text style={styles.checkbox}>{email ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>Email reminders</Text>
          <Text style={styles.preferenceHint}>Salon updates and offers</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.preference}
        onPress={() => setAppointmentReminders(!appointmentReminders)}
      >
        <Text style={styles.checkbox}>{appointmentReminders ? "✓" : ""}</Text>
        <View>
          <Text style={styles.cardTextDark}>Appointment reminders</Text>
          <Text style={styles.preferenceHint}>Never miss your next visit</Text>
        </View>
      </Pressable>
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save preferences</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.subheading}>Recent notifications</Text>
      {history.length ? (
        history.map((item: any, index: number) => (
          <View
            style={styles.infoRow}
            key={`${item.id || item.createdAt || index}`}
          >
            <View style={styles.infoRowCopy}>
              <Text style={styles.cardTextDark}>
                {item.type || "Notification"}
              </Text>
              <Text style={styles.muted}>
                {item.status || "Sent"}
                {item.createdAt
                  ? ` · ${new Date(item.createdAt).toLocaleDateString()}`
                  : ""}
              </Text>
            </View>
            <Ionicons name="notifications-outline" size={18} color="#91b3a3" />
          </View>
        ))
      ) : (
        <Text style={styles.muted}>No notifications yet.</Text>
      )}
    </View>
  );
}
function BookingView({ salons }: { salons: any[] }) {
  const salon = salons[0];
  const services = salon?.services || [];
  const stylists = salon?.stylists || [];
  const [service, setService] = useState(services[0] || "Haircut");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00 AM");
  const [stylist, setStylist] = useState(stylists[0] || "");
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
      <Text style={styles.eyebrow}>BOOK A VISIT</Text>
      <Text style={styles.title}>Make space for your next visit.</Text>
      {!salon ? (
        <Text style={styles.muted}>No salons are open for booking.</Text>
      ) : (
        <>
          <Text style={styles.muted}>
            {salon.name} · {salon.location}
          </Text>
          <Text style={styles.label}>Service</Text>
          <View style={styles.choiceRow}>
            {services.map((item: string) => (
              <Pressable
                key={item}
                style={[styles.choice, service === item && styles.choiceActive]}
                onPress={() => setService(item)}
              >
                <Text>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-20"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <Text style={styles.label}>Time</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="10:00 AM"
            style={styles.input}
            placeholderTextColor="#9aa19c"
          />
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Tell us about your hair goals"
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
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </>
      )}
    </View>
  );
}
function PaymentView({ payments }: { payments: Payment[] }) {
  const [appointmentId, setAppointmentId] = useState("");
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
      <Text style={styles.eyebrow}>PAYMENTS</Text>
      <Text style={styles.title}>Payments and invoices</Text>
      <TextInput
        value={appointmentId}
        onChangeText={setAppointmentId}
        placeholder="Appointment ID"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void createIntent()}>
        <Text style={styles.primaryText}>Start payment</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState("");
  const update = async (id: string, status: "Published" | "Rejected") => {
    try {
      const saved = await api<any>(`/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...saved } : item));
      setMessage(`Review ${status.toLowerCase()}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update review.");
    }
  };
  return (
    <View>
      <Text style={styles.eyebrow}>STUDIO MANAGEMENT</Text>
      <Text style={styles.title}>Review moderation</Text>
      <Text style={styles.muted}>Publish or reject guest feedback before it appears publicly.</Text>
      {items.length ? items.map((item) => (
        <View style={styles.row} key={item.id}>
          <Text style={styles.cardTextDark}>{item.guestName || "Guest"} · {"★".repeat(Number(item.rating || 0))}</Text>
          <Text style={styles.muted}>{item.comment}</Text>
          <Text style={styles.cardText}>{item.status || "Pending"}</Text>
          {item.status === "Pending" ? (
            <View style={styles.actionRow}>
              <Pressable onPress={() => void update(item.id, "Published")}><Text style={styles.actionText}>Publish</Text></Pressable>
              <Pressable onPress={() => void update(item.id, "Rejected")}><Text style={styles.actionText}>Reject</Text></Pressable>
            </View>
          ) : null}
        </View>
      )) : <Text style={styles.muted}>No reviews yet.</Text>}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function ReviewView() {
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  async function submit() {
    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      setMessage("Review submitted for salon approval.");
      setComment("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not submit review.");
    }
  }
  return (
    <View>
      <Text style={styles.eyebrow}>YOUR EXPERIENCE</Text>
      <Text style={styles.title}>Share your experience</Text>
      <TextInput
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
        placeholder="Rating 1-5"
        style={styles.input}
        placeholderTextColor="#9aa19c"
      />
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Tell us about your visit"
        style={[styles.input, styles.multiline]}
        multiline
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void submit()}>
        <Text style={styles.primaryText}>Submit review</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function ProfileView({ profile, email }: { profile: Profile; email: string }) {
  return (
    <View>
      <Text style={styles.eyebrow}>YOUR PROFILE</Text>
      <Text style={styles.title}>{profile.name || "Your profile"}</Text>
      <Text style={styles.muted}>{profile.email || email}</Text>
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
      <Text style={styles.eyebrow}>HAIR PASSPORT</Text>
      <Text style={styles.title}>{guestName || "Your hair passport"}</Text>
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
        placeholder="Stylist notes"
        multiline
        style={[styles.input, styles.multiline]}
        placeholderTextColor="#9aa19c"
      />
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Save hair passport</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
function List({ title, items }: { title: string; items: string[] }) {
  return (
    <View>
      <Text style={styles.eyebrow}>HALO</Text>
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
  actionRow: { flexDirection: "row", gap: 18, marginTop: 10 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  metricCard: {
    width: "47%",
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 12,
    padding: 14,
  },
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
    fontSize: 28,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 18,
  },
  label: {
    color: "#20352d",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 8,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 13,
    color: "#20352d",
    marginBottom: 10,
  },
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
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
  },
  choiceActive: { backgroundColor: "#dceee8", borderColor: "#dceee8" },
  primary: {
    height: 48,
    borderRadius: 8,
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
  cardTextDark: { color: "#20352d" },
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
    borderColor: "#d9d6ce",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  historyBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e1d9",
    gap: 4,
  },
});

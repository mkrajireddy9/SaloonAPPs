import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../../src/api";
import { SafeAreaView } from "react-native-safe-area-context";

type Branch = {
  id: string;
  name: string;
  location: string;
  closedDays?: string[];
};
type Salon = {
  id: string;
  name: string;
  location?: string;
  services: string[];
  stylists: string[];
  branches?: Branch[];
  serviceDetails?: { name: string; price?: number; durationMinutes?: number }[];
  products?: { name: string; description?: string }[];
};
type Review = { id: string; guestName?: string; rating: number; comment?: string; createdAt?: string };
export default function SalonDetails() {
  const { id, hairstyle } = useLocalSearchParams<{
    id: string;
    hairstyle?: string;
  }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState("");
  const [stylist, setStylist] = useState("");
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const branch = useMemo(
    () =>
      salon?.branches?.find((item) => item.id === branchId) ||
      salon?.branches?.[0],
    [salon, branchId],
  );
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setMessage("");
    api<Salon>(`/salon/${id}`)
      .then((result) => {
        setSalon(result);
        setService(result.services?.[0] || "");
        setStylist(result.stylists?.[0] || "");
        setBranchId(result.branches?.[0]?.id || "");
        if (hairstyle) setNotes(`AI hairstyle request: ${hairstyle}`);
      })
      .catch((e) =>
        setMessage(
          e instanceof Error ? e.message : "Unable to load this salon.",
        ),
      )
      .finally(() => setLoading(false));
    api<Review[]>(`/reviews?salonId=${encodeURIComponent(id)}`)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id, hairstyle]);
  useEffect(() => {
    if (!salon || !date || !service || !branch?.id) return;
    api<string[]>(
      `/appointments/slots?date=${encodeURIComponent(date)}&salonId=${encodeURIComponent(salon.id)}&branchId=${encodeURIComponent(branch.id)}&stylist=${encodeURIComponent(stylist)}&service=${encodeURIComponent(service)}`,
    )
      .then((result) => {
        setSlots(result);
        setTime(result[0] || "");
      })
      .catch(() => {
        setSlots([]);
        setTime("");
      });
  }, [salon, date, service, stylist, branch]);
  const submit = async () => {
    if (!salon || !date || !time || !service || !branch?.id)
      return setMessage("Choose a branch, service, date, and time.");
    setBusy(true);
    setMessage("");
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          salonId: salon.id,
          service,
          branchId: branch.id,
          date,
          time,
          stylist,
          notes,
        }),
      });
      setMessage("Appointment request sent.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to request appointment.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.center}>
          <ActivityIndicator color="#c55239" />
          <Text style={s.muted}>Loading salon...</Text>
        </View>
      </SafeAreaView>
    );
  if (!salon)
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.center}>
          <Text style={s.error}>{message || "Unable to load this salon."}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={s.back}>‹ Back to salons</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>‹ Back to salons</Text>
        </Pressable>
        <Text style={s.eyebrow}>BOOK A VISIT</Text>
        <Text style={s.title}>{salon.name}</Text>
        <Text style={s.muted}>{salon.location || "Location not set"}</Text>
        <View style={s.ratingCard}>
          <View style={s.ratingSummary}>
            <Text style={s.ratingValue}>
              {reviews.length
                ? (reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1)
                : "—"}
            </Text>
            <View>
              <Text style={s.stars}>{reviews.length ? "★".repeat(Math.round(reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length)) : "☆☆☆☆☆"}</Text>
              <Text style={s.muted}>{reviews.length ? `${reviews.length} guest rating${reviews.length === 1 ? "" : "s"}` : "No ratings yet"}</Text>
            </View>
          </View>
          {reviews.length ? reviews.slice(0, 3).map((review) => (
            <View style={s.reviewRow} key={review.id}>
              <View style={s.reviewTopline}>
                <Text style={s.choiceText}>{review.guestName || "Guest"}</Text>
                <Text style={s.starsSmall}>{"★".repeat(Number(review.rating || 0))}</Text>
              </View>
              {review.comment ? <Text style={s.muted}>{review.comment}</Text> : null}
            </View>
          )) : null}
        </View>
        <View style={s.catalogCard}>
          <Text style={s.catalogTitle}>Services and products at {salon.name}</Text>
          {salon.serviceDetails?.length ? (
            <>
              <Text style={s.catalogLabel}>SERVICES</Text>
              {salon.serviceDetails.map((item) => (
                <View style={s.catalogRow} key={item.name}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.choiceText}>{item.name}</Text>
                    <Text style={s.muted}>{item.durationMinutes || 60} minutes</Text>
                  </View>
                  <Text style={s.price}>{item.price != null ? `₹${item.price}` : "Price on request"}</Text>
                </View>
              ))}
            </>
          ) : null}
          {salon.products?.length ? (
            <>
              <Text style={s.catalogLabel}>PRODUCTS USED</Text>
              {salon.products.map((item) => (
                <View style={s.catalogRow} key={item.name}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.choiceText}>{item.name}</Text>
                    {item.description ? <Text style={s.muted}>{item.description}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}
          {!salon.serviceDetails?.length && !salon.products?.length ? (
            <Text style={s.muted}>This salon has not published its catalog yet.</Text>
          ) : null}
        </View>
        <Text style={s.label}>Branch</Text>
        <View style={s.choices}>
          {(salon.branches || []).map((item) => (
            <Pressable
              key={item.id}
              style={[s.choice, branch?.id === item.id && s.selected]}
              onPress={() => setBranchId(item.id)}
            >
              <Text style={s.choiceText}>{item.name}</Text>
              <Text style={s.muted}>{item.location}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>Service</Text>
        <View style={s.choices}>
          {salon.services.map((item) => (
            <Pressable
              key={item}
              style={[s.choice, service === item && s.selected]}
              onPress={() => setService(item)}
            >
              <Text style={s.choiceText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>Preferred stylist</Text>
        <View style={s.choices}>
          {salon.stylists.map((item) => (
            <Pressable
              key={item}
              style={[s.choice, stylist === item && s.selected]}
              onPress={() => setStylist(item)}
            >
              <Text style={s.choiceText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="2026-10-20"
          style={s.input}
        />
        <Text style={s.label}>Available time</Text>
        <View style={s.timeChoices}>
          {slots.map((item) => (
            <Pressable
              key={item}
              style={[s.timeChoice, time === item && s.selected]}
              onPress={() => setTime(item)}
            >
              <Text style={s.choiceText}>{item}</Text>
            </Pressable>
          ))}
          {date && !slots.length ? (
            <Text style={s.muted}>No slots available for this date.</Text>
          ) : null}
        </View>
        <Text style={s.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Tell us about your hair goals"
          multiline
          style={[s.input, s.multiline]}
        />
        <Pressable
          disabled={busy}
          style={s.primary}
          onPress={() => void submit()}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryText}>Request appointment</Text>
          )}
        </Pressable>
        {message ? (
          <Text style={message.includes("sent") ? s.success : s.error}>
            {message}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 50 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f5f0",
  },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 22,
  },
  title: {
    color: "#20352d",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 12,
  },
  back: { color: "#c55239", fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 6 },
  catalogCard: { backgroundColor: "#fffdfa", borderRadius: 12, borderWidth: 1, borderColor: "#d9d6ce", padding: 14, marginTop: 18 },
  catalogTitle: { color: "#20352d", fontSize: 16, fontWeight: "700" },
  catalogLabel: { color: "#91b3a3", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginTop: 16, marginBottom: 6 },
  catalogRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#eeeae2", paddingVertical: 10 },
  price: { color: "#c55239", fontWeight: "800", marginLeft: 8 },
  ratingCard: { backgroundColor: "#20352d", borderRadius: 12, padding: 14, marginTop: 18 },
  ratingSummary: { flexDirection: "row", alignItems: "center", gap: 12 },
  ratingValue: { color: "#fffdfa", fontSize: 30, fontWeight: "800" },
  stars: { color: "#dfca73", fontSize: 18, letterSpacing: 2 },
  starsSmall: { color: "#dfca73", fontSize: 13, letterSpacing: 1 },
  reviewRow: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)", marginTop: 12, paddingTop: 10 },
  reviewTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: {
    color: "#20352d",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  choices: { gap: 8 },
  timeChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChoice: {
    minWidth: 92,
    alignItems: "center",
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  choice: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
  },
  selected: { borderColor: "#c55239", backgroundColor: "#fff4ef" },
  choiceText: { color: "#20352d", fontWeight: "700" },
  input: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 13,
    color: "#20352d",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  primary: {
    backgroundColor: "#c55239",
    borderRadius: 9,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  success: { color: "#4c947d", marginTop: 14, textAlign: "center" },
  error: { color: "#c55239", marginTop: 14, textAlign: "center" },
});

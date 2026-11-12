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

type Passport = {
  guestName?: string;
  texture?: string;
  length?: string;
  preferredStylist?: string;
  notes?: string;
  styles?: Record<string, string>[];
  history?: Record<string, string>[];
};

export default function Passport() {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [guestName, setGuestName] = useState("");
  const [texture, setTexture] = useState("");
  const [length, setLength] = useState("");
  const [preferredStylist, setPreferredStylist] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<Passport>("/passport")
      .then((result) => {
        setPassport(result);
        setGuestName(result.guestName || "");
        setTexture(result.texture || "");
        setLength(result.length || "");
        setPreferredStylist(result.preferredStylist || "");
        setNotes(result.notes || "");
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your hair passport.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<Passport>("/passport", {
        method: "PUT",
        body: JSON.stringify({
          guestName,
          texture,
          length,
          preferredStylist,
          notes,
        }),
      });
      setPassport(result);
      setMessage("Hair passport saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your hair passport.",
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
          <Text style={s.muted}>Loading your hair passport...</Text>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>YOUR HAIR STORY</Text>
        <Text style={s.title}>Hair passport</Text>
        <Text style={s.subtitle}>
          Keep your preferences ready for every salon visit.
        </Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {passport?.guestName || guestName || "Your personal hair profile"}
          </Text>
          <Text style={s.cardCopy}>
            Your stylist can use these details to prepare for your next visit.
          </Text>
        </View>
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Your hair profile</Text>
          <View style={s.profileGrid}>
            <ProfileItem label="Texture" value={texture || "Not added"} />
            <ProfileItem label="Length" value={length || "Not added"} />
            <ProfileItem
              label="Preferred stylist"
              value={preferredStylist || "Not added"}
            />
            <ProfileItem
              label="Saved looks"
              value={String(passport?.styles?.length || 0)}
            />
          </View>
        </View>
        <View style={s.rebookCard}>
          <Text style={s.rebookEyebrow}>NEXT GOOD HAIR DAY</Text>
          <Text style={s.rebookTitle}>Ready to plan your next visit?</Text>
          <Text style={s.rebookCopy}>
            Your passport keeps your preferences ready for a smoother salon
            conversation.
          </Text>
        </View>
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Saved looks</Text>
            <Text style={s.count}>{passport?.styles?.length || 0}</Text>
          </View>
          {passport?.styles?.length ? (
            passport.styles.map((style, index) => (
              <View style={s.lookRow} key={`${style.name || "look"}-${index}`}>
                <View style={s.lookIcon}>
                  <Text style={s.lookIconText}>✦</Text>
                </View>
                <View style={s.lookCopy}>
                  <Text style={s.lookName}>{style.name || "Saved hairstyle"}</Text>
                  <Text style={s.muted}>{style.meta || "AI hairstyle look"}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={s.muted}>
              Your saved AI looks will appear here after you choose a favorite.
            </Text>
          )}
        </View>
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Visit history</Text>
            <Text style={s.count}>{passport?.history?.length || 0}</Text>
          </View>
          {passport?.history?.length ? (
            passport.history.slice(0, 4).map((visit, index) => (
              <View style={s.visitRow} key={`${visit.id || "visit"}-${index}`}>
                <Text style={s.visitDate}>{visit.date || "Recent visit"}</Text>
                <Text style={s.visitService}>
                  {visit.service || "Salon appointment"}
                  {visit.stylist ? ` · ${visit.stylist}` : ""}
                </Text>
              </View>
            ))
          ) : (
            <Text style={s.muted}>
              Completed appointments will become part of your hair story here.
            </Text>
          )}
        </View>
        <Text style={s.label}>Guest name</Text>
        <TextInput
          value={guestName}
          onChangeText={setGuestName}
          placeholder="Your name"
          style={s.input}
        />
        <Text style={s.label}>Hair texture</Text>
        <TextInput
          value={texture}
          onChangeText={setTexture}
          placeholder="e.g. Wavy, curly, straight"
          style={s.input}
        />
        <Text style={s.label}>Hair length</Text>
        <TextInput
          value={length}
          onChangeText={setLength}
          placeholder="e.g. Shoulder length"
          style={s.input}
        />
        <Text style={s.label}>Preferred stylist</Text>
        <TextInput
          value={preferredStylist}
          onChangeText={setPreferredStylist}
          placeholder="Stylist name"
          style={s.input}
        />
        <Text style={s.label}>Stylist notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add anything your stylist should know"
          multiline
          style={[s.input, s.multiline]}
        />
        <Pressable
          disabled={busy}
          style={s.primary}
          onPress={() => void save()}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryText}>Save hair passport</Text>
          )}
        </Pressable>
        {message ? (
          <Text style={message.includes("saved") ? s.success : s.error}>
            {message}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.profileItem}>
      <Text style={s.profileLabel}>{label}</Text>
      <Text style={s.profileValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 44 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f5f0",
  },
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
  card: {
    backgroundColor: "#20352d",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  cardCopy: { color: "#c8d2cb", lineHeight: 20, marginTop: 8 },
  sectionCard: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#dedbd2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: "#20352d", fontSize: 17, fontWeight: "800" },
  count: {
    color: "#c55239",
    backgroundColor: "#f7f5f0",
    borderRadius: 99,
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center",
    fontWeight: "800",
  },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  profileItem: { width: "46%" },
  profileLabel: { color: "#91b3a3", fontSize: 11, fontWeight: "700" },
  profileValue: { color: "#20352d", fontWeight: "700", marginTop: 4 },
  rebookCard: {
    backgroundColor: "#f7f5f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  rebookEyebrow: {
    color: "#4c947d",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  rebookTitle: { color: "#20352d", fontSize: 18, fontWeight: "800", marginTop: 7 },
  rebookCopy: { color: "#77817c", lineHeight: 19, marginTop: 5 },
  lookRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  lookIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f7f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  lookIconText: { color: "#c55239", fontSize: 20 },
  lookCopy: { flex: 1, marginLeft: 11 },
  lookName: { color: "#20352d", fontWeight: "800" },
  visitRow: {
    borderTopWidth: 1,
    borderTopColor: "#eeeae2",
    paddingVertical: 11,
  },
  visitDate: { color: "#20352d", fontWeight: "800" },
  visitService: { color: "#77817c", marginTop: 4 },
  label: {
    color: "#20352d",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 9,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 13,
    color: "#20352d",
  },
  multiline: { height: 96, paddingTop: 13, textAlignVertical: "top" },
  primary: {
    backgroundColor: "#c55239",
    minHeight: 50,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  muted: { color: "#77817c", marginTop: 8 },
  success: { color: "#4c947d", textAlign: "center", marginTop: 12 },
  error: { color: "#c55239", textAlign: "center", marginTop: 12 },
});

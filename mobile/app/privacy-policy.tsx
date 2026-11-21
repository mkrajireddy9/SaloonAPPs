import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.nav}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={19} color="#20352d" />
          </Pressable>
          <Text style={s.navLabel}>HALO LEGAL</Text>
        </View>
        <View style={s.hero}>
          <View style={s.heroTop}><View style={s.heroIcon}><Ionicons name="shield-checkmark-outline" size={20} color="#dfca73" /></View><Text style={s.eyebrow}>YOUR TRUST</Text></View>
          <Text style={s.title}>Privacy policy</Text>
          <Text style={s.subtitle}>
            A clear look at how Halo handles your information.
          </Text>
        </View>
        <View style={s.updatedPill}><Ionicons name="time-outline" size={13} color="#4c947d" /><Text style={s.updated}>Updated 10 November 2026</Text></View>
        <View style={s.card}>
          <Text style={s.cardTitle}>Your privacy matters</Text>
          <Text style={s.body}>
            Halo uses the information you provide to support salon discovery,
            appointments, your profile, and your hair passport. Your account
            data is sent securely to the Halo API and is not stored directly by
            this mobile application.
          </Text>
        </View>
        <View style={s.card}>
          <View style={s.sectionNumber}><Text style={s.sectionNumberText}>01</Text></View>
          <Text style={s.heading}>Images and consent</Text>
          <Text style={s.body}>
            Only upload images when you understand how they will be used for
            your consultation. The app will request explicit consent for
            supported image workflows.
          </Text>
        </View>
        <Text style={s.footer}>
          Questions about your data? Contact the Halo team through your salon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 18, paddingBottom: 44 },
  nav: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  navLabel: {
    color: "#77817c",
    fontWeight: "800",
    letterSpacing: 1.4,
    fontSize: 10,
  },
  hero: {
    backgroundColor: "#20352d",
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  heroIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "rgba(223,202,115,0.16)", alignItems: "center", justifyContent: "center" },
  eyebrow: {
    color: "#a9c9ba",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 14 },
  subtitle: { color: "#c8d2cb", fontSize: 14, lineHeight: 21, marginTop: 8 },
  updatedPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, backgroundColor: "#e7f1ed", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12 },
  updated: {
    color: "#4c947d",
    fontSize: 10,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#20352d",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTitle: {
    color: "#20352d",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#fff1ed", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  sectionNumberText: {
    color: "#c55239",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#20352d",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 4,
  },
  body: { color: "#66756d", fontSize: 14, lineHeight: 22 },
  footer: {
    color: "#9aa19c",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
});

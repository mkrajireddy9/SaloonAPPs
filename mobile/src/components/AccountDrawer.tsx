import { router } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "../api";

type Props = { profile?: { name?: string; email?: string } | null };
const items = [
  {
    label: "My account",
    description: "Personal details and history",
    icon: "person-outline",
    section: "account",
  },
];
const rewardItems = [
  {
    label: "Refer a friend",
    description: "Share Halo and earn rewards",
    icon: "gift-outline",
    section: "rewards-referral",
  },
  {
    label: "Coupons",
    description: "Apply a salon offer",
    icon: "pricetag-outline",
    section: "rewards-coupons",
  },
];
const legalItems = [
  {
    label: "Privacy policy",
    description: "How Halo uses your information",
    icon: "shield-checkmark-outline",
    route: "/privacy-policy",
  },
  {
    label: "Terms of use",
    description: "Rules for using Halo",
    icon: "document-text-outline",
    route: "/terms",
  },
];

export function AccountDrawer({ profile }: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const open = (section: string) => {
    setVisible(false);
    setTimeout(() => {
      if (section.startsWith("route:"))
        router.push(section.replace("route:", "") as any);
      else if (section === "account")
        router.push({
          pathname: "/(tabs)/account",
          params: { fromDrawer: "1" },
        });
      else if (section.startsWith("rewards-"))
        router.push({
          pathname: "/rewards",
          params: { mode: section.replace("rewards-", ""), fromDrawer: "1" },
        });
      else
        router.push({
          pathname: "/(tabs)/more",
          params: { section, drawer: Date.now().toString(), fromDrawer: "1" },
        });
    }, 0);
  };
  const openLegal = (route: string) => {
    setVisible(false);
    setTimeout(() => router.push(route as any), 0);
  };
  const logout = async () => {
    setVisible(false);
    await signOut();
    setTimeout(() => router.replace("/(auth)/login"), 0);
  };
  return (
    <>
      <Pressable
        accessibilityLabel="Open account menu"
        style={s.trigger}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="menu-outline" size={25} color="#20352d" />
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={s.modalRoot}>
          <Pressable style={s.scrim} onPress={() => setVisible(false)} />
          <View
            style={[
              s.drawer,
              {
                paddingTop: insets.top + 24,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.drawerContent}
            >
              <View style={s.drawerHeader}>
              <View style={s.drawerAvatar}>
                <Text style={s.drawerAvatarText}>
                  {(profile?.name || profile?.email || "H")
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={s.identity}>
                <Text style={s.drawerTitle}>
                  {profile?.name || "Your account"}
                </Text>
                <Text style={s.drawerEmail}>
                  {profile?.email || "Halo guest"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close account menu"
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={24} color="#77817c" />
              </Pressable>
            </View>
              <View
              style={{
                backgroundColor: "#20352d",
                borderRadius: 16,
                padding: 12,
                marginTop: 12,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: "#a9c9ba",
                  fontSize: 10,
                  fontWeight: "800",
                  letterSpacing: 1.4,
                }}
              >
                HALO MEMBER
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 3,
                }}
              >
                Your salon space
              </Text>
              <Text style={{ color: "#c8d2cb", fontSize: 11, marginTop: 3 }}>
                Everything you need for your next visit.
              </Text>
              </View>
              <Text style={[s.eyebrow, { marginTop: 0 }]}>ACCOUNT</Text>
              {items.map((item) => (
                <Pressable
                  key={item.section}
                  style={s.item}
                  onPress={() => open(item.section)}
                >
                  <View style={s.icon}>
                    <Ionicons name={item.icon as any} size={20} color="#c55239" />
                  </View>
                  <View style={s.copy}>
                    <Text style={s.itemTitle}>{item.label}</Text>
                    <Text style={s.itemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#a7afa9" />
                </Pressable>
              ))}
              <Text style={[s.eyebrow, { marginTop: 22 }]}>REWARDS</Text>
              {rewardItems.map((item) => (
                <Pressable
                  key={item.section}
                  style={s.item}
                  onPress={() => open(item.section)}
                >
                  <View style={s.icon}>
                    <Ionicons name={item.icon as any} size={20} color="#c55239" />
                  </View>
                  <View style={s.copy}>
                    <Text style={s.itemTitle}>{item.label}</Text>
                    <Text style={s.itemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#a7afa9" />
                </Pressable>
              ))}
              <View style={s.footer}>
                <View style={s.footerLinks}>
                  {legalItems.map((item) => (
                    <Pressable
                      key={item.route}
                      onPress={() => openLegal(item.route)}
                    >
                      <Text style={s.footerLink}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={s.signOutButton} onPress={() => void logout()}>
                  <Ionicons name="log-out-outline" size={18} color="#c55239" />
                  <Text style={s.footerSignOut}>Sign out</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    alignItems: "center",
    justifyContent: "center",
  },
  modalRoot: { flex: 1, flexDirection: "row" },
  scrim: { flex: 1, backgroundColor: "rgba(32,53,45,0.42)" },
  drawer: {
    width: "84%",
    height: "100%",
    flexDirection: "column",
    maxWidth: 360,
    backgroundColor: "#f7f5f0",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  drawerContent: { paddingBottom: 8 },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e1d9",
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#20352d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  drawerAvatarText: { color: "#fff", fontSize: 19, fontWeight: "800" },
  identity: { flex: 1 },
  drawerTitle: { color: "#20352d", fontSize: 16, fontWeight: "800" },
  drawerEmail: { color: "#77817c", fontSize: 12, marginTop: 4 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 10,
  },
  item: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e1d9",
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#f8e5df",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  copy: { flex: 1 },
  itemTitle: { color: "#20352d", fontSize: 13, fontWeight: "800" },
  itemDescription: { color: "#77817c", fontSize: 10, marginTop: 2 },
  divider: { height: 1, backgroundColor: "#d9d6ce", marginVertical: 18 },
  footer: { marginTop: "auto" },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 18,
    paddingVertical: 2,
    marginBottom: 10,
  },
  signOutButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e7b8ad",
    backgroundColor: "#fff4f1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerLink: {
    color: "#5e6c65",
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footerSignOut: { color: "#c55239", fontSize: 12, fontWeight: "800" },
});

import { MoreScreen } from "../../src/screens/MoreScreen";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function More() {
  const params = useLocalSearchParams<{
    section?: string | string[];
    drawer?: string;
    fromDrawer?: string | string[];
  }>();
  const section = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const fromDrawer = Array.isArray(params.fromDrawer)
    ? params.fromDrawer[0]
    : params.fromDrawer;
  return (
    <SafeAreaView style={s.screen}>
      <MoreScreen
        key={`${section || "booking"}-${params.drawer || ""}`}
        role="user"
        email=""
        initialSection={section}
        showBack={fromDrawer === "1"}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
});

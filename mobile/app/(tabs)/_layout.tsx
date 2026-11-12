import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#c55239",
        tabBarInactiveTintColor: "#77817c",
        tabBarStyle: {
          width: "100%",
          height: 66,
          margin: 0,
          paddingTop: 5,
          paddingBottom: 8,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="directory"
        options={{
          title: "Find",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI Studio",
          tabBarActiveTintColor: "#c55239",
          tabBarInactiveTintColor: "#c55239",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[s.aiTabIcon, focused && s.aiTabIconFocused]}>
              <Ionicons
                name="sparkles"
                size={focused ? size + 2 : size}
                color={focused ? "#fffdfa" : String(color)}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: "Passport",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="sparkles-outline"
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  aiTabIcon: {
    width: 42,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTabIconFocused: {
    width: 48,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c55239",
    marginTop: -8,
    shadowColor: "#20352d",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});

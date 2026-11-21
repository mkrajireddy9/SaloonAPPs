import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const visibleTabs = ["directory", "appointments", "ai", "passport", "more"];
const icons = {
  directory: ["home-outline", "home"],
  appointments: ["calendar-outline", "calendar"],
  ai: ["chatbubble-ellipses-outline", "chatbubble-ellipses"],
  passport: ["book-outline", "book"],
  more: ["person-outline", "person"],
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HaloTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#dfca73",
        tabBarInactiveTintColor: "#b5c2bb",
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="directory"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Bookings",
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "Assistant",
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: "Passport",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="salon"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

function HaloTabBar({ state, descriptors }: any) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((route: { name: string }) => visibleTabs.includes(route.name));

  return (
    <View style={[s.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.tabBar}>
        {routes.map((route: { key: string; name: keyof typeof icons; params?: object }) => {
          const routeIndex = state.routes.findIndex((item: { key: string }) => item.key === route.key);
          const focused = state.index === routeIndex;
          const options = descriptors[route.key]?.options || {};
          const title = typeof options.tabBarLabel === "string" ? options.tabBarLabel : options.title || route.name;
          const iconName = focused ? icons[route.name][1] : icons[route.name][0];
          const color = focused ? "#dfca73" : "#b5c2bb";

          const onPress = () => {
            if (!focused) router.navigate({ pathname: `/(tabs)/${route.name}` as any, params: route.params as any });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || String(title)}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={s.tabButton}
            >
              <View style={[s.tabItem, focused && s.tabItemFocused]}>
                <Ionicons name={iconName} size={21} color={color} />
                <Text style={[s.tabLabel, { color }]}>{title}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tabBarOuter: {
    paddingTop: 6,
    paddingHorizontal: 14,
    backgroundColor: "transparent",
  },
  tabBar: {
    height: 72,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: "#20352d",
    borderRadius: 30,
    shadowColor: "#13231d",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabItemFocused: {
    backgroundColor: "rgba(197, 82, 57, 0.16)",
    borderColor: "#c55239",
    shadowOpacity: 0,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
